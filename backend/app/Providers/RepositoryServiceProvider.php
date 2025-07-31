<?php

namespace App\Providers;

use App\Abstracts\Repositories\AudioFileRepositoryInterface;
use App\Abstracts\Repositories\TranscriptQueryRepositoryInterface;
use App\Abstracts\Repositories\TranscriptRepositoryInterface;
use App\Repositories\AudioFileRepository;
use App\Repositories\TranscriptQueryRepository;
use App\Repositories\TranscriptRepository;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            AudioFileRepositoryInterface::class,
            AudioFileRepository::class
        );

        $this->app->bind(
            TranscriptRepositoryInterface::class,
            TranscriptRepository::class
        );

        $this->app->bind(
            TranscriptQueryRepositoryInterface::class,
            TranscriptQueryRepository::class
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
