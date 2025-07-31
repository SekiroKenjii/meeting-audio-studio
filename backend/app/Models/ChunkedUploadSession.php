<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class ChunkedUploadSession extends Model
{
    protected $fillable = [
        'upload_id',
        'filename',
        'original_filename',
        'file_size',
        'mime_type',
        'total_chunks',
        'uploaded_chunks',
        'chunk_status',
        'status',
        'expires_at'
    ];

    protected $casts = [
        'chunk_status' => 'array',
        'expires_at' => 'datetime'
    ];

    /**
     * Update the status of a specific chunk
     */
    public function updateChunkStatus(int $chunkIndex, string $status): void
    {
        $chunkStatus = $this->chunk_status ?? [];
        $chunkStatus[$chunkIndex] = $status;
        $this->update(['chunk_status' => $chunkStatus]);
    }

    /**
     * Check if a specific chunk is completed
     */
    public function isChunkCompleted(int $chunkIndex): bool
    {
        $chunkStatus = $this->chunk_status ?? [];
        return isset($chunkStatus[$chunkIndex]) && $chunkStatus[$chunkIndex] === 'completed';
    }

    /**
     * Get upload progress percentage
     */
    public function getProgressPercentage(): float
    {
        if ($this->total_chunks === 0) {
            return 0;
        }
        return round(($this->uploaded_chunks / $this->total_chunks) * 100, 2);
    }

    /**
     * Check if all chunks are uploaded
     */
    public function isComplete(): bool
    {
        return $this->uploaded_chunks === $this->total_chunks;
    }

    /**
     * Scope for active sessions (not expired)
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', now());
    }

    /**
     * Scope for expired sessions
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    /**
     * Get the directory path for chunks
     */
    public function getChunkDirectoryPath(): string
    {
        return storage_path("app/chunks/{$this->upload_id}");
    }

    /**
     * Get the path for a specific chunk
     */
    public function getChunkPath(int $chunkIndex): string
    {
        return $this->getChunkDirectoryPath()."/chunk_{$chunkIndex}";
    }

    /**
     * Clean up chunk files and directory
     */
    public function cleanupChunks(): void
    {
        $chunkDir = $this->getChunkDirectoryPath();

        if (is_dir($chunkDir)) {
            // Remove all chunk files
            $files = glob($chunkDir.'/chunk_*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }

            // Remove directory
            rmdir($chunkDir);
        }
    }
}
