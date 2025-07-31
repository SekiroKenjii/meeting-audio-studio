<?php

namespace App\Console\Commands;

use App\Jobs\CleanupExpiredChunkedUploadsJob;
use Illuminate\Console\Command;

class CleanupChunkedUploads extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'chunked-uploads:cleanup';

    /**
     * The console command description.
     */
    protected $description = 'Clean up expired chunked upload sessions and their chunk files';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting chunked upload cleanup...');

        CleanupExpiredChunkedUploadsJob::dispatch();

        $this->info('Chunked upload cleanup job dispatched successfully.');

        return 0;
    }
}
