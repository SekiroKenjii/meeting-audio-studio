<?php

namespace App\Jobs;

use App\Abstracts\Repositories\AudioFileRepositoryInterface;
use App\Abstracts\Repositories\TranscriptRepositoryInterface;
use App\Abstracts\Services\OpenAIServiceInterface;
use App\Constants\AudioFileStatus;
use App\Constants\Limits;
use App\Events\AudioFileStatusUpdated;
use App\Jobs\TranscribeAudioJob;
use App\Models\AudioFile;
use Exception;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessAudioFileJob implements ShouldQueue
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
    public int $timeout = 600;

    /**
     * Create a new job instance.
     */
    public function __construct(AudioFile $audioFile)
    {
        $this->audioFile = $audioFile;
        $this->onQueue('audio_processing');
    }

    /**
     * Execute the job.
     */
    public function handle(AudioFileRepositoryInterface $audioFileRepository): void
    {
        try {
            set_time_limit(Limits::PROCESSING_TIMEOUT_SECONDS);

            $audioFileRepository->updateStatus($this->audioFile->id, AudioFileStatus::UPLOADED);
            broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::UPLOADED, 20));

            $audioFileRepository->updateStatus($this->audioFile->id, AudioFileStatus::PROCESSING);
            broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::PROCESSING, 30));

            try {
                $filePath = storage_path("app/public/{$this->audioFile->file_path}");

                if (file_exists($filePath)) {
                    $command = sprintf(
                        'ffprobe -v quiet -show_entries format=duration -of csv="p=0" %s 2>/dev/null',
                        escapeshellarg($filePath)
                    );

                    $output = [];
                    $returnCode = 0;
                    exec($command, $output, $returnCode);

                    if ($returnCode === 0 && ! empty($output) && isset($output[0])) {
                        $durationValue = trim($output[0]);

                        if (is_numeric($durationValue)) {
                            $duration = floatval($durationValue);
                            if ($duration > 0) {
                                $audioFileRepository->update($this->audioFile->id, [
                                    'duration' => $duration
                                ]);

                                Log::info('Audio duration extracted in job', [
                                    'audio_file_id' => $this->audioFile->id,
                                    'duration' => $duration
                                ]);
                            }
                        }
                    }
                }
            } catch (Exception $durationError) {
                Log::warning('Duration extraction failed in job', [
                    'audio_file_id' => $this->audioFile->id,
                    'error' => $durationError->getMessage()
                ]);
            }

            // Skip audio processing service for now - mark as processed
            $audioFileRepository->updateStatus($this->audioFile->id, AudioFileStatus::PROCESSED);
            broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::PROCESSED, 50));

            Log::info('Audio file processed, dispatching transcription job', [
                'audio_file_id' => $this->audioFile->id,
                'filename' => $this->audioFile->original_filename
            ]);

            // Dispatch transcription job to separate queue
            TranscribeAudioJob::dispatch($this->audioFile);

            Log::info('Transcription job dispatched successfully', [
                'audio_file_id' => $this->audioFile->id
            ]);

        } catch (Exception $e) {
            Log::error('Audio processing job failed', [
                'audio_file_id' => $this->audioFile->id,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            $audioFileRepository->update($this->audioFile->id, [
                'status' => AudioFileStatus::FAILED
            ]);

            $audioFileRepository->updateProcessingMetadata($this->audioFile->id, [
                'transcription_error' => $e->getMessage()
            ]);

            broadcast(new AudioFileStatusUpdated($this->audioFile, AudioFileStatus::FAILED, 0, $e->getMessage()));
        }
    }
}
