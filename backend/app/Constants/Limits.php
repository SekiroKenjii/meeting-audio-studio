<?php

namespace App\Constants;

/**
 * File size and processing limits
 */
class Limits
{
    // Conversion Constants
    public const int MB_TO_BYTES = 1048576; // 1024 * 1024;
    public const int KB_TO_BYTES = 1024;

    // Processing Limits
    public const float SPEAKER_CHANGE_GAP_SECONDS = 2.0;
    public const int MAX_SPEAKERS               = 10;
    public const int PROCESSING_TIMEOUT_SECONDS = 600; // 10 minutes

    // Validation Limits
    public const int MAX_QUERY_LENGTH    = 1000;
    public const int MAX_FILENAME_LENGTH = 255;
}
