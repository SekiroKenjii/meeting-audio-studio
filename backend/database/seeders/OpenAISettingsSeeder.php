<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OpenAISetting;

class OpenAISettingsSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedApiSettings();
        $this->seedTranscriptionSettings();
        $this->seedChatSettings();
        $this->seedLimitSettings();
    }

    private function seedApiSettings(): void
    {
        $settings = [
            [
                'setting_key' => 'api_key',
                'setting_value' => env('OPENAI_API_KEY', ''),
                'data_type' => 'string',
                'category' => 'api',
                'description' => 'OpenAI API Key for authentication',
                'is_sensitive' => true,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'api_base_url',
                'setting_value' => 'https://api.openai.com/v1',
                'data_type' => 'string',
                'category' => 'api',
                'description' => 'Base URL for OpenAI API',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'request_timeout',
                'setting_value' => 120,
                'data_type' => 'integer',
                'category' => 'api',
                'description' => 'Request timeout in seconds',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
        ];

        $this->insertSettings($settings);
    }

    private function seedTranscriptionSettings(): void
    {
        $settings = [
            [
                'setting_key' => 'transcription_model',
                'setting_value' => 'whisper-1',
                'data_type' => 'string',
                'category' => 'transcription',
                'description' => 'OpenAI model for audio transcription',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'transcription_response_format',
                'setting_value' => 'verbose_json',
                'data_type' => 'string',
                'category' => 'transcription',
                'description' => 'Response format for transcription',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'transcription_language',
                'setting_value' => null,
                'data_type' => 'string',
                'category' => 'transcription',
                'description' => 'Language for transcription (null for auto-detect)',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'transcription_prompt',
                'setting_value' => 'This is a meeting recording with multiple speakers discussing business topics.',
                'data_type' => 'string',
                'category' => 'transcription',
                'description' => 'Prompt to guide transcription context',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
        ];

        $this->insertSettings($settings);
    }

    private function seedChatSettings(): void
    {
        $settings = [
            [
                'setting_key' => 'chat_model',
                'setting_value' => 'gpt-4',
                'data_type' => 'string',
                'category' => 'chat',
                'description' => 'OpenAI model for chat/query responses',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'chat_max_tokens',
                'setting_value' => 1000,
                'data_type' => 'integer',
                'category' => 'chat',
                'description' => 'Maximum tokens for chat responses',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'chat_temperature',
                'setting_value' => 0.7,
                'data_type' => 'float',
                'category' => 'chat',
                'description' => 'Temperature for chat responses (0.0-2.0)',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'system_role',
                'setting_value' => 'system',
                'data_type' => 'string',
                'category' => 'chat',
                'description' => 'System role for chat messages',
                'is_sensitive' => false,
                'is_editable' => false,
            ],
            [
                'setting_key' => 'user_role',
                'setting_value' => 'user',
                'data_type' => 'string',
                'category' => 'chat',
                'description' => 'User role for chat messages',
                'is_sensitive' => false,
                'is_editable' => false,
            ],
        ];

        $this->insertSettings($settings);
    }

    private function seedLimitSettings(): void
    {
        $settings = [
            [
                'setting_key' => 'max_file_size_bytes',
                'setting_value' => 26214400, // 25MB
                'data_type' => 'integer',
                'category' => 'limits',
                'description' => 'Maximum file size for OpenAI API in bytes',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'max_file_size_mb',
                'setting_value' => 25,
                'data_type' => 'integer',
                'category' => 'limits',
                'description' => 'Maximum file size for OpenAI API in MB',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'rate_limit_per_minute',
                'setting_value' => 50,
                'data_type' => 'integer',
                'category' => 'limits',
                'description' => 'API requests per minute limit',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
            [
                'setting_key' => 'rate_limit_per_hour',
                'setting_value' => 1000,
                'data_type' => 'integer',
                'category' => 'limits',
                'description' => 'API requests per hour limit',
                'is_sensitive' => false,
                'is_editable' => true,
            ],
        ];

        $this->insertSettings($settings);
    }

    private function insertSettings(array $settings): void
    {
        foreach ($settings as $setting) {
            OpenAISetting::updateOrCreate(
                ['setting_key' => $setting['setting_key']],
                $setting
            );
        }
    }
}
