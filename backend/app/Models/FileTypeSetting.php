<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileTypeSetting extends Model
{
    protected $fillable = [
        'mime_type',
        'file_extension',
        'display_name',
        'is_enabled',
        'priority',
        'description'
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'priority' => 'integer',
    ];

    /**
     * Get all enabled file types
     */
    public static function getEnabledTypes(): array
    {
        return static::where('is_enabled', true)
            ->orderBy('priority', 'desc')
            ->orderBy('display_name')
            ->get()
            ->toArray();
    }

    /**
     * Get enabled MIME types
     */
    public static function getEnabledMimeTypes(): array
    {
        return static::where('is_enabled', true)
            ->pluck('mime_type')
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Get enabled file extensions
     */
    public static function getEnabledExtensions(): array
    {
        return static::where('is_enabled', true)
            ->pluck('file_extension')
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Check if MIME type is supported
     */
    public static function isMimeTypeSupported(string $mimeType): bool
    {
        return static::where('mime_type', $mimeType)
            ->where('is_enabled', true)
            ->exists();
    }

    /**
     * Check if file extension is supported
     */
    public static function isExtensionSupported(string $extension): bool
    {
        return static::where('file_extension', $extension)
            ->where('is_enabled', true)
            ->exists();
    }

    /**
     * Get display name for MIME type
     */
    public static function getDisplayNameForMimeType(string $mimeType): ?string
    {
        $setting = static::where('mime_type', $mimeType)
            ->where('is_enabled', true)
            ->first();

        return $setting?->display_name;
    }
}
