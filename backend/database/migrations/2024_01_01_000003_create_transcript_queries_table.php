<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transcript_queries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transcript_id')->constrained()->onDelete('cascade');
            $table->text('query');
            $table->text('response');
            $table->json('context_segments')->nullable();
            $table->text('openai_metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transcript_queries');
    }
};
