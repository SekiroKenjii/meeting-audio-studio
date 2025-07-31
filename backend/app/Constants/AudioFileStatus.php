<?php

namespace App\Constants;

/**
 * Audio file status constants
 */
class AudioFileStatus
{
    public const string UPLOADING    = 'uploading';
    public const string UPLOADED     = 'uploaded';
    public const string PROCESSING   = 'processing';
    public const string PROCESSED    = 'processed';
    public const string TRANSCRIBING = 'transcribing';
    public const string TRANSCRIBED  = 'transcribed';
    public const string FAILED       = 'failed';
    public const string COMPLETED    = 'completed';

    /**
     * Get all available statuses
     */
    public static function all(): array
    {
        return [
            self::UPLOADING,
            self::UPLOADED,
            self::PROCESSING,
            self::PROCESSED,
            self::TRANSCRIBING,
            self::TRANSCRIBED,
            self::FAILED,
            self::COMPLETED,
        ];
    }

    /**
     * Check if status is valid
     */
    public static function isValid(string $status): bool
    {
        return in_array($status, self::all(), true);
    }
}
