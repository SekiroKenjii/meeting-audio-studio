<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('file_type_settings', function (Blueprint $table) {
            $table->id();
            $table->string('mime_type');
            $table->string('file_extension');
            $table->string('display_name');
            $table->boolean('is_enabled')->default(true);
            $table->integer('priority')->default(0); // For ordering in UI
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['mime_type', 'file_extension']);
            $table->index(['is_enabled', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_type_settings');
    }
};
