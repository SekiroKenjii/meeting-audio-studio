<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transcripts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audio_file_id')->constrained()->onDelete('cascade');
            $table->longText('full_transcript');
            $table->json('diarized_segments')->nullable();
            $table->json('speakers')->nullable();
            $table->decimal('confidence_score', 3, 2)->nullable();
            $table->text('openai_metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transcripts');
    }
};
