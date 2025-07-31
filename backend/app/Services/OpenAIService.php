<?php

namespace App\Services;

use App\Abstracts\Services\ConfigurationServiceInterface;
use App\Abstracts\Services\OpenAIServiceInterface;
use App\Constants\Limits;
use App\Constants\OpenAIConfig;
use App\Exceptions\AudioProcessingException;
use App\Models\AudioFile;
use App\Models\Transcript;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use OpenAI\Laravel\Facades\OpenAI;

class OpenAIService implements OpenAIServiceInterface
{
    private const string DEFAULT_MIME_TYPE = 'audio/mpeg';
    private const string BACKUP_DIRECTORY  = 'app/public/audio-backups';

    protected ConfigurationServiceInterface $configService;

    public function __construct(ConfigurationServiceInterface $configService)
    {
        $this->configService = $configService;
    }

    /** @inheritDoc */
    public function transcribeAndDiarize(AudioFile $audioFile): array
    {
        try {
            $filePath = Storage::disk('public')->path($audioFile->file_path);

            if (! file_exists($filePath)) {
                throw AudioProcessingException::fileNotFound($filePath);
            }

            $fileSize = filesize($filePath);

            if ($fileSize === false) {
                throw AudioProcessingException::fileSizeError($filePath);
            }

            $processedFilePath = $filePath;
            $isCompressed = false;
            $openaiConfig = $this->configService->getOpenAIConfig();
            $maxFileSize = $openaiConfig['limits']['max_file_size_bytes'] ?? 26214400; // Default 25MB

            if ($fileSize > $maxFileSize) {
                $result = $this->handleFileCompression($filePath, $fileSize, $audioFile->mime_type ?? self::DEFAULT_MIME_TYPE);
                $processedFilePath = $result['path'];
                $isCompressed = $result['compressed'];
                $compressedSize = $result['size'];
            }

            $result = OpenAI::audio()->transcribe([
                'file' => fopen($processedFilePath, 'r'),
                'model' => OpenAIConfig::TRANSCRIPTION_MODEL,
                'response_format' => OpenAIConfig::TRANSCRIPTION_RESPONSE_FORMAT,
                'timestamp_granularities' => ['segment'],
                'prompt' => 'This is a meeting recording. Please transcribe accurately with proper punctuation and speaker identification where possible.',
            ]);

            $backupPath = null;

            if ($isCompressed && file_exists($processedFilePath) && $processedFilePath !== $filePath) {
                $backupPath = $this->backupCompressedFile($processedFilePath, $filePath);

                unlink($processedFilePath);
            }

            $segments = $this->performBasicDiarization($result->segments ?? []);
            $speakers = $this->extractSpeakers($segments);
            $duration = $result->duration ?? $this->calculateDurationFromSegments($result->segments ?? []);

            return [
                'transcript' => $result->text,
                'segments' => $segments,
                'speakers' => $speakers,
                'confidence' => $this->calculateAverageConfidence($result->segments ?? []),
                'duration' => $duration,
                'metadata' => [
                    'model' => OpenAIConfig::TRANSCRIPTION_MODEL,
                    'language' => $result->language ?? 'unknown',
                    'duration' => $duration,
                    'transcription_duration' => $result->duration ?? null,
                    'original_file_size_mb' => round($fileSize / Limits::MB_TO_BYTES, 2),
                    'compressed' => $isCompressed,
                    'final_file_size_mb' => $isCompressed ? round($compressedSize / Limits::MB_TO_BYTES, 2) : round($fileSize / Limits::MB_TO_BYTES, 2),
                    'compressed_backup_path' => $backupPath,
                    'processing_timestamp' => now()->toISOString(),
                    'direct_processing' => true // Flag to indicate we skipped audio processing service
                ]
            ];

        } catch (Exception $e) {
            // Backup and clean up compressed file if it exists
            if (isset($isCompressed) && $isCompressed && isset($processedFilePath) && file_exists($processedFilePath) && $processedFilePath !== $filePath) {
                $this->backupCompressedFile($processedFilePath, $filePath);

                unlink($processedFilePath);
            }

            throw AudioProcessingException::transcriptionFailed($e->getMessage());
        }
    }

