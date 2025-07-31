<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    public function up(): void
    {
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('category');
            $table->text('value');
            $table->string('type')->default('string'); // string, integer, float, boolean, json
            $table->text('description')->nullable();
            $table->boolean('is_editable')->default(true);
            $table->timestamps();

            $table->index(['category', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
