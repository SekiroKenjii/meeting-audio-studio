<?php

namespace App\Abstracts\Services;

use App\Models\Transcript;

interface TranscriptServiceInterface
{
    /**
     * Process query against transcript using AI
     */
    public function processQuery(Transcript $transcript, string $query): array;

    /**
     * Get transcript with formatted data
     */
    public function getFormattedTranscript(int $transcriptId): ?array;

    /**
     * Get transcript by audio file ID with formatted data
     */
    public function getTranscriptByAudioFile(int $audioFileId): ?array;
}
