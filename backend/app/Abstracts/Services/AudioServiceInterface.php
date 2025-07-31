<?php

namespace App\Abstracts\Services;

use App\Models\AudioFile;

interface AudioServiceInterface
{
    /**
     * Extract and save audio duration using FFmpeg
     */
    public function extractAndSaveAudioDuration(AudioFile $audioFile): ?float;

    /**
     * Process audio file asynchronously with real-time status updates
     */
    public function processAudioAsyncWithWebSocket(AudioFile $audioFile): void;

    /**
     * Process audio file asynchronously
     */
    public function processAudioAsync(AudioFile $audioFile): void;

    /**
     * Transcribe audio file
     */
    public function transcribeAudio(AudioFile $audioFile): void;

    /**
     * Transcribe audio file with WebSocket updates
     */
    public function transcribeAudioWithWebSocket(AudioFile $audioFile): void;

    /**
     * Get list of backup files
     */
    public function getBackupFiles(): array;

    /**
     * Get backup file content
     */
    public function getBackupFileContent(string $filename): ?array;
}
