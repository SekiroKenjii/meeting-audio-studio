<?php

namespace App\Services;

use App\Abstracts\Repositories\AudioFileRepositoryInterface;
use App\Abstracts\Repositories\TranscriptRepositoryInterface;
use App\Abstracts\Services\AudioServiceInterface;
use App\Constants\AudioFileStatus;
use App\Constants\Limits;
use App\Events\AudioFileStatusUpdated;
use App\Jobs\ProcessAudioFileJob;
use App\Models\AudioFile;
use Exception;
use Illuminate\Support\Facades\Log;

class AudioService implements AudioServiceInterface
{
    protected AudioFileRepositoryInterface $audioFileRepository;
    protected TranscriptRepositoryInterface $transcriptRepository;

    private const string BACKUP_DIRECTORY = 'app/public/audio-backups';

    public function __construct(
        AudioFileRepositoryInterface $audioFileRepository,
        TranscriptRepositoryInterface $transcriptRepository,
    ) {
        $this->audioFileRepository = $audioFileRepository;
        $this->transcriptRepository = $transcriptRepository;
    }

    /** @inheritDoc */
    public function extractAndSaveAudioDuration(AudioFile $audioFile): ?float
    {
        try {
            if ($audioFile->duration && $audioFile->duration > 0) {
                Log::info('Audio duration already exists, skipping extraction', [
                    'audio_file_id' => $audioFile->id,
                    'existing_duration' => $audioFile->duration
                ]);

                return (float) $audioFile->duration;
            }

            $filePath = storage_path("app/public/{$audioFile->file_path}");

            if (! file_exists($filePath)) {
                Log::warning('Audio file not found for duration extraction', [
                    'audio_file_id' => $audioFile->id,
                    'file_path' => $filePath,
                    'expected_path' => $audioFile->file_path
                ]);

                return null;
            }

            $checkCommand = 'which ffprobe';
            $checkOutput = [];
            $checkReturnCode = 0;
            exec($checkCommand, $checkOutput, $checkReturnCode);

            if ($checkReturnCode !== 0) {
                Log::warning('FFprobe not available on system', [
                    'audio_file_id' => $audioFile->id,
                    'check_command' => $checkCommand
                ]);

                return null;
            }

            $command = sprintf(
                'ffprobe -v quiet -show_entries format=duration -of csv="p=0" %s 2>/dev/null',
                escapeshellarg($filePath)
            );

            $output = [];
            $returnCode = 0;
            exec($command, $output, $returnCode);

            if ($returnCode === 0 && ! empty($output) && isset($output[0])) {
                $durationValue = trim($output[0]);

                if (! is_numeric($durationValue)) {
                    Log::warning('Non-numeric duration value extracted', [
                        'audio_file_id' => $audioFile->id,
                        'raw_output' => $durationValue
                    ]);

                    return null;
                }


                $duration = floatval($durationValue);

                if ($duration > 0) {
                    $this->audioFileRepository->update($audioFile->id, [
                        'duration' => $duration
                    ]);

                    Log::info('Audio duration extracted and saved', [
                        'audio_file_id' => $audioFile->id,
                        'filename' => $audioFile->original_filename,
                        'duration_seconds' => $duration,
                        'duration_formatted' => gmdate('H:i:s', intval($duration))
                    ]);
                } else {
                    $duration = null;
                    Log::warning('Invalid duration value extracted', [
                        'audio_file_id' => $audioFile->id,
                        'raw_output' => $durationValue
                    ]);
                }

                return $duration;
            }

            Log::warning('FFprobe failed to get duration for audio file', [
                'audio_file_id' => $audioFile->id,
                'file' => $filePath,
                'return_code' => $returnCode,
                'output' => implode("\n", $output),
                'command' => $command
            ]);

            return null;

        } catch (Exception $e) {
            Log::error('Error extracting audio duration', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return null;
        }
    }

    /** @inheritDoc */
    public function processAudioAsyncWithWebSocket(AudioFile $audioFile): void
    {
        ProcessAudioFileJob::dispatch($audioFile);
    }

    /** @inheritDoc */
    public function processAudioAsync(AudioFile $audioFile): void
    {
        // In a real application, you would dispatch this to a queue
        // For now, we'll process directly with OpenAI
        try {
            // Increase execution time limit for audio processing
            set_time_limit(Limits::PROCESSING_TIMEOUT_SECONDS);

            $this->audioFileRepository->updateStatus($audioFile->id, AudioFileStatus::PROCESSING);

            // Extract and save audio duration as early as possible (only once)
            $this->extractAndSaveAudioDuration($audioFile);

            // Skip audio processing service - directly transcribe with OpenAI
            // Set basic audio metadata if needed
            $this->audioFileRepository->updateStatus($audioFile->id, AudioFileStatus::PROCESSED);

            // Start transcription with raw audio file (duration already extracted)
            $this->transcribeAudio($audioFile);

        } catch (Exception $e) {
            Log::error('Audio processing failed in sync process', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            $this->audioFileRepository->update($audioFile->id, [
                'status' => AudioFileStatus::FAILED,
                'processing_metadata' => ['error' => $e->getMessage()]
            ]);
        }
    }

    /** @inheritDoc */
    public function transcribeAudio(AudioFile $audioFile): void
    {
        try {
            // Duration already extracted earlier in the process, no need to extract again
            $transcriptData = $this->openAIService->transcribeAndDiarize($audioFile);

            // Update audio file with duration and metadata from transcription
            $this->audioFileRepository->update($audioFile->id, [
                'duration' => $transcriptData['duration'] ?? null,
            ]);

            $this->audioFileRepository->updateProcessingMetadata($audioFile->id, [
                'transcription_metadata' => $transcriptData['metadata'] ?? []
            ]);

            $this->transcriptRepository->createForAudioFile($audioFile->id, [
                'full_transcript' => $transcriptData['transcript'],
                'diarized_segments' => $transcriptData['segments'] ?? [],
                'speakers' => $transcriptData['speakers'] ?? [],
                'confidence_score' => $transcriptData['confidence'] ?? null,
                'openai_metadata' => $transcriptData['metadata'] ?? []
            ]);

            $this->audioFileRepository->updateStatus($audioFile->id, AudioFileStatus::TRANSCRIBED);

        } catch (Exception $e) {
            Log::error('Transcription failed', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            $this->audioFileRepository->update($audioFile->id, [
                'status' => AudioFileStatus::FAILED
            ]);

            $this->audioFileRepository->updateProcessingMetadata($audioFile->id, [
                'transcription_error' => $e->getMessage()
            ]);
        }
    }

    /** @inheritDoc */
    public function transcribeAudioWithWebSocket(AudioFile $audioFile): void
    {
        try {
            // Update status to transcribing and broadcast
            $this->audioFileRepository->updateStatus($audioFile->id, AudioFileStatus::TRANSCRIBING);
            broadcast(new AudioFileStatusUpdated($audioFile, AudioFileStatus::TRANSCRIBING, 70));

            // Duration already extracted earlier in the process, no need to extract again
            $transcriptData = $this->openAIService->transcribeAndDiarize($audioFile);

            // Update audio file with duration and metadata from transcription
            $this->audioFileRepository->update($audioFile->id, [
                'duration' => $transcriptData['duration'] ?? null,
            ]);

            $this->audioFileRepository->updateProcessingMetadata($audioFile->id, [
                'transcription_metadata' => $transcriptData['metadata'] ?? []
            ]);

            // Broadcast progress update
            broadcast(new AudioFileStatusUpdated($audioFile, AudioFileStatus::TRANSCRIBING, 90));

            $this->transcriptRepository->createForAudioFile($audioFile->id, [
                'full_transcript' => $transcriptData['transcript'],
                'diarized_segments' => $transcriptData['segments'] ?? [],
                'speakers' => $transcriptData['speakers'] ?? [],
                'confidence_score' => $transcriptData['confidence'] ?? null,
                'openai_metadata' => $transcriptData['metadata'] ?? []
            ]);

            // Update to transcribed status and broadcast completion
            $this->audioFileRepository->updateStatus($audioFile->id, AudioFileStatus::TRANSCRIBED);
            broadcast(new AudioFileStatusUpdated($audioFile, AudioFileStatus::TRANSCRIBED, 100));

        } catch (Exception $e) {
            Log::error('Transcription failed with WebSocket', [
                'audio_file_id' => $audioFile->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            $this->audioFileRepository->update($audioFile->id, [
                'status' => AudioFileStatus::FAILED
            ]);

            $this->audioFileRepository->updateProcessingMetadata($audioFile->id, [
                'transcription_error' => $e->getMessage()
            ]);

            // Broadcast error status
            broadcast(new AudioFileStatusUpdated($audioFile, AudioFileStatus::FAILED, 0, $e->getMessage()));
        }
    }

    /** @inheritDoc */
    public function getBackupFiles(): array
    {
        $backupDir = storage_path(self::BACKUP_DIRECTORY);

        if (! is_dir($backupDir)) {
            return [];
        }

        $files = glob("{$backupDir}/*.mp3");
        $backupFiles = [];

        foreach ($files as $file) {
            $fileInfo = [
                'filename' => basename($file),
                'path' => $file,
                'relative_path' => str_replace(storage_path('app/public/'), '', $file),
                'size_mb' => round(filesize($file) / (1024 * 1024), 2),
                'created_at' => date('Y-m-d H:i:s', filemtime($file)),
                'type' => strpos(basename($file), 'compressed_') === 0 ? 'standard' : 'aggressive'
            ];

            if (preg_match('/^(compressed|aggressive)_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_(.+)\.mp3$/', basename($file), $matches)) {
                $fileInfo['original_filename'] = $matches[2];
                $fileInfo['compression_type'] = $matches[1];
            }

            $backupFiles[] = $fileInfo;
        }

        usort($backupFiles, fn ($a, $b) => strtotime($b['created_at']) - strtotime($a['created_at']));

        return $backupFiles;
    }

    /** @inheritDoc */
    public function getBackupFileContent(string $filename): ?array
    {
        $backupDir = storage_path(self::BACKUP_DIRECTORY);
        $filePath = "{$backupDir}/{$filename}";

        if (! file_exists($filePath)) {
            return null;
        }

        return [
            'path' => $filePath,
            'content' => file_get_contents($filePath),
            'mime_type' => 'audio/mpeg',
            'size' => filesize($filePath)
        ];
    }
}
