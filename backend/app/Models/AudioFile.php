<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class AudioFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'filename',
        'original_filename',
        'file_path',
        'processed_file_path',
        'file_size',
        'mime_type',
        'duration',
        'sample_rate',
        'processing_metadata',
        'status'
    ];

    protected $casts = [
        'processing_metadata' => 'array',
        'duration' => 'decimal:2',
        'file_size' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function transcript(): HasOne
    {
        return $this->hasOne(Transcript::class);
    }

    public function isProcessed(): bool
    {
        return in_array($this->status, ['processed', 'transcribed']);
    }

    public function isTranscribed(): bool
    {
        return $this->status === 'transcribed';
    }
}
