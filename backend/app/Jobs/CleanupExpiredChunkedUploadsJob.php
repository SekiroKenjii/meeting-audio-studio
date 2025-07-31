<?php

namespace App\Jobs;

use App\Models\ChunkedUploadSession;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class CleanupExpiredChunkedUploadsJob implements ShouldQueue
{
    use Dispatchable;
    use Queueable;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $expiredSessions = ChunkedUploadSession::expired()
                ->where('status', '!=', 'completed')
                ->get();

            $cleanedCount = 0;

            foreach ($expiredSessions as $session) {
                try {
                    // Clean up chunk files
                    $session->cleanupChunks();

                    // Update session status
                    $session->update(['status' => 'expired']);

                    $cleanedCount++;

                    Log::info('Cleaned up expired chunked upload session', [
                        'upload_id' => $session->upload_id,
                        'filename' => $session->original_filename,
                        'expired_at' => $session->expires_at,
                        'uploaded_chunks' => $session->uploaded_chunks,
                        'total_chunks' => $session->total_chunks
                    ]);

                } catch (\Exception $e) {
                    Log::error('Failed to cleanup expired chunked upload session', [
                        'upload_id' => $session->upload_id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            if ($cleanedCount > 0) {
                Log::info('Chunked upload cleanup completed', [
                    'cleaned_sessions' => $cleanedCount,
                    'total_expired' => $expiredSessions->count()
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Chunked upload cleanup job failed', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
        }
    }
}
