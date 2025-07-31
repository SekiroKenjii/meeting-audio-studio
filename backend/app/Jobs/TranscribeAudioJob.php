<?php

namespace App\Jobs;

use App\Abstracts\Repositories\AudioFileRepositoryInterface;
use App\Abstracts\Repositories\TranscriptRepositoryInterface;
use App\Abstracts\Services\OpenAIServiceInterface;
use App\Constants\AudioFileStatus;
use App\Events\AudioFileStatusUpdated;
use App\Exceptions\AudioProcessingException;
use App\Models\AudioFile;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use OpenAIException;

class TranscribeAudioJob implements ShouldQueue
{
    use Dispatchable;
    use Queueable;

    protected AudioFile $audioFile;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 900;

    /**
     * Create a new job instance.
     */
    public function __construct(AudioFile $audioFile)
    {
        $this->audioFile = $audioFile;
        $this->onQueue('transcription');
    }

    /**
     * Execute the job.
     */
    public function handle(
        AudioFileRepositoryInterface $audioFileRepository,
        TranscriptRepositoryInterface $transcriptRepository,
        OpenAIServiceInterface $openAIService
    ): void {
        try {
            Log::info("Starting transcription for audio file: {$this->audioFile->id}");

            // Use processed file if available, otherwise use original
            $filePath = $this->audioFile->processed_file_path
                ? storage_path("app/public/{$this->audioFile->processed_file_path}")
                : storage_path("app/public/{$this->audioFile->file_path}");

            if (! file_exists($filePath)) {
                throw AudioProcessingException::fileNotFound($filePath);
            }

            // Update status in database and broadcast
            $audioFileRepository->updateStatus($this->audioFile->id, AudioFileStatus::TRANSCRIBING);
            broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::TRANSCRIBING, 60));

            // Call OpenAI service for transcription and diarization
            $result = $openAIService->transcribeAndDiarize($this->audioFile);

            if (! $result || ! isset($result['full_transcript'])) {
                throw OpenAIException::transcriptionFailed('Failed to get transcription from OpenAI');
            }

            Log::info("Transcription completed for audio file: {$this->audioFile->id}");

            // Store transcript in database using the correct repository method
            $transcriptRepository->createForAudioFile($this->audioFile->id, [
                'full_transcript' => $result['full_transcript'],
                'diarized_segments' => $result['diarized_segments'] ?? [],
                'speakers' => $result['speakers'] ?? [],
                'confidence_score' => $result['confidence_score'] ?? 0.85,
                'openai_metadata' => $result['openai_metadata'] ?? [],
            ]);

            // Update status in database and broadcast completion
            $audioFileRepository->updateStatus($this->audioFile->id, AudioFileStatus::COMPLETED);
            broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::COMPLETED, 100));

            Log::info("Audio file processing completed successfully: {$this->audioFile->id}");

        } catch (Exception $e) {
            Log::error("Transcription failed for audio file {$this->audioFile->id}: ".$e->getMessage());

            // Update status in database and broadcast failure
            $this->audioFile->update(['status' => AudioFileStatus::FAILED]);

            $audioFileRepository->updateProcessingMetadata($this->audioFile->id, [
                'transcription_error' => $e->getMessage()
            ]);

            broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::FAILED, 0));

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error("TranscribeAudioJob failed for audio file {$this->audioFile->id}: ".$exception->getMessage());

        // Update status in database and broadcast failure
        $this->audioFile->update(['status' => AudioFileStatus::FAILED]);
        broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::FAILED, 0));
    }
}
