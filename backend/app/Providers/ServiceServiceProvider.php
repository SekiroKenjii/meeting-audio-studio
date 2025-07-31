<?php

namespace App\Providers;

use App\Abstracts\Services\AudioServiceInterface;
use App\Abstracts\Services\ConfigurationServiceInterface;
use App\Abstracts\Services\OpenAIServiceInterface;
use App\Abstracts\Services\TranscriptServiceInterface;
use App\Services\AudioService;
use App\Services\ConfigurationService;
use App\Services\OpenAIService;
use App\Services\TranscriptService;
use Illuminate\Support\ServiceProvider;

class ServiceServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            ConfigurationServiceInterface::class,
            ConfigurationService::class
        );

        $this->app->bind(
            OpenAIServiceInterface::class,
            OpenAIService::class
        );

        $this->app->bind(
            AudioServiceInterface::class,
            AudioService::class
        );

        $this->app->bind(
            TranscriptServiceInterface::class,
            TranscriptService::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