    protected function createBackupPath(string $originalPath, string $type = 'compressed'): string
    {
        // Create backup directory in storage/app/public/audio-backups
        $backupDir = storage_path(self::BACKUP_DIRECTORY);
        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        // Generate meaningful backup filename
        $timestamp = date('Y-m-d_H-i-s');
        $originalBasename = pathinfo($originalPath, PATHINFO_FILENAME);

        // Extract original filename from the timestamped filename if possible
        if (preg_match('/^\d+_(.+)$/', $originalBasename, $matches)) {
            $cleanBasename = pathinfo($matches[1], PATHINFO_FILENAME);
        } else {
            $cleanBasename = $originalBasename;
        }

        $backupFilename = "{$type}_{$timestamp}_{$cleanBasename}.mp3";
        return "{$backupDir}/{$backupFilename}";
    }

    protected function backupCompressedFile(string $compressedPath, string $originalPath): ?string
    {
        if (! file_exists($compressedPath)) {
            return null;
        }

        try {
            $backupPath = $this->createBackupPath($originalPath, 'compressed');

            $copySuccess = copy($compressedPath, $backupPath);
            if ($copySuccess) {
                Log::info('Compressed file backed up successfully', [
                    'original_compressed_path' => $compressedPath,
                    'backup_path' => $backupPath,
                    'backup_size_mb' => round(filesize($backupPath) / (1024 * 1024), 2)
                ]);
            } else {
                Log::warning('Failed to backup compressed file', [
                    'compressed_path' => $compressedPath,
                    'backup_path' => $backupPath
                ]);
            }

            return $copySuccess ? $backupPath : null;
        } catch (Exception $e) {
            Log::error('Error backing up compressed file', [
                'compressed_path' => $compressedPath,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    protected function compressAudioForOpenAI(string $inputPath, string $mimeType = self::DEFAULT_MIME_TYPE): string
    {
        // Get compression command from configuration service
        $pathInfo = pathinfo($inputPath);
        $timestamp = time();
        $compressedPath = "{$pathInfo['dirname']}/compressed_{$timestamp}_{$pathInfo['basename']}";

        // Remove existing compressed file if it exists
        if (file_exists($compressedPath)) {
            unlink($compressedPath);
        }

        // Get original file size for logging
        $originalSize = filesize($inputPath);
        Log::info('Starting compression', [
            'input_file' => $inputPath,
            'original_size_mb' => round($originalSize / (1024 * 1024), 2),
            'mime_type' => $mimeType
        ]);

        // Get compression command from configuration
        $command = $this->configService->getCompressionCommand($mimeType, $inputPath, $compressedPath);

        if (! $command) {
            // Fallback to default compression if no specific config found
            $command = sprintf(
                'ffmpeg -y -i %s -acodec libmp3lame -q:a 9 -ar 16000 -ac 1 -f mp3 %s 2>&1',
                escapeshellarg($inputPath),
                escapeshellarg($compressedPath)
            );
        }

        Log::info('Running FFmpeg compression', ['command' => $command]);

        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            Log::error('FFmpeg compression failed', [
                'return_code' => $returnCode,
                'output' => implode("\n", $output)
            ]);
            throw AudioProcessingException::compressionFailed(implode("\n", $output));
        }

        if (! file_exists($compressedPath)) {
            throw AudioProcessingException::compressionFileNotCreated();
        }

        // Log compression results
        $compressedSize = filesize($compressedPath);
        Log::info('Compression completed', [
            'original_size_mb' => round($originalSize / (1024 * 1024), 2),
            'compressed_size_mb' => round($compressedSize / (1024 * 1024), 2),
            'compression_ratio' => round((($originalSize - $compressedSize) / $originalSize) * 100, 1).'%',
            'size_reduction' => $compressedSize < $originalSize ? 'success' : 'failed'
        ]);

        return $compressedPath;
    }

    protected function aggressiveCompression(string $inputPath, string $mimeType = self::DEFAULT_MIME_TYPE): string
    {
        // Create compressed file path
        $pathInfo = pathinfo($inputPath);
        $timestamp = time();
        $compressedPath = "{$pathInfo['dirname']}/aggressive_compressed_{$timestamp}_{$pathInfo['basename']}";

        // Remove existing compressed file if it exists
        if (file_exists($compressedPath)) {
            unlink($compressedPath);
        }

        // Try to get aggressive compression command from configuration
        $command = $this->configService->getAggressiveCompressionCommand($mimeType, $inputPath, $compressedPath);

        if (! $command) {
            // Fallback to default aggressive compression
            $command = sprintf(
                'ffmpeg -y -i %s -acodec libmp3lame -b:a 32k -ar 8000 -ac 1 -f mp3 %s 2>&1',
                escapeshellarg($inputPath),
                escapeshellarg($compressedPath)
            );
        }

        Log::info('Running aggressive FFmpeg compression', ['command' => $command]);

        $output = [];
        $returnCode = 0;
        exec($command, $output, $returnCode);

        if ($returnCode !== 0) {
            Log::error('Aggressive FFmpeg compression failed', [
                'return_code' => $returnCode,
                'output' => implode("\n", $output)
            ]);
            throw AudioProcessingException::compressionFailed(implode("\n", $output));
        }

        if (! file_exists($compressedPath)) {
            throw AudioProcessingException::compressionFileNotCreated();
        }

        return $compressedPath;
    }

    protected function handleFileCompression(string $filePath, int $fileSize, string $mimeType = self::DEFAULT_MIME_TYPE): array
    {
        $openaiConfig = $this->configService->getOpenAIConfig();
        $maxFileSize = $openaiConfig['limits']['max_file_size_bytes'] ?? 26214400;

        Log::info('File size exceeds OpenAI limit, attempting compression', [
            'file_size_mb' => round($fileSize / (1024 * 1024), 2),
            'limit_mb' => round($maxFileSize / (1024 * 1024), 2),
            'mime_type' => $mimeType
        ]);

        $processedFilePath = $this->compressAudioForOpenAI($filePath, $mimeType);

        // Check compressed file size
        $compressedSize = filesize($processedFilePath);
        if ($compressedSize === false) {
            throw AudioProcessingException::compressionSizeError();
        }

        // If still too large, try more aggressive compression
        if ($compressedSize > $maxFileSize) {
            Log::warning('First compression attempt still too large, trying aggressive compression', [
                'compressed_size_mb' => round($compressedSize / (1024 * 1024), 2)
            ]);

            // Backup first compression attempt before trying aggressive compression
            if (file_exists($processedFilePath)) {
                $this->backupCompressedFile($processedFilePath, $filePath);
                unlink($processedFilePath);
            }

            // Try more aggressive compression
            $processedFilePath = $this->aggressiveCompression($filePath, $mimeType);
            $compressedSize = filesize($processedFilePath);

            if ($compressedSize === false) {
                throw AudioProcessingException::compressionSizeError();
            }
        }

        // Final size check
        if ($compressedSize > $maxFileSize) {
            throw AudioProcessingException::fileTooLarge(round($compressedSize / (1024 * 1024), 2));
        }

        Log::info('File compressed successfully', [
            'original_size_mb' => round($fileSize / (1024 * 1024), 2),
            'compressed_size_mb' => round($compressedSize / (1024 * 1024), 2),
            'compression_ratio' => round(($fileSize - $compressedSize) / $fileSize * 100, 1).'%'
        ]);

        return [
            'path' => $processedFilePath,
            'compressed' => true,
            'size' => $compressedSize
        ];
    }

    /** @inheritDoc */
    public function processQuery(Transcript $transcript, string $query): array
    {
        try {
            $systemPrompt = "You are an AI assistant that helps analyze meeting transcripts.
                You have access to a complete transcript and can answer questions about the content,
                participants, decisions made, action items, and other meeting details.

                Transcript: {$transcript->full_transcript}";

            try {
                $result = OpenAI::chat()->create([
                    'model' => OpenAIConfig::CHAT_MODEL,
                    'messages' => [
                        [
                            'role' => OpenAIConfig::SYSTEM_ROLE,
                            'content' => $systemPrompt
                        ],
                        [
                            'role' => OpenAIConfig::USER_ROLE,
                            'content' => $query
                        ]
                    ],
                    'max_tokens' => OpenAIConfig::MAX_TOKENS,
                    'temperature' => OpenAIConfig::TEMPERATURE,
                ]);
            } catch (Exception $e) {
                throw AudioProcessingException::queryProcessingFailed($e->getMessage());
            }

            $answer = $result->choices[0]->message->content ?? 'No response generated';
            $contextSegments = $this->findRelevantSegments($transcript, $query);

            return [
                'response' => $answer,
                'context_segments' => $contextSegments,
                'metadata' => [
                    'model' => OpenAIConfig::CHAT_MODEL,
                    'tokens_used' => [
                        'prompt_tokens' => $result->usage->promptTokens ?? 0,
                        'completion_tokens' => $result->usage->completionTokens ?? 0,
                        'total_tokens' => $result->usage->totalTokens ?? 0,
                    ],
                    'processing_timestamp' => now()->toISOString()
                ]
            ];

        } catch (Exception $e) {
            throw new AudioProcessingException("Failed to process query: {$e->getMessage()}", 0, $e);
        }
    }

    protected function performBasicDiarization(array $segments): array
    {
        // Simple speaker detection based on pause patterns and audio characteristics
        // In a real implementation, you might use more sophisticated diarization
        $diarizedSegments = [];
        $currentSpeaker = 'Speaker_1';
        $speakerCount = 1;

        foreach ($segments as $index => $segment) {
            // Detect potential speaker changes based on gaps between segments
            if ($index > 0) {
                $previousSegment = $segments[$index - 1];
                $gap = $segment['start'] - $previousSegment['end'];

                // If there's a significant gap (>2 seconds), consider it a speaker change
                if ($gap > Limits::SPEAKER_CHANGE_GAP_SECONDS) {
                    $speakerCount++;
                    $speakerNumber = min($speakerCount, Limits::MAX_SPEAKERS);
                    $currentSpeaker = "Speaker_{$speakerNumber}";
                }
            }

            $diarizedSegments[] = [
                'start' => $segment['start'],
                'end' => $segment['end'],
                'text' => $segment['text'],
                'speaker' => $currentSpeaker,
                'confidence' => $segment['avg_logprob'] ?? null
            ];
        }

        return $diarizedSegments;
    }

    protected function extractSpeakers(array $segments): array
    {
        $speakers = [];

        foreach ($segments as $segment) {
            $speakerId = $segment['speaker'];

            if (! isset($speakers[$speakerId])) {
                $speakers[$speakerId] = [
                    'id' => $speakerId,
                    'total_time' => 0,
                    'segment_count' => 0
                ];
            }

            $speakers[$speakerId]['total_time'] += $segment['end'] - $segment['start'];
            $speakers[$speakerId]['segment_count']++;
        }

        return array_values($speakers);
    }

    protected function calculateAverageConfidence(array $segments): ?float
    {
        if (empty($segments)) {
            return null;
        }

        $totalConfidence = 0;
        $count = 0;

        foreach ($segments as $segment) {
            if (isset($segment['avg_logprob'])) {
                $totalConfidence += $segment['avg_logprob'];
                $count++;
            }
        }

        return $count > 0 ? $totalConfidence / $count : null;
    }

    protected function calculateDurationFromSegments(array $segments): ?float
    {
        if (empty($segments)) {
            return null;
        }

        $maxEnd = 0;
        foreach ($segments as $segment) {
            if (isset($segment['end']) && $segment['end'] > $maxEnd) {
                $maxEnd = $segment['end'];
            }
        }

        return $maxEnd > 0 ? $maxEnd : null;
    }

    protected function findRelevantSegments(Transcript $transcript, string $query): array
    {
        $queryWords = array_map('strtolower', explode(' ', $query));
        $segments = $transcript->diarized_segments ?? [];
        $relevantSegments = [];

        foreach ($segments as $segment) {
            $segmentText = strtolower($segment['text'] ?? '');
            $relevanceScore = 0;

            foreach ($queryWords as $word) {
                if (strpos($segmentText, $word) !== false) {
                    $relevanceScore++;
                }
            }

            if ($relevanceScore > 0) {
                $relevantSegments[] = [
                    'segment' => $segment,
                    'relevance_score' => $relevanceScore
                ];
            }
        }

        usort($relevantSegments, fn ($a, $b) => $b['relevance_score'] <=> $a['relevance_score']);

        return array_slice(array_column($relevantSegments, 'segment'), 0, 5);
    }
}
