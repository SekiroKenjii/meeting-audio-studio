<?php

namespace App\Http\Controllers\Api\V1;

use App\Abstracts\Repositories\TranscriptRepositoryInterface;
use App\Abstracts\Services\TranscriptServiceInterface;
use App\Constants\ResponseCodes;
use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Constants\Messages;
use App\Constants\Limits;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TranscriptController extends Controller
{
    protected TranscriptServiceInterface $transcriptService;
    protected TranscriptRepositoryInterface $transcriptRepository;

    public function __construct(
        TranscriptServiceInterface $transcriptService,
        TranscriptRepositoryInterface $transcriptRepository
    ) {
        $this->transcriptService = $transcriptService;
        $this->transcriptRepository = $transcriptRepository;
    }

    /**
     * Display the specified transcript
     * GET /api/v1/transcripts/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            $transcript = $this->transcriptService->getFormattedTranscript((int) $id);

            if (!$transcript) {
                return ApiResponse::notFound(Messages::TRANSCRIPT_NOT_FOUND);
            }

            return ApiResponse::success($transcript);

        } catch (Exception $e) {
            return ApiResponse::notFound(Messages::TRANSCRIPT_NOT_FOUND);
        }
    }

    /**
     * Query a transcript using AI
     * POST /api/v1/transcripts/{id}/queries
     */
    public function query(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|max:' . Limits::MAX_QUERY_LENGTH,
        ]);

        if ($validator->fails()) {
            return ApiResponse::error(
                Messages::VALIDATION_FAILED,
                $validator->errors(),
                ResponseCodes::VALIDATION_ERROR
            );
        }

        try {
            $transcript = $this->transcriptRepository->findById($id);
            if (!$transcript) {
                return ApiResponse::error(
                    Messages::TRANSCRIPT_NOT_FOUND,
                    null,
                    ResponseCodes::NOT_FOUND
                );
            }

            $query = $request->input('query');
            $result = $this->transcriptService->processQuery($transcript, $query);

            return ApiResponse::success(
                $result,
                Messages::QUERY_PROCESSED
            );
        } catch (Exception $e) {
            return ApiResponse::error(
                Messages::QUERY_PROCESSING_FAILED,
                $e->getMessage(),
                ResponseCodes::INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get transcript by audio file ID
     * GET /api/v1/audio-files/{audioFileId}/transcript
     */
    public function getByAudioFile(string $audioFileId): JsonResponse
    {
        try {
            $transcript = $this->transcriptService->getTranscriptByAudioFile((int) $audioFileId);

            if (!$transcript) {
                return ApiResponse::notFound(Messages::TRANSCRIPT_NOT_FOUND_FOR_AUDIO_FILE);
            }

            return ApiResponse::success($transcript);

        } catch (Exception $e) {
            return ApiResponse::notFound(Messages::TRANSCRIPT_NOT_FOUND_FOR_AUDIO_FILE);
        }
    }
}
