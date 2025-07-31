<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class AppSetting extends Model
{
    protected $fillable = [
        'key',
        'category',
        'value',
        'type',
        'description',
        'is_editable'
    ];

    protected $casts = [
        'is_editable' => 'boolean',
    ];

    /**
     * Get the parsed value based on type
     */
    protected function value(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->parseValue($value, $this->type),
            set: fn ($value) => $this->stringifyValue($value, $this->type),
        );
    }

    /**
     * Parse value based on type
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
        $setting = static::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * Set setting value
     */
    public static function setSetting(string $key, $value, string $category = 'general', string $type = 'string', string $description = null): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            [
                'category' => $category,
                'value' => $value,
                'type' => $type,
                'description' => $description,
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
            ->pluck('value', 'key')
            ->toArray();
    }
}
