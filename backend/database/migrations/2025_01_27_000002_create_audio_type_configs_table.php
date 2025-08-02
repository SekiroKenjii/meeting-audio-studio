<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('audio_type_configs', function (Blueprint $table) {
            $table->id();
            $table->string('mime_type');
            $table->string('file_extension');
            $table->string('display_name');
            $table->boolean('is_enabled')->default(true);

            // Compression settings
            $table->string('compression_codec')->default('libmp3lame');
            $table->string('compression_quality')->default('9'); // Variable quality
            $table->string('audio_bitrate')->default('64k');
            $table->integer('sample_rate')->default(16000);
            $table->integer('channels')->default(1);
            $table->string('output_format')->default('mp3');

            // Aggressive compression fallback settings
            $table->string('aggressive_bitrate')->default('32k');
            $table->integer('aggressive_sample_rate')->default(8000);

            // File size limits (in bytes)
            $table->bigInteger('max_upload_size')->default(1073741824); // 1GB
            $table->bigInteger('compression_threshold')->default(536870912); // 512MB

            // Processing settings
            $table->json('ffmpeg_options')->nullable(); // Additional FFmpeg options
            $table->text('description')->nullable();

            $table->timestamps();

            $table->unique(['mime_type', 'file_extension']);
            $table->index('is_enabled');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audio_type_configs');
    }
};
