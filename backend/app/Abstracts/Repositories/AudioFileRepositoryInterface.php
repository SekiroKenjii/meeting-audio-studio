<?php

namespace App\Abstracts\Repositories;

use App\Models\AudioFile;
use Illuminate\Database\Eloquent\Collection;

interface AudioFileRepositoryInterface
{
    /**
     * Get all audio files with their transcripts, ordered by creation date
     */
    public function getAllWithTranscripts(): Collection;

    /**
     * Find audio file by ID with transcript relationship
     */
    public function findWithTranscript(int $id): ?AudioFile;

    /**
     * Create a new audio file record
     */
    public function create(array $data): AudioFile;

    /**
     * Update audio file by ID
     */
    public function update(int $id, array $data): bool;

    /**
     * Update audio file status
     */
    public function updateStatus(int $id, string $status): bool;

    /**
     * Update audio file processing metadata
     */
    public function updateProcessingMetadata(int $id, array $metadata): bool;

    /**
     * Find audio file by ID
     */
    public function findById(int $id): ?AudioFile;
}
