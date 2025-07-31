<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chunked_upload_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('upload_id')->unique();
            $table->string('filename');
            $table->string('original_filename');
            $table->bigInteger('file_size');
            $table->string('mime_type');
            $table->integer('total_chunks');
            $table->integer('uploaded_chunks')->default(0);
            $table->json('chunk_status')->nullable();
            $table->enum('status', ['initialized', 'uploading', 'completed', 'failed', 'cancelled'])->default('initialized');
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['upload_id', 'status']);
            $table->index('expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chunked_upload_sessions');
    }
};
