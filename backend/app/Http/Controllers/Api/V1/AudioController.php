<?php

namespace App\Http\Controllers\Api\V1;

use App\Abstracts\Repositories\AudioFileRepositoryInterface;
use App\Abstracts\Services\AudioServiceInterface;
use App\Abstracts\Services\ConfigurationServiceInterface;
use App\Constants\AudioFileStatus;
use App\Constants\Messages;
use App\Events\AudioFileStatusUpdated;
use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\ChunkedUploadSession;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AudioController extends Controller
{
    protected AudioServiceInterface $audioService;
    protected AudioFileRepositoryInterface $audioFileRepository;
    protected ConfigurationServiceInterface $configService;

    public function __construct(
        AudioServiceInterface $audioService,
        AudioFileRepositoryInterface $audioFileRepository,
        ConfigurationServiceInterface $configService
    ) {
        $this->audioService = $audioService;
        $this->audioFileRepository = $audioFileRepository;
        $this->configService = $configService;
    }

    /**
     * Display a listing of audio files
     * GET /api/v1/audio-files
     */
    public function index(): JsonResponse
    {
        try {
            $audioFiles = $this->audioFileRepository->getAllWithTranscripts()
                ->map(fn ($file) => [
                    'id' => $file->id,
                    'filename' => $file->original_filename,
                    'status' => $file->status,
                    'duration' => $file->duration ? (float) $file->duration : null,
                    'file_size' => $file->file_size ? (int) $file->file_size : null,
                    'mime_type' => $file->mime_type,
                    'has_transcript' => $file->transcript !== null,
                    'created_at' => $file->created_at,
                    'updated_at' => $file->updated_at,
                ]);

            return ApiResponse::success($audioFiles);

        } catch (Exception $e) {
            Log::error("AudioController index error: {$e->getMessage()}", [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            $response = ApiResponse::serverError(Messages::RETRIEVE_FILES_FAILED);

            // Add debug information if in debug mode
            if (config('app.debug')) {
                return ApiResponse::withDebug($response, [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);
            }

            return $response;
        }
    }

    /**
     * Store a newly created audio file
     * POST /api/v1/audio-files
     */
    public function store(Request $request): JsonResponse
    {
        if ($request->hasFile('audio_file')) {
            $file = $request->file('audio_file');
            Log::info('File upload attempt', [
                'original_name' => $file->getClientOriginalName(),
                'detected_mime_type' => $file->getMimeType(),
                'file_extension' => $file->getClientOriginalExtension(),
                'file_size' => $file->getSize()
            ]);
        }

        // Get dynamic configuration
        $uploadConfig = $this->configService->getUploadConfig();
        $mimeTypes = implode(',', $uploadConfig['allowed_mime_types']);
        $maxFileSizeKB = $uploadConfig['max_file_size_bytes'] / 1024; // Convert to KB for validation

        Log::info('Upload validation configuration', [
            'max_file_size_bytes' => $uploadConfig['max_file_size_bytes'],
            'max_file_size_kb' => $maxFileSizeKB,
            'max_file_size_mb' => $maxFileSizeKB / 1024,
            'file_size_bytes' => $request->hasFile('audio_file') ? $request->file('audio_file')->getSize() : null,
            'file_size_kb' => $request->hasFile('audio_file') ? $request->file('audio_file')->getSize() / 1024 : null,
            'file_size_mb' => $request->hasFile('audio_file') ? $request->file('audio_file')->getSize() / 1024 / 1024 : null,
        ]);

        $validator = Validator::make($request->all(), [
            'audio_file' => "required|file|mimetypes:{$mimeTypes}|max:{$maxFileSizeKB}",
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            $file = $request->file('audio_file');

            // Additional validation using configuration service
            $uploadConfig = $this->configService->getUploadConfig();

            if (! $this->configService->isFileTypeSupported($file->getMimeType())) {
                $supportedFormats = implode(', ', $uploadConfig['allowed_extensions']);
                return ApiResponse::error(
                    "Unsupported file type '{$file->getMimeType()}'. Supported formats: {$supportedFormats}",
                    400
                );
            }

            if (! $this->configService->validateFileSize($file->getMimeType(), $file->getSize())) {
                $maxSizeMB = round($uploadConfig['max_file_size_bytes'] / 1024 / 1024, 1);
                return ApiResponse::error(
                    "File size exceeds the maximum allowed size of {$maxSizeMB}MB for this file type.",
                    400
                );
            }

            // Generate unique filename
            $timestamp = time();
            $originalName = $file->getClientOriginalName();
            $filename = "{$timestamp}_{$originalName}";
            $filePath = $file->storeAs('audio-files', $filename, 'public');

            // Create audio file record with UPLOADING status
            $audioFile = $this->audioFileRepository->create([
                'filename' => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'file_size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'status' => AudioFileStatus::UPLOADING
            ]);

            // Immediately broadcast UPLOADING status
            broadcast(new AudioFileStatusUpdated($audioFile, AudioFileStatus::UPLOADING, 10));

            // Return response immediately with uploading status
            $response = ApiResponse::created([
                'id' => $audioFile->id,
                'filename' => $audioFile->original_filename,
                'status' => AudioFileStatus::UPLOADING,
                'upload_time' => $audioFile->created_at
            ]);

            // Process audio file asynchronously after response is sent
            $this->audioService->processAudioAsyncWithWebSocket($audioFile);

            return $response;

        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("AudioController database error: {$e->getMessage()}", [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return ApiResponse::serverError('Database error occurred while processing the upload.');
        } catch (\Illuminate\Contracts\Filesystem\FileNotFoundException $e) {
            Log::error("AudioController file system error: {$e->getMessage()}", [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return ApiResponse::serverError('File storage error occurred.');
        } catch (Exception $e) {
            Log::error("AudioController upload error: {$e->getMessage()}", [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return ApiResponse::serverError(Messages::UPLOAD_FAILED);
        }
    }

    /**
     * Display the specified audio file
     * GET /api/v1/audio-files/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            $audioFile = $this->audioFileRepository->findWithTranscript($id);

            if (! $audioFile) {
                return ApiResponse::notFound(Messages::AUDIO_FILE_NOT_FOUND);
            }

            return ApiResponse::success([
                'id' => $audioFile->id,
                'filename' => $audioFile->original_filename,
                'status' => $audioFile->status,
                'duration' => $audioFile->duration ? (float) $audioFile->duration : null,
                'file_size' => $audioFile->file_size ? (int) $audioFile->file_size : null,
                'mime_type' => $audioFile->mime_type,
                'has_transcript' => $audioFile->transcript !== null,
                'processing_metadata' => $audioFile->processing_metadata,
                'created_at' => $audioFile->created_at,
                'updated_at' => $audioFile->updated_at
            ]);

        } catch (Exception $e) {
            return ApiResponse::notFound(Messages::AUDIO_FILE_NOT_FOUND);
        }
    }

    /**
     * Download the specified audio file
     * GET /api/v1/audio-files/{id}/download
     */
    public function download(string $id): mixed
    {
        try {
            $audioFile = $this->audioFileRepository->findById($id);

            if (! $audioFile) {
                return ApiResponse::notFound(Messages::AUDIO_FILE_NOT_FOUND);
            }

            $filePath = storage_path("app/public/{$audioFile->file_path}");

            if (! file_exists($filePath)) {
                return ApiResponse::notFound('Audio file not found on disk');
            }

            $fileContent = file_get_contents($filePath);
            $mimeType = $audioFile->mime_type ?? 'application/octet-stream';
            $fileSize = filesize($filePath);

            return response($fileContent)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'attachment; filename="'.$audioFile->original_filename.'"')
                ->header('Content-Length', $fileSize);

        } catch (Exception $e) {
            Log::error("AudioController download error: {$e->getMessage()}", [
                'id' => $id,
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to download audio file');
        }
    }

    /**
     * Stream the specified audio file
     * GET /api/v1/audio-files/{id}/stream
     */
    public function stream(string $id): mixed
    {
        try {
            $audioFile = $this->audioFileRepository->findById($id);

            if (! $audioFile) {
                return ApiResponse::notFound(Messages::AUDIO_FILE_NOT_FOUND);
            }

            $filePath = storage_path("app/public/{$audioFile->file_path}");

            if (! file_exists($filePath)) {
                return ApiResponse::notFound('Audio file not found on disk');
            }

            $fileContent = file_get_contents($filePath);
            $mimeType = $audioFile->mime_type ?? 'application/octet-stream';
            $fileSize = filesize($filePath);

            return response($fileContent)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline; filename="'.$audioFile->original_filename.'"')
                ->header('Content-Length', $fileSize)
                ->header('Accept-Ranges', 'bytes');

        } catch (Exception $e) {
            Log::error("AudioController stream error: {$e->getMessage()}", [
                'id' => $id,
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to stream audio file');
        }
    }

    /**
     * Get upload configuration
     * GET /api/v1/audio-files/config
     */
    public function config(): JsonResponse
    {
        $config = $this->configService->getUploadConfig();
        return ApiResponse::success($config);
    }

    /**
     * Get list of backup files
     * GET /api/v1/audio-files/backups
     */
    public function backups(): JsonResponse
    {
        try {
            $backupFiles = $this->audioService->getBackupFiles();

            return ApiResponse::success([
                'backup_files' => $backupFiles,
                'count' => count($backupFiles),
                'backup_directory' => 'storage/audio-backups'
            ]);

        } catch (Exception $e) {
            Log::error("AudioController getBackupFiles error: {$e->getMessage()}", [
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to retrieve backup files');
        }
    }

    /**
     * Download a backup file
     * GET /api/v1/audio-files/backups/{filename}/download
     */
    public function downloadBackup(string $filename): mixed
    {
        try {
            $fileData = $this->audioService->getBackupFileContent($filename);

            if (! $fileData) {
                return ApiResponse::notFound('Backup file not found');
            }

            return response($fileData['content'])
                ->header('Content-Type', $fileData['mime_type'])
                ->header('Content-Disposition', 'attachment; filename="'.$filename.'"')
                ->header('Content-Length', $fileData['size']);

        } catch (Exception $e) {
            Log::error("AudioController downloadBackup error: {$e->getMessage()}", [
                'filename' => $filename,
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to download backup file');
        }
    }

    /**
     * Stream a backup file
     * GET /api/v1/audio-files/backups/{filename}/stream
     */
    public function streamBackup(string $filename): mixed
    {
        try {
            $fileData = $this->audioService->getBackupFileContent($filename);

            if (! $fileData) {
                return ApiResponse::notFound('Backup file not found');
            }

            return response($fileData['content'])
                ->header('Content-Type', $fileData['mime_type'])
                ->header('Content-Disposition', 'inline; filename="'.$filename.'"')
                ->header('Content-Length', $fileData['size'])
                ->header('Accept-Ranges', 'bytes');

        } catch (Exception $e) {
            Log::error("AudioController streamBackup error: {$e->getMessage()}", [
                'filename' => $filename,
                'exception' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to stream backup file');
        }
    }

    /**
     * Initialize chunked upload session
     * POST /api/v1/audio-files/chunked/initialize
     */
    public function initializeChunkedUpload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'filename' => 'required|string|max:255',
            'fileSize' => 'required|integer|min:1',
            'totalChunks' => 'required|integer|min:1',
            'mimeType' => 'required|string'
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            // Validate file type and size using configuration service
            $uploadConfig = $this->configService->getUploadConfig();

            if (! in_array($request->mimeType, $uploadConfig['allowed_mime_types'])) {
                $supportedFormats = implode(', ', $uploadConfig['allowed_extensions']);
                return ApiResponse::error(
                    "Unsupported file type '{$request->mimeType}'. Supported formats: {$supportedFormats}",
                    400
                );
            }

            if ($request->fileSize > $uploadConfig['max_file_size_bytes']) {
                $maxSizeMB = round($uploadConfig['max_file_size_bytes'] / 1024 / 1024, 1);
                return ApiResponse::error(
                    "File size exceeds the maximum allowed size of {$maxSizeMB}MB.",
                    400
                );
            }

            // Create upload session
            $uploadId = Str::uuid()->toString();
            $uploadSession = ChunkedUploadSession::create([
                'upload_id' => $uploadId,
                'filename' => $request->filename,
                'original_filename' => $request->filename,
                'file_size' => $request->fileSize,
                'mime_type' => $request->mimeType,
                'total_chunks' => $request->totalChunks,
                'uploaded_chunks' => 0,
                'status' => 'initialized',
                'expires_at' => now()->addHours(24) // 24 hour expiry
            ]);

            // Create chunk directory
            $chunkDir = $uploadSession->getChunkDirectoryPath();
            if (! file_exists($chunkDir)) {
                mkdir($chunkDir, 0755, true);
            }

            Log::info('Chunked upload session initialized', [
                'upload_id' => $uploadId,
                'filename' => $request->filename,
                'file_size' => $request->fileSize,
                'total_chunks' => $request->totalChunks
            ]);

            return ApiResponse::success([
                'uploadId' => $uploadId,
                'chunkSize' => 5 * 1024 * 1024, // 5MB chunks
                'expiresAt' => $uploadSession->expires_at,
                'session' => [
                    'id' => $uploadSession->id,
                    'status' => $uploadSession->status,
                    'progress' => $uploadSession->getProgressPercentage()
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Failed to initialize chunked upload', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to initialize upload session');
        }
    }

    /**
     * Upload individual chunk
     * POST /api/v1/audio-files/chunked/upload
     */
    public function uploadChunk(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'uploadId' => 'required|string',
            'chunkIndex' => 'required|integer|min:0',
            'chunk' => 'required|file',
            'totalChunks' => 'required|integer|min:1'
        ]);

        if ($validator->fails()) {
            return ApiResponse::validationError($validator->errors()->toArray());
        }

        try {
            $uploadSession = ChunkedUploadSession::active()
                ->where('upload_id', $request->uploadId)
                ->first();

            if (! $uploadSession) {
                return ApiResponse::error('Upload session not found or expired', 404);
            }

            if ($uploadSession->isChunkCompleted($request->chunkIndex)) {
                return ApiResponse::success([
                    'message' => 'Chunk already uploaded',
                    'chunkIndex' => $request->chunkIndex,
                    'progress' => $uploadSession->getProgressPercentage()
                ]);
            }

            // Validate chunk index
            if ($request->chunkIndex >= $uploadSession->total_chunks) {
                return ApiResponse::error('Invalid chunk index', 400);
            }

            // Store chunk to temporary location
            $chunkPath = $uploadSession->getChunkPath($request->chunkIndex);
            $chunk = $request->file('chunk');

            if (! $chunk->move(dirname($chunkPath), basename($chunkPath))) {
                throw new Exception('Failed to save chunk file');
            }

            // Update session
            if (! $uploadSession->isChunkCompleted($request->chunkIndex)) {
                $uploadSession->increment('uploaded_chunks');
            }
            $uploadSession->updateChunkStatus($request->chunkIndex, 'completed');

            Log::info('Chunk uploaded successfully', [
                'upload_id' => $request->uploadId,
                'chunk_index' => $request->chunkIndex,
                'progress' => $uploadSession->getProgressPercentage()
            ]);

            return ApiResponse::success([
                'chunkIndex' => $request->chunkIndex,
                'uploadedChunks' => $uploadSession->uploaded_chunks,
                'totalChunks' => $uploadSession->total_chunks,
                'progress' => $uploadSession->getProgressPercentage(),
                'isComplete' => $uploadSession->isComplete()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to upload chunk', [
                'upload_id' => $request->uploadId ?? 'unknown',
                'chunk_index' => $request->chunkIndex ?? 'unknown',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to upload chunk');
        }
    }

    /**
     * Finalize chunked upload - combine chunks into final file
     * POST /api/v1/audio-files/chunked/finalize/{uploadId}
     */
    public function finalizeChunkedUpload(string $uploadId): JsonResponse
    {
        try {
            $uploadSession = ChunkedUploadSession::active()
                ->where('upload_id', $uploadId)
                ->first();

            if (! $uploadSession) {
                return ApiResponse::error('Upload session not found or expired', 404);
            }

            if (! $uploadSession->isComplete()) {
                return ApiResponse::error(
                    "Not all chunks uploaded. {$uploadSession->uploaded_chunks}/{$uploadSession->total_chunks} completed.",
                    400
                );
            }

            // Generate final filename and path
            $timestamp = time();
            $finalFilename = "{$timestamp}_{$uploadSession->original_filename}";
            $finalPath = "audio-files/{$finalFilename}";
            $fullPath = storage_path("app/public/{$finalPath}");

            // Create directory if needed
            $directory = dirname($fullPath);
            if (! file_exists($directory)) {
                mkdir($directory, 0755, true);
            }

            // Combine chunks into final file
            $finalFile = fopen($fullPath, 'wb');
            if (! $finalFile) {
                throw new Exception('Could not create final file');
            }

            $totalBytesWritten = 0;
            for ($i = 0; $i < $uploadSession->total_chunks; $i++) {
                $chunkPath = $uploadSession->getChunkPath($i);

                if (! file_exists($chunkPath)) {
                    fclose($finalFile);
                    unlink($fullPath);
                    throw new Exception("Chunk {$i} not found");
                }

                $chunkData = file_get_contents($chunkPath);
                if ($chunkData === false) {
                    fclose($finalFile);
                    unlink($fullPath);
                    throw new Exception("Could not read chunk {$i}");
                }

                $bytesWritten = fwrite($finalFile, $chunkData);
                if ($bytesWritten === false) {
                    fclose($finalFile);
                    unlink($fullPath);
                    throw new Exception("Could not write chunk {$i} to final file");
                }

                $totalBytesWritten += $bytesWritten;
            }
            fclose($finalFile);

            // Verify file size
            if ($totalBytesWritten !== $uploadSession->file_size) {
                unlink($fullPath);
                throw new Exception(
                    "Final file size mismatch. Expected: {$uploadSession->file_size}, Got: {$totalBytesWritten}"
                );
            }

            // Create audio file record
            $audioFile = $this->audioFileRepository->create([
                'filename' => $finalFilename,
                'original_filename' => $uploadSession->original_filename,
                'file_path' => $finalPath,
                'file_size' => $uploadSession->file_size,
                'mime_type' => $uploadSession->mime_type,
                'status' => AudioFileStatus::UPLOADED
            ]);

            // Clean up upload session and chunks
            $uploadSession->cleanupChunks();
            $uploadSession->update(['status' => 'completed']);

            Log::info('Chunked upload finalized successfully', [
                'upload_id' => $uploadId,
                'audio_file_id' => $audioFile->id,
                'filename' => $uploadSession->original_filename,
                'file_size' => $uploadSession->file_size
            ]);

            // Broadcast initial status and start processing
            broadcast(new AudioFileStatusUpdated($audioFile, AudioFileStatus::UPLOADED, 15));
            $this->audioService->processAudioAsyncWithWebSocket($audioFile);

            return ApiResponse::created([
                'id' => $audioFile->id,
                'filename' => $audioFile->original_filename,
                'status' => $audioFile->status,
                'file_size' => $audioFile->file_size,
                'upload_time' => $audioFile->created_at,
                'message' => 'File uploaded successfully and processing started'
            ]);

        } catch (Exception $e) {
            Log::error('Failed to finalize chunked upload', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return ApiResponse::serverError('Failed to finalize upload');
        }
    }

    /**
     * Cancel chunked upload session
     * DELETE /api/v1/audio-files/chunked/cancel/{uploadId}
     */
    public function cancelChunkedUpload(string $uploadId): JsonResponse
    {
        try {
            $uploadSession = ChunkedUploadSession::where('upload_id', $uploadId)->first();

            if (! $uploadSession) {
                return ApiResponse::error('Upload session not found', 404);
            }

            // Clean up chunks and session
            $uploadSession->cleanupChunks();
            $uploadSession->update(['status' => 'cancelled']);

            Log::info('Chunked upload cancelled', [
                'upload_id' => $uploadId,
                'filename' => $uploadSession->original_filename
            ]);

            return ApiResponse::success([
                'message' => 'Upload session cancelled successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Failed to cancel chunked upload', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage()
            ]);

            return ApiResponse::serverError('Failed to cancel upload session');
        }
    }

    /**
     * Get chunked upload session status
     * GET /api/v1/audio-files/chunked/status/{uploadId}
     */
    public function getChunkedUploadStatus(string $uploadId): JsonResponse
    {
        try {
            $uploadSession = ChunkedUploadSession::where('upload_id', $uploadId)->first();

            if (! $uploadSession) {
                return ApiResponse::error('Upload session not found', 404);
            }

            return ApiResponse::success([
                'uploadId' => $uploadSession->upload_id,
                'status' => $uploadSession->status,
                'progress' => $uploadSession->getProgressPercentage(),
                'uploadedChunks' => $uploadSession->uploaded_chunks,
                'totalChunks' => $uploadSession->total_chunks,
                'fileSize' => $uploadSession->file_size,
                'filename' => $uploadSession->original_filename,
                'expiresAt' => $uploadSession->expires_at,
                'isExpired' => $uploadSession->expires_at->isPast(),
                'isComplete' => $uploadSession->isComplete()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get chunked upload status', [
                'upload_id' => $uploadId,
                'error' => $e->getMessage()
            ]);

            return ApiResponse::serverError('Failed to get upload status');
        }
    }
}
