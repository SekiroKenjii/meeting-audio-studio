<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SetupHorizon extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'setup:horizon';

    /**
     * The console command description.
     */
    protected $description = 'Setup and publish Horizon assets';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Publishing Horizon assets...');

        $this->call('horizon:install');
        $this->call('vendor:publish', ['--tag' => 'horizon-assets']);

        $this->info('Horizon setup completed successfully!');
        $this->line('You can access the Horizon dashboard at /horizon');

        return Command::SUCCESS;
    }
}
