<?php

namespace App\Console\Commands;

use Faker\Factory as FakerFactory;
use Illuminate\Console\Command;
use RuntimeException;

class ValidateEnvironment extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'validate:environment {--component=all : Validate specific component (faker|autoloader|database|all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Validate environment components for proper functionality';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $component = $this->option('component');
        $allPassed = true;

        $this->info('=== Environment Validation ===');

        switch ($component) {
            case 'faker':
                $allPassed = $this->validateFaker();
                break;
            case 'autoloader':
                $allPassed = $this->validateAutoloader();
                break;
            case 'database':
                $allPassed = $this->validateDatabase();
                break;
            case 'all':
            default:
                $allPassed = $this->validateFaker() &&
                    $this->validateAutoloader() &&
                    $this->validateDatabase();
                break;
        }

        if ($allPassed) {
            $this->info('=== All validations passed ===');
            return Command::SUCCESS;
        } else {
            $this->error('=== Some validations failed ===');
            return Command::FAILURE;
        }
    }

    /**
     * Validate Faker functionality
     */
    private function validateFaker(): bool
    {
        $this->info('Testing Faker availability...');

        try {
            // Test fake() helper
            $name = fake()->name();
            if (empty($name)) {
                throw new RuntimeException('fake() helper returned empty value');
            }

            // Test Factory class directly
            $faker = FakerFactory::create();
            $email = $faker->email();
            if (empty($email)) {
                throw new RuntimeException('Faker Factory returned empty value');
            }

            $this->line("✓ Faker is working (generated: {$name}, {$email})");
            return true;
        } catch (RuntimeException $e) {
            $this->error("✗ Faker validation failed: ".$e->getMessage());
            return false;
        }
    }

    /**
     * Validate autoloader functionality
     */
    private function validateAutoloader(): bool
    {
        $this->info('Testing autoloader...');

        try {
            // Test if key Laravel classes are loadable
            $testClasses = [
                'Illuminate\Support\Facades\DB',
                'Illuminate\Support\Collection',
                'App\Models\User',
                'Faker\Factory'
            ];

            foreach ($testClasses as $class) {
                if (! class_exists($class)) {
                    throw new RuntimeException("Class {$class} not found in autoloader");
                }
            }

            // Test if composer autoload file exists and is readable
            $autoloadFile = base_path('vendor/autoload.php');
            if (! file_exists($autoloadFile) || ! is_readable($autoloadFile)) {
                throw new RuntimeException('Composer autoload file not found or not readable');
            }

            $this->line('✓ Autoloader is working correctly');
            return true;
        } catch (RuntimeException $e) {
            $this->error("✗ Autoloader validation failed: ".$e->getMessage());
            return false;
        }
    }

    /**
     * Validate database connectivity and migrations
     */
    private function validateDatabase(): bool
    {
        $this->info('Testing database operations...');

        try {
            // Test database connection
            \DB::connection()->getPdo();
            $this->line('✓ Database connection successful');

            // Check if migrations table exists
            if (! \Schema::hasTable('migrations')) {
                $this->warn('⚠ Migrations table not found - database may not be initialized');
                return true; // Not a failure, just not initialized
            }

            // Get migration status
            $migrations = \DB::table('migrations')->count();
            $this->line("✓ Database initialized with {$migrations} migrations");

            return true;
        } catch (RuntimeException $e) {
            $this->error("✗ Database validation failed: ".$e->getMessage());
            return false;
        }
    }
}
