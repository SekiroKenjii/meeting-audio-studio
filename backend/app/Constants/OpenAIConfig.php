<?php

namespace App\Constants;

/**
 * OpenAI service configuration constants
 */
class OpenAIConfig
{
    // OpenAI Models
    public const string TRANSCRIPTION_MODEL = 'whisper-1';
    public const string CHAT_MODEL          = 'gpt-4';
    public const string CHAT_MODEL_FALLBACK = 'gpt-3.5-turbo';

    // OpenAI API Settings
    public const int MAX_TOKENS      = 1000;
    public const float TEMPERATURE     = 0.7;
    public const int MAX_RETRIES     = 3;
    public const int TIMEOUT_SECONDS = 60;

    // OpenAI Response Settings
    public const string RESPONSE_FORMAT               = 'json';
    public const string TRANSCRIPTION_LANGUAGE        = 'en';
    public const string TRANSCRIPTION_RESPONSE_FORMAT = 'verbose_json';

    // Chat Completion Settings
    public const string SYSTEM_ROLE    = 'system';
    public const string USER_ROLE      = 'user';
    public const string ASSISTANT_ROLE = 'assistant';

    // Token Limits per Model
    public const int GPT4_MAX_TOKENS          = 8192;
    public const int GPT35_TURBO_MAX_TOKENS   = 4096;
    public const int WHISPER_MAX_FILE_SIZE_MB = 25;
}
