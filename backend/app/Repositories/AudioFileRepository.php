<?php

namespace App\Repositories;

use App\Abstracts\Repositories\AudioFileRepositoryInterface;
use App\Models\AudioFile;
use Illuminate\Database\Eloquent\Collection;

class AudioFileRepository implements AudioFileRepositoryInterface
{
    public function getAllWithTranscripts(): Collection
    {
        return AudioFile::with('transcript')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function findWithTranscript(int $id): ?AudioFile
    {
        return AudioFile::with('transcript')->find($id);
    }

    public function create(array $data): AudioFile
    {
        return AudioFile::create($data);
    }

    public function update(int $id, array $data): bool
    {
        $audioFile = AudioFile::find($id);

        if (! $audioFile) {
            return false;
        }

        return $audioFile->update($data);
    }

    public function updateStatus(int $id, string $status): bool
    {
        return $this->update($id, ['status' => $status]);
    }

    public function updateProcessingMetadata(int $id, array $metadata): bool
    {
        $audioFile = AudioFile::find($id);

        if (! $audioFile) {
            return false;
        }

        $existingMetadata = $audioFile->processing_metadata ?? [];
        $mergedMetadata = array_merge($existingMetadata, $metadata);

        return $audioFile->update(['processing_metadata' => $mergedMetadata]);
    }

    public function findById(int $id): ?AudioFile
    {
        return AudioFile::find($id);
    }
}
