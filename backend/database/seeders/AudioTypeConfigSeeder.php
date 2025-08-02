<?php

namespace Database\Seeders;

use App\Models\AudioTypeConfig;
use Illuminate\Database\Seeder;

class AudioTypeConfigSeeder extends Seeder
{
    public function run(): void
    {
        $configs = [
            // MP3 Configuration
            [
                'mime_type' => 'audio/mpeg',
                'file_extension' => 'mp3',
                'display_name' => 'MP3 Audio',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '7', // Good quality for speech
                'audio_bitrate' => '64k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '32k',
                'aggressive_sample_rate' => 8000,
                'max_upload_size' => 1073741824, // 1GB
                'compression_threshold' => 536870912, // 512MB
                'description' => 'Optimized for speech with moderate compression',
            ],

            // WAV Configuration
            [
                'mime_type' => 'audio/wav',
                'file_extension' => 'wav',
                'display_name' => 'WAV Audio',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '6', // Higher quality for uncompressed source
                'audio_bitrate' => '96k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '48k',
                'aggressive_sample_rate' => 16000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'High quality compression for uncompressed WAV files',
            ],

            // M4A Configuration
            [
                'mime_type' => 'audio/m4a',
                'file_extension' => 'm4a',
                'display_name' => 'M4A Audio',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '8', // Conservative for already compressed
                'audio_bitrate' => '56k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '32k',
                'aggressive_sample_rate' => 8000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'Conservative compression for M4A files',
            ],

            // Alternative M4A MIME types
            [
                'mime_type' => 'audio/x-m4a',
                'file_extension' => 'm4a',
                'display_name' => 'M4A Audio (Alt)',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '8',
                'audio_bitrate' => '56k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '32k',
                'aggressive_sample_rate' => 8000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'Alternative MIME type for M4A files',
            ],

            // MP4 Container (for M4A)
            [
                'mime_type' => 'audio/mp4',
                'file_extension' => 'm4a',
                'display_name' => 'MP4 Audio Container',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '8',
                'audio_bitrate' => '56k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '32k',
                'aggressive_sample_rate' => 8000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'MP4 container format for M4A audio files',
            ],

            // Alternative WAV MIME type
            [
                'mime_type' => 'audio/x-wav',
                'file_extension' => 'wav',
                'display_name' => 'WAV Audio (Alt)',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '6', // Higher quality for uncompressed source
                'audio_bitrate' => '96k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '48k',
                'aggressive_sample_rate' => 16000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'Alternative MIME type for WAV files',
            ],

            // FLAC Configuration
            [
                'mime_type' => 'audio/flac',
                'file_extension' => 'flac',
                'display_name' => 'FLAC Audio',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '5', // High quality for lossless source
                'audio_bitrate' => '128k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '64k',
                'aggressive_sample_rate' => 16000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'High quality compression for lossless FLAC files',
            ],

            // OGG Configuration
            [
                'mime_type' => 'audio/ogg',
                'file_extension' => 'ogg',
                'display_name' => 'OGG Audio',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '7',
                'audio_bitrate' => '64k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '32k',
                'aggressive_sample_rate' => 8000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'Standard compression for OGG files',
            ],

            // AAC Configuration
            [
                'mime_type' => 'audio/aac',
                'file_extension' => 'aac',
                'display_name' => 'AAC Audio',
                'is_enabled' => true,
                'compression_codec' => 'libmp3lame',
                'compression_quality' => '8',
                'audio_bitrate' => '48k',
                'sample_rate' => 16000,
                'channels' => 1,
                'output_format' => 'mp3',
                'aggressive_bitrate' => '32k',
                'aggressive_sample_rate' => 8000,
                'max_upload_size' => 1073741824,
                'compression_threshold' => 26214400,
                'description' => 'Conservative compression for AAC files',
            ],
        ];

        foreach ($configs as $config) {
            AudioTypeConfig::updateOrCreate(
                ['mime_type' => $config['mime_type'], 'file_extension' => $config['file_extension']],
                $config
            );
        }
    }
}
