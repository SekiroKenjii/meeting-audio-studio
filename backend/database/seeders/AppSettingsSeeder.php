<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AppSetting;

class AppSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // File Size Limits
            [
                'key' => 'max_file_size_mb',
                'category' => 'file_limits',
                'value' => 1024, // 1GB
                'type' => 'integer',
                'description' => 'Maximum file size for uploads in MB',
            ],
            [
                'key' => 'max_file_size_bytes',
                'category' => 'file_limits',
                'value' => 1073741824, // 1GB
                'type' => 'integer',
                'description' => 'Maximum file size for uploads in bytes',
            ],
            [
                'key' => 'compression_threshold_mb',
                'category' => 'file_limits',
                'value' => 25,
                'type' => 'integer',
                'description' => 'File size threshold for compression in MB',
            ],
            [
                'key' => 'compression_threshold_bytes',
                'category' => 'file_limits',
                'value' => 26214400, // 25MB
                'type' => 'integer',
                'description' => 'File size threshold for compression in bytes',
            ],

            // Processing Limits
            [
                'key' => 'max_speakers',
                'category' => 'processing',
                'value' => 10,
                'type' => 'integer',
                'description' => 'Maximum number of speakers for diarization',
            ],
            [
                'key' => 'speaker_change_gap_seconds',
                'category' => 'processing',
                'value' => 2.0,
                'type' => 'float',
                'description' => 'Minimum gap in seconds to detect speaker change',
            ],
            [
                'key' => 'processing_timeout_seconds',
                'category' => 'processing',
                'value' => 600,
                'type' => 'integer',
                'description' => 'Maximum processing timeout in seconds',
            ],

            // Validation Limits
            [
                'key' => 'max_query_length',
                'category' => 'validation',
                'value' => 1000,
                'type' => 'integer',
                'description' => 'Maximum length for transcript queries',
            ],
            [
                'key' => 'max_filename_length',
                'category' => 'validation',
                'value' => 255,
                'type' => 'integer',
                'description' => 'Maximum length for filenames',
            ],
        ];

        foreach ($settings as $setting) {
            AppSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
