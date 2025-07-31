<?php

namespace App\Abstracts\Repositories;

use App\Models\TranscriptQuery;

interface TranscriptQueryRepositoryInterface
{
    /**
     * Create a new transcript query
     */
    public function createForTranscript(int $transcriptId, array $data): TranscriptQuery;

    /**
     * Find transcript query by ID
     */
    public function findById(int $id): ?TranscriptQuery;

    /**
     * Get all queries for a transcript
     */
    public function getByTranscriptId(int $transcriptId): \Illuminate\Database\Eloquent\Collection;
}
