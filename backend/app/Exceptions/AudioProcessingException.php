<?php

namespace App\Exceptions;

use Exception;

class AudioProcessingException extends Exception
{
    public static function fileNotFound(string $filePath): self
    {
        return new self("Audio file not found at path: {$filePath}");
    }

    public static function fileSizeError(string $filePath): self
    {
        return new self("Unable to determine file size for: {$filePath}");
    }

    public static function compressionSizeError(): self
    {
        return new self('Unable to determine compressed file size');
    }

    public static function fileTooLarge(float $sizeMB): self
    {
        return new self("File still too large after compression: {$sizeMB}MB. Maximum is 25MB.");
    }

    public static function compressionFailed(string $error): self
    {
        return new self("Failed to compress audio file. FFmpeg error: {$error}");
    }

    public static function compressionFileNotCreated(): self
    {
        return new self('Compressed audio file was not created');
    }

    public static function transcriptionFailed(string $reason): self
    {
        return new self("Transcription failed: {$reason}");
    }

    public static function queryProcessingFailed(string $reason): self
    {
        return new self("Query processing failed: {$reason}");
    }
}
