<?php

namespace App\Services;

use App\Abstracts\Repositories\TranscriptQueryRepositoryInterface;
use App\Abstracts\Repositories\TranscriptRepositoryInterface;
use App\Abstracts\Services\OpenAIServiceInterface;
use App\Abstracts\Services\TranscriptServiceInterface;
use App\Models\Transcript;

class TranscriptService implements TranscriptServiceInterface
{
    protected TranscriptRepositoryInterface $transcriptRepository;
    protected TranscriptQueryRepositoryInterface $transcriptQueryRepository;
    protected OpenAIServiceInterface $openAIService;

    public function __construct(
        TranscriptRepositoryInterface $transcriptRepository,
        TranscriptQueryRepositoryInterface $transcriptQueryRepository,
        OpenAIServiceInterface $openAIService
    ) {
        $this->transcriptRepository = $transcriptRepository;
        $this->transcriptQueryRepository = $transcriptQueryRepository;
        $this->openAIService = $openAIService;
    }

    public function processQuery(Transcript $transcript, string $query): array
    {
        // Process query with OpenAI
        $queryResult = $this->openAIService->processQuery($transcript, $query);

        // Save query and response
        $transcriptQuery = $this->transcriptQueryRepository->createForTranscript($transcript->id, [
            'query' => $query,
            'response' => $queryResult['response'],
            'context_segments' => $queryResult['context_segments'] ?? [],
            'openai_metadata' => $queryResult['metadata'] ?? []
        ]);

        return [
            'id' => $transcriptQuery->id,
            'query' => $transcriptQuery->query,
            'response' => $transcriptQuery->response,
            'context_segments' => $transcriptQuery->context_segments,
            'created_at' => $transcriptQuery->created_at,
        ];
    }

    public function getFormattedTranscript(int $transcriptId): ?array
    {
        $transcript = $this->transcriptRepository->findWithRelations($transcriptId, ['audioFile', 'queries']);

        if (! $transcript) {
            return null;
        }

        return [
            'id' => $transcript->id,
            'audio_file' => [
                'id' => $transcript->audioFile->id,
                'filename' => $transcript->audioFile->original_filename,
                'duration' => $transcript->audioFile->duration,
            ],
            'full_transcript' => $transcript->full_transcript,
            'diarized_segments' => $transcript->diarized_segments,
            'speakers' => $transcript->speakers,
            'confidence_score' => $transcript->confidence_score,
            'queries' => $transcript->queries->map(fn ($query) => [
                'id' => $query->id,
                'query' => $query->query,
                'response' => $query->response,
                'created_at' => $query->created_at,
            ]),
            'created_at' => $transcript->created_at,
        ];
    }

    public function getTranscriptByAudioFile(int $audioFileId): ?array
    {
        $transcript = $this->transcriptRepository->findByAudioFileIdWithRelations($audioFileId, ['audioFile', 'queries']);

        if (! $transcript) {
            return null;
        }

        return $this->getFormattedTranscript($transcript->id);
    }
}
