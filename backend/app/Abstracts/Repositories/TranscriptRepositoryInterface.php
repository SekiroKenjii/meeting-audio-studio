<?php

namespace App\Abstracts\Repositories;

use App\Models\Transcript;

interface TranscriptRepositoryInterface
{
    /**
     * Create a new transcript for an audio file
     */
    public function createForAudioFile(int $audioFileId, array $data): Transcript;

    /**
     * Find transcript by audio file ID
     */
    public function findByAudioFileId(int $audioFileId): ?Transcript;

    /**
     * Find transcript by ID
     */
    public function findById(int $id): ?Transcript;

    /**
     * Find transcript by ID with relationships
     */
    public function findWithRelations(int $id, array $relations = []): ?Transcript;

    /**
     * Find transcript by audio file ID with relationships
     */
    public function findByAudioFileIdWithRelations(int $audioFileId, array $relations = []): ?Transcript;
}
