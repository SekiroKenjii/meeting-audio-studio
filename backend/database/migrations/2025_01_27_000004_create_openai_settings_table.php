<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('openai_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key')->unique();
            $table->text('setting_value');
            $table->string('data_type')->default('string'); // string, integer, float, boolean, json
            $table->string('category'); // transcription, chat, limits, etc.
            $table->text('description')->nullable();
            $table->boolean('is_sensitive')->default(false); // For API keys
            $table->boolean('is_editable')->default(true);
            $table->timestamps();

            $table->index(['category', 'setting_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('openai_settings');
    }
};
