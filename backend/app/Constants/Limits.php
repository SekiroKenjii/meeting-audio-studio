<?php

namespace App\Constants;

/**
 * File size and processing limits
 */
class Limits
{
    // Conversion Constants
    public const int MB_TO_BYTES = 1048576; // 1024 * 1024;

    // File Size Limits
    public const int MAX_FILE_SIZE_BYTES         = 1073741824; // 1GB
    public const int MAX_FILE_SIZE_MB            = 1024; // 1GB
    public const int COMPRESSION_THRESHOLD_BYTES = 536870912; // 512MB

    // Processing Limits
    public const float SPEAKER_CHANGE_GAP_SECONDS = 2.0;
    public const int MAX_SPEAKERS               = 10;
    public const int PROCESSING_TIMEOUT_SECONDS = 3600; // 1 hour for large files

    // Validation Limits
    public const int MAX_QUERY_LENGTH = 1000;
}
