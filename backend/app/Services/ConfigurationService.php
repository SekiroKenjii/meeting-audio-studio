<?php

namespace App\Services;

use App\Abstracts\Services\ConfigurationServiceInterface;
use App\Models\AppSetting;
use App\Models\AudioTypeConfig;
use App\Models\FileTypeSetting;
use App\Models\OpenAISetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class ConfigurationService implements ConfigurationServiceInterface
{
    private const int CACHE_TTL    = 3600;
    private const string CACHE_PREFIX = 'config_';

    /**
     * Get upload configuration for API response
     */
    public function getUploadConfig(): array
    {
        return Cache::remember(self::CACHE_PREFIX.'upload_config', self::CACHE_TTL, function () {
            $fileTypes = FileTypeSetting::getEnabledTypes();
            $limits = AppSetting::getByCategory('file_limits');

            return [
                'allowed_mime_types' => FileTypeSetting::getEnabledMimeTypes(),
                'allowed_extensions' => FileTypeSetting::getEnabledExtensions(),
                'supported_formats' => $fileTypes,
                'max_file_size_mb' => $limits['max_file_size_mb'] ?? 100,
                'max_file_size_bytes' => $limits['max_file_size_bytes'] ?? 104857600,
                'compression_threshold_mb' => $limits['compression_threshold_mb'] ?? 25,
                'compression_threshold_bytes' => $limits['compression_threshold_bytes'] ?? 26214400,
            ];
        });
    }

    /**
     * Get audio compression configuration for a specific MIME type
     */
    public function getAudioConfig(string $mimeType): ?AudioTypeConfig
    {
        $cacheKey = self::CACHE_PREFIX.'audio_config_'.md5($mimeType);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($mimeType) {
            return AudioTypeConfig::getConfigForMimeType($mimeType);
        });
    }

    /**
     * Get OpenAI configuration
     */
    public function getOpenAIConfig(): array
    {
        return Cache::remember(self::CACHE_PREFIX.'openai_config', self::CACHE_TTL, function () {
            return [
                'api' => OpenAISetting::getByCategory('api'),
                'transcription' => OpenAISetting::getByCategory('transcription'),
                'chat' => OpenAISetting::getByCategory('chat'),
                'limits' => OpenAISetting::getByCategory('limits'),
            ];
        });
    }

    /**
     * Get app settings by category
     */
    public function getAppSettings(string $category): array
    {
        $cacheKey = self::CACHE_PREFIX.'app_settings_'.$category;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($category) {
            return AppSetting::getByCategory($category);
        });
    }

    /**
     * Check if a file type is supported
     */
    public function isFileTypeSupported(string $mimeType): bool
    {
        $supportedTypes = $this->getUploadConfig()['allowed_mime_types'];
        return in_array($mimeType, $supportedTypes);
    }

    /**
     * Get file size limits
     */
    public function getFileSizeLimits(): array
    {
        return $this->getAppSettings('file_limits');
    }

    /**
     * Get processing limits
     */
    public function getProcessingLimits(): array
    {
        return $this->getAppSettings('processing');
    }

    /**
     * Get validation limits
     */
    public function getValidationLimits(): array
    {
        return $this->getAppSettings('validation');
    }

    /**
     * Clear all configuration cache
     */
    public function clearCache(): void
    {
        $keys = [
            'upload_config',
            'openai_config',
            'app_settings_file_limits',
            'app_settings_processing',
            'app_settings_validation',
        ];

        foreach ($keys as $key) {
            Cache::forget(self::CACHE_PREFIX.$key);
        }

        // Clear audio config cache (dynamic keys)
        $audioConfigs = AudioTypeConfig::all();
        foreach ($audioConfigs as $config) {
            Cache::forget(self::CACHE_PREFIX.'audio_config_'.md5($config->mime_type));
        }
    }

    /**
     * Update configuration and clear cache
     */
    public function updateAndClearCache(): void
    {
        $this->clearCache();
    }

    /**
     * Get all enabled audio types with their configurations
     */
    public function getAllAudioConfigs(): Collection
    {
        return Cache::remember(self::CACHE_PREFIX.'all_audio_configs', self::CACHE_TTL, function () {
            return AudioTypeConfig::where('is_enabled', true)->get();
        });
    }

    /**
     * Get FFmpeg compression command for a file
     */
    public function getCompressionCommand(string $mimeType, string $inputPath, string $outputPath): ?string
    {
        $config = $this->getAudioConfig($mimeType);
        return $config?->getCompressionCommand($inputPath, $outputPath);
    }

    /**
     * Get aggressive compression command for a file
     */
    public function getAggressiveCompressionCommand(string $mimeType, string $inputPath, string $outputPath): ?string
    {
        $config = $this->getAudioConfig($mimeType);
        return $config?->getAggressiveCompressionCommand($inputPath, $outputPath);
    }

    /**
     * Check if file should be compressed based on its type and size
     */
    public function shouldCompressFile(string $mimeType, int $fileSize): bool
    {
        $config = $this->getAudioConfig($mimeType);
        return $config ? $config->shouldCompress($fileSize) : false;
    }

    /**
     * Validate file size against type-specific limits
     */
    public function validateFileSize(string $mimeType, int $fileSize): bool
    {
        $config = $this->getAudioConfig($mimeType);
        return $config ? $config->isValidFileSize($fileSize) : false;
    }
}
