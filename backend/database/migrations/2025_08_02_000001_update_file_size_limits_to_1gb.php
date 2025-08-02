<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update app settings to 1GB limits
        DB::table('app_settings')->where('key', 'max_file_size_mb')->update([
            'value' => 1024, // 1GB in MB
        ]);

        DB::table('app_settings')->where('key', 'max_file_size_bytes')->update([
            'value' => 1073741824, // 1GB in bytes
        ]);

        // Update audio type configs to 1GB limits
        DB::table('audio_type_configs')->update([
            'max_upload_size' => 1073741824, // 1GB
            'compression_threshold' => 536870912, // 512MB
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
