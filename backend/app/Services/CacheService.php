<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CacheService
{
    /**
     * Cache duration constants
     */
    public const TRANSCRIPT_CACHE_DURATION = 3600; // 1 hour
    public const AUDIO_FILE_CACHE_DURATION = 1800; // 30 minutes
    public const QUERY_CACHE_DURATION      = 600; // 10 minutes

    /**
     * Cache key prefixes
     */
    public const TRANSCRIPT_KEY        = 'transcript:';
    public const AUDIO_FILE_KEY        = 'audio_file:';
    public const QUERY_KEY             = 'query:';
    public const PROCESSING_STATUS_KEY = 'processing_status:';

    /**
     * Cache a transcript
     */
    public function cacheTranscript(int $transcriptId, array $data): bool
    {
        try {
            $key = self::TRANSCRIPT_KEY.$transcriptId;
            return Cache::put($key, $data, self::TRANSCRIPT_CACHE_DURATION);
        } catch (\Exception $e) {
            Log::error('Failed to cache transcript', [
                'transcript_id' => $transcriptId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cached transcript
     */
    public function getCachedTranscript(int $transcriptId): ?array
    {
        try {
            $key = self::TRANSCRIPT_KEY.$transcriptId;
            return Cache::get($key);
        } catch (\Exception $e) {
            Log::error('Failed to get cached transcript', [
                'transcript_id' => $transcriptId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Cache an audio file
     */
    public function cacheAudioFile(int $audioFileId, array $data): bool
    {
        try {
            $key = self::AUDIO_FILE_KEY.$audioFileId;
            return Cache::put($key, $data, self::AUDIO_FILE_CACHE_DURATION);
        } catch (\Exception $e) {
            Log::error('Failed to cache audio file', [
                'audio_file_id' => $audioFileId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Update audio file status in cache
     */
    public function updateAudioFileStatus(int $audioFileId, string $status): bool
    {
        try {
            $key = self::AUDIO_FILE_KEY.$audioFileId;
            $cachedData = Cache::get($key);

            if ($cachedData) {
                $cachedData['status'] = $status;
                return Cache::put($key, $cachedData, self::AUDIO_FILE_CACHE_DURATION);
            }

            return true; // If not cached, no need to update
        } catch (\Exception $e) {
            Log::error('Failed to update audio file status in cache', [
                'audio_file_id' => $audioFileId,
                'status' => $status,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cached audio file
     */
    public function getCachedAudioFile(int $audioFileId): ?array
    {
        try {
            $key = self::AUDIO_FILE_KEY.$audioFileId;
            return Cache::get($key);
        } catch (\Exception $e) {
            Log::error('Failed to get cached audio file', [
                'audio_file_id' => $audioFileId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Cache a query result
     */
    public function cacheQuery(string $queryHash, array $data): bool
    {
        try {
            $key = self::QUERY_KEY.$queryHash;
            return Cache::put($key, $data, self::QUERY_CACHE_DURATION);
        } catch (\Exception $e) {
            Log::error('Failed to cache query', [
                'query_hash' => $queryHash,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cached query result
     */
    public function getCachedQuery(string $queryHash): ?array
    {
        try {
            $key = self::QUERY_KEY.$queryHash;
            return Cache::get($key);
        } catch (\Exception $e) {
            Log::error('Failed to get cached query', [
                'query_hash' => $queryHash,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Cache processing status
     */
    public function cacheProcessingStatus(int $audioFileId, string $status, int $progress = 0): bool
    {
        try {
            $key = self::PROCESSING_STATUS_KEY.$audioFileId;
            $data = [
                'status' => $status,
                'progress' => $progress,
                'updated_at' => now()->toISOString()
            ];
            return Cache::put($key, $data, self::AUDIO_FILE_CACHE_DURATION);
        } catch (\Exception $e) {
            Log::error('Failed to cache processing status', [
                'audio_file_id' => $audioFileId,
                'status' => $status,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cached processing status
     */
    public function getCachedProcessingStatus(int $audioFileId): ?array
    {
        try {
            $key = self::PROCESSING_STATUS_KEY.$audioFileId;
            return Cache::get($key);
        } catch (\Exception $e) {
            Log::error('Failed to get cached processing status', [
                'audio_file_id' => $audioFileId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Clear all cached data for an audio file
     */
    public function clearAudioFileCache(int $audioFileId): bool
    {
        try {
            $keys = [
                self::AUDIO_FILE_KEY.$audioFileId,
                self::PROCESSING_STATUS_KEY.$audioFileId
            ];

            foreach ($keys as $key) {
                Cache::forget($key);
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear audio file cache', [
                'audio_file_id' => $audioFileId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Clear transcript cache
     */
    public function clearTranscriptCache(int $transcriptId): bool
    {
        try {
            $key = self::TRANSCRIPT_KEY.$transcriptId;
            Cache::forget($key);
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to clear transcript cache', [
                'transcript_id' => $transcriptId,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Clear all caches
     */
    public function clearAllCaches(): bool
    {
        try {
            return Cache::flush();
        } catch (\Exception $e) {
            Log::error('Failed to clear all caches', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Generate a unique hash for a query
     */
    public function generateQueryHash(string $query, array $context = []): string
    {
        $data = [
            'query' => $query,
            'context' => $context
        ];
        return hash('sha256', json_encode($data));
    }

    /**
     * Check if Redis is available
     */
    public function isRedisAvailable(): bool
    {
        try {
            Cache::put('health_check', 'ok', 10);
            return Cache::get('health_check') === 'ok';
        } catch (\Exception $e) {
            Log::warning('Redis availability check failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    public function getCacheStats(): array
    {
        try {
            return [
                'redis_available' => $this->isRedisAvailable(),
                'cache_driver' => config('cache.default'),
                'redis_connection' => config('database.redis.client')
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get cache stats', [
                'error' => $e->getMessage()
            ]);
            return [
                'redis_available' => false,
                'cache_driver' => 'unknown',
                'redis_connection' => 'unknown'
            ];
        }
    }
}
