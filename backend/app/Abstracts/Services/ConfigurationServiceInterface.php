<?php

namespace App\Abstracts\Services;

interface ConfigurationServiceInterface
{
    /**
     * Get upload configuration
     */
    public function getUploadConfig(): array;

    /**
     * Get OpenAI configuration
     */
    public function getOpenAIConfig(): array;

    /**
     * Check if file type is supported
     */
    public function isFileTypeSupported(string $mimeType): bool;

    /**
     * Validate file size for given mime type
     */
    public function validateFileSize(string $mimeType, int $fileSize): bool;

    /**
     * Get compression command for given mime type
     */
    public function getCompressionCommand(string $mimeType, string $inputPath, string $outputPath): ?string;

    /**
     * Get aggressive compression command for given mime type
     */
    public function getAggressiveCompressionCommand(string $mimeType, string $inputPath, string $outputPath): ?string;
}
