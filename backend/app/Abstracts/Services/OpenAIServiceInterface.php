<?php

namespace App\Abstracts\Services;

use App\Models\Transcript;

interface OpenAIServiceInterface
{
    /**
     * Transcribe and diarize audio file using OpenAI
     */
    public function transcribeAndDiarize(\App\Models\AudioFile $audioFile): array;

    /**
     * Process query using OpenAI
     */
    public function processQuery(Transcript $transcript, string $query): array;
}
