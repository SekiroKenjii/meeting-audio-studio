<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audio_files', function (Blueprint $table) {
            $table->id();
            $table->string('filename');
            $table->string('original_filename');
            $table->string('file_path');
            $table->string('processed_file_path')->nullable();
            $table->string('file_size');
            $table->string('mime_type');
            $table->decimal('duration', 8, 2)->nullable();
            $table->integer('sample_rate')->nullable();
            $table->text('processing_metadata')->nullable();
            $table->enum('status', ['uploaded', 'processing', 'processed', 'transcribed', 'failed'])->default('uploaded');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audio_files');
    }
};
