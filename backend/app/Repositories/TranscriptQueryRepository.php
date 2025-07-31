<?php

namespace App\Repositories;

use App\Abstracts\Repositories\TranscriptQueryRepositoryInterface;
use App\Models\TranscriptQuery;
use Illuminate\Database\Eloquent\Collection;

class TranscriptQueryRepository implements TranscriptQueryRepositoryInterface
{
    public function createForTranscript(int $transcriptId, array $data): TranscriptQuery
    {
        return TranscriptQuery::create(array_merge($data, [
            'transcript_id' => $transcriptId
        ]));
    }

    public function findById(int $id): ?TranscriptQuery
    {
        return TranscriptQuery::find($id);
    }

    public function getByTranscriptId(int $transcriptId): Collection
    {
        return TranscriptQuery::where('transcript_id', $transcriptId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
