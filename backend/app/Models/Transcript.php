<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Transcript extends Model
{
    use HasFactory;

    protected $fillable = [
        'audio_file_id',
        'full_transcript',
        'diarized_segments',
        'speakers',
        'confidence_score',
        'openai_metadata'
    ];

    protected $casts = [
        'diarized_segments' => 'array',
        'speakers' => 'array',
        'confidence_score' => 'decimal:2',
    ];

    public function audioFile(): BelongsTo
    {
        return $this->belongsTo(AudioFile::class);
    }

    public function queries(): HasMany
    {
        return $this->hasMany(TranscriptQuery::class);
    }
}
