<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\FileTypeSetting;

class FileTypeSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $fileTypes = [
            [
                'mime_type' => 'audio/mpeg',
                'file_extension' => 'mp3',
                'display_name' => 'MP3',
                'is_enabled' => true,
                'priority' => 10,
                'description' => 'Most common audio format for music and speech',
            ],
            [
                'mime_type' => 'audio/wav',
                'file_extension' => 'wav',
                'display_name' => 'WAV',
                'is_enabled' => true,
                'priority' => 9,
                'description' => 'Uncompressed audio format with high quality',
            ],
            [
                'mime_type' => 'audio/x-wav',
                'file_extension' => 'wav',
                'display_name' => 'WAV (Alt)',
                'is_enabled' => true,
                'priority' => 8,
                'description' => 'Alternative MIME type for WAV files',
            ],
            [
                'mime_type' => 'audio/m4a',
                'file_extension' => 'm4a',
                'display_name' => 'M4A',
                'is_enabled' => true,
                'priority' => 7,
                'description' => 'Apple audio format, commonly used for voice recordings',
            ],
            [
                'mime_type' => 'audio/x-m4a',
                'file_extension' => 'm4a',
                'display_name' => 'M4A (Alt)',
                'is_enabled' => true,
                'priority' => 6,
                'description' => 'Alternative MIME type for M4A files',
            ],
            [
                'mime_type' => 'audio/mp4',
                'file_extension' => 'm4a',
                'display_name' => 'MP4 Audio',
                'is_enabled' => true,
                'priority' => 5,
                'description' => 'Audio track from MP4 container',
            ],
            [
                'mime_type' => 'audio/mp4a',
                'file_extension' => 'm4a',
                'display_name' => 'MP4A',
                'is_enabled' => true,
                'priority' => 4,
                'description' => 'MPEG-4 audio format',
            ],
            [
                'mime_type' => 'audio/aac',
                'file_extension' => 'aac',
                'display_name' => 'AAC',
                'is_enabled' => true,
                'priority' => 3,
                'description' => 'Advanced Audio Coding format',
            ],
            [
                'mime_type' => 'audio/flac',
                'file_extension' => 'flac',
                'display_name' => 'FLAC',
                'is_enabled' => true,
                'priority' => 2,
                'description' => 'Free Lossless Audio Codec',
            ],
            [
                'mime_type' => 'audio/ogg',
                'file_extension' => 'ogg',
                'display_name' => 'OGG',
                'is_enabled' => true,
                'priority' => 1,
                'description' => 'Ogg Vorbis audio format',
            ],
            [
                'mime_type' => 'audio/vorbis',
                'file_extension' => 'ogg',
                'display_name' => 'Vorbis',
                'is_enabled' => true,
                'priority' => 0,
                'description' => 'Ogg Vorbis audio codec',
            ],
        ];

        foreach ($fileTypes as $fileType) {
            FileTypeSetting::updateOrCreate(
                ['mime_type' => $fileType['mime_type'], 'file_extension' => $fileType['file_extension']],
                $fileType
            );
        }
    }
}
