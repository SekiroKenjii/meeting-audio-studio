<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TranscriptQuery extends Model
{
    use HasFactory;

    protected $fillable = [
        'transcript_id',
        'query',
        'response',
        'context_segments',
        'openai_metadata'
    ];

    protected $casts = [
        'context_segments' => 'array',
    ];

    public function transcript(): BelongsTo
    {
        return $this->belongsTo(Transcript::class);
    }
}
