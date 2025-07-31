<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AudioTypeConfig extends Model
{
    protected $fillable = [
        'mime_type',
        'file_extension',
        'display_name',
        'is_enabled',
        'compression_codec',
        'compression_quality',
        'audio_bitrate',
        'sample_rate',
        'channels',
        'output_format',
        'aggressive_bitrate',
        'aggressive_sample_rate',
        'max_upload_size',
        'compression_threshold',
        'ffmpeg_options',
        'description'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'sample_rate' => 'integer',
        'channels' => 'integer',
        'aggressive_sample_rate' => 'integer',
        'max_upload_size' => 'integer',
        'compression_threshold' => 'integer',
        'ffmpeg_options' => 'array',
    ];

    /**
     * Get configuration for a specific MIME type
     */
    public static function getConfigForMimeType(string $mimeType): ?self
    {
        return static::where('mime_type', $mimeType)
            ->where('is_enabled', true)
            ->first();
    }

    /**
     * Get configuration for a file extension
     */
    public static function getConfigForExtension(string $extension): ?self
    {
        return static::where('file_extension', $extension)
            ->where('is_enabled', true)
            ->first();
    }

    /**
     * Get all enabled audio types
     */
    public static function getEnabledTypes(): array
    {
        return static::where('is_enabled', true)
            ->get()
            ->toArray();
    }

    /**
     * Get FFmpeg command for standard compression
     */
    public function getCompressionCommand(string $inputPath, string $outputPath): string
    {
        $baseCommand = sprintf(
            'ffmpeg -y -i %s -acodec %s -q:a %s -ar %d -ac %d -f %s %s 2>&1',
            escapeshellarg($inputPath),
            $this->compression_codec,
            $this->compression_quality,
            $this->sample_rate,
            $this->channels,
            $this->output_format,
            escapeshellarg($outputPath)
        );

        // Add additional FFmpeg options if specified
        if ($this->ffmpeg_options) {
            $additionalOptions = implode(' ', $this->ffmpeg_options);
            $baseCommand = str_replace(
                escapeshellarg($outputPath),
                "$additionalOptions " . escapeshellarg($outputPath),
                $baseCommand
            );
        }

        return $baseCommand;
    }

    /**
     * Get FFmpeg command for aggressive compression
     */
    public function getAggressiveCompressionCommand(string $inputPath, string $outputPath): string
    {
        return sprintf(
            'ffmpeg -y -i %s -acodec %s -b:a %s -ar %d -ac 1 -f %s %s 2>&1',
            escapeshellarg($inputPath),
            $this->compression_codec,
            $this->aggressive_bitrate,
            $this->aggressive_sample_rate,
            $this->output_format,
            escapeshellarg($outputPath)
        );
    }

    /**
     * Check if file size exceeds compression threshold
     */
    public function shouldCompress(int $fileSize): bool
    {
        return $fileSize > $this->compression_threshold;
    }

    /**
     * Check if file size is within upload limits
     */
    public function isValidFileSize(int $fileSize): bool
    {
        return $fileSize <= $this->max_upload_size;
    }
}
