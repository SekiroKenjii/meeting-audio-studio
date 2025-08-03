<?php

use App\Constants\Limits;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update app settings to 1GB limits
        DB::table('app_settings')->where('key', 'max_file_size_mb')->update([
            'value' => Limits::MAX_FILE_SIZE_MB,
        ]);

        DB::table('app_settings')->where('key', 'max_file_size_bytes')->update([
            'value' => Limits::MAX_FILE_SIZE_BYTES,
        ]);

        // Update audio type configs to 1GB limits
        DB::table('audio_type_configs')->update([
            'max_upload_size' => Limits::MAX_FILE_SIZE_BYTES,
            'compression_threshold' => Limits::COMPRESSION_THRESHOLD_BYTES, // 512MB
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert app settings to 100MB limits
        DB::table('app_settings')->where('key', 'max_file_size_mb')->update([
            'value' => 100,
        ]);

        DB::table('app_settings')->where('key', 'max_file_size_bytes')->update([
            'value' => 104857600, // 100MB in bytes
        ]);

        // Revert audio type configs to 100MB limits
        DB::table('audio_type_configs')->update([
            'max_upload_size' => 104857600, // 100MB
            'compression_threshold' => 26214400, // 25MB
        ]);
    }
};
