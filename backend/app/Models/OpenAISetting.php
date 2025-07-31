<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class OpenAISetting extends Model
{
    protected $table = 'openai_settings';

    protected $fillable = [
        'setting_key',
        'setting_value',
        'data_type',
        'category',
        'description',
        'is_sensitive',
        'is_editable'
    ];

    protected $casts = [
        'is_sensitive' => 'boolean',
        'is_editable' => 'boolean',
    ];

    /**
     * Get the parsed value based on data type
     */
    protected function settingValue(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->parseValue($value, $this->data_type),
            set: fn ($value) => $this->stringifyValue($value, $this->data_type),
        );
    }

    /**
     * Parse value based on data type
     */
    private function parseValue($value, $type)
    {
        return match ($type) {
            'integer' => (int) $value,
            'float' => (float) $value,
            'boolean' => filter_var($value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Convert value to string for storage
     */
    private function stringifyValue($value, $type)
    {
        return match ($type) {
            'boolean' => $value ? '1' : '0',
            'json' => json_encode($value),
            default => (string) $value,
        };
    }

    /**
     * Get setting by key
     */
    public static function getSetting(string $key, $default = null)
    {
        $setting = static::where('setting_key', $key)->first();
        return $setting ? $setting->setting_value : $default;
    }

    /**
     * Set setting value
     */
    public static function setSetting(
        string $key,
        $value,
        string $category = 'general',
        string $dataType = 'string',
        string $description = null,
        bool $isSensitive = false
    ): self {
        return static::updateOrCreate(
            ['setting_key' => $key],
            [
                'setting_value' => $value,
                'data_type' => $dataType,
                'category' => $category,
                'description' => $description,
                'is_sensitive' => $isSensitive,
            ]
        );
    }

    /**
     * Get settings by category
     */
    public static function getByCategory(string $category): array
    {
        return static::where('category', $category)
            ->get()
            ->pluck('setting_value', 'setting_key')
            ->toArray();
    }

    /**
     * Get all transcription settings
     */
    public static function getTranscriptionSettings(): array
    {
        return static::getByCategory('transcription');
    }

    /**
     * Get all chat settings
     */
    public static function getChatSettings(): array
    {
        return static::getByCategory('chat');
    }

    /**
     * Get all limit settings
     */
    public static function getLimitSettings(): array
    {
        return static::getByCategory('limits');
    }
}
