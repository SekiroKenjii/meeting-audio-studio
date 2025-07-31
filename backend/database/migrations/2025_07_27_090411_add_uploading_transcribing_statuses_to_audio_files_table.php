<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For PostgreSQL, we need to use raw SQL to modify the enum constraint
        DB::statement("ALTER TABLE audio_files DROP CONSTRAINT audio_files_status_check");
        DB::statement("ALTER TABLE audio_files ADD CONSTRAINT audio_files_status_check CHECK (status IN ('uploaded', 'uploading', 'processing', 'processed', 'transcribing', 'transcribed', 'failed'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original constraint
        DB::statement("ALTER TABLE audio_files DROP CONSTRAINT audio_files_status_check");
        DB::statement("ALTER TABLE audio_files ADD CONSTRAINT audio_files_status_check CHECK (status IN ('uploaded', 'processing', 'processed', 'transcribed', 'failed'))");
    }
};
