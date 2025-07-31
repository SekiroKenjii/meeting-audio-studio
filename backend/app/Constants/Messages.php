<?php

namespace App\Constants;

/**
 * Application-wide message constants
 */
class Messages
{
    // Audio File Messages
    public const string UPLOAD_FAILED         = 'Failed to upload audio file';
    public const string AUDIO_FILE_NOT_FOUND  = 'Audio file not found';
    public const string RETRIEVE_FILES_FAILED = 'Failed to retrieve audio files';

    // Transcript Messages
    public const string TRANSCRIPT_NOT_FOUND                = 'Transcript not found';
    public const string TRANSCRIPT_NOT_FOUND_FOR_AUDIO_FILE = 'Transcript not found for this audio file';
    public const string QUERY_PROCESSING_FAILED             = 'Failed to process query';

    // Error Messages
    public const string VALIDATION_FAILED       = 'Validation failed';
    public const string RESOURCE_NOT_FOUND      = 'Resource not found';
    public const string ENDPOINT_NOT_FOUND      = 'Endpoint not found';
    public const string METHOD_NOT_ALLOWED      = 'Method not allowed';
    public const string AUTHENTICATION_REQUIRED = 'Authentication required';
    public const string ACCESS_FORBIDDEN        = 'Access forbidden';
    public const string AUDIO_PROCESSING_FAILED = 'Audio processing failed';
    public const string HTTP_ERROR              = 'HTTP error occurred';
    public const string INTERNAL_SERVER_ERROR   = 'Internal server error';

    // Success Messages
    public const string UPLOAD_SUCCESS          = 'Audio file uploaded successfully';
    public const string PROCESSING_STARTED      = 'Audio processing started';
    public const string TRANSCRIPTION_COMPLETED = 'Transcription completed successfully';
    public const string QUERY_PROCESSED         = 'Query processed successfully';
}
