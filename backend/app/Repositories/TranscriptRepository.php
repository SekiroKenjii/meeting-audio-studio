<?php

namespace App\Repositories;

use App\Abstracts\Repositories\TranscriptRepositoryInterface;
use App\Models\Transcript;

class TranscriptRepository implements TranscriptRepositoryInterface
{
    public function createForAudioFile(int $audioFileId, array $data): Transcript
    {
        return Transcript::create(array_merge($data, [
            'audio_file_id' => $audioFileId
        ]));
    }

    public function findByAudioFileId(int $audioFileId): ?Transcript
    {
        return Transcript::where('audio_file_id', $audioFileId)->first();
    }

    public function findById(int $id): ?Transcript
    {
        return Transcript::find($id);
    }

    public function findWithRelations(int $id, array $relations = []): ?Transcript
    {
        $query = Transcript::query();

        if (! empty($relations)) {
            $query->with($relations);
        }

        return $query->find($id);
    }

    public function findByAudioFileIdWithRelations(int $audioFileId, array $relations = []): ?Transcript
    {
        $query = Transcript::where('audio_file_id', $audioFileId);

        if (! empty($relations)) {
            $query->with($relations);
        }

        return $query->first();
    }
}
