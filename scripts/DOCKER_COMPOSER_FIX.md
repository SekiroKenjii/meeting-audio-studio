# Docker Composer Fix Script

This script fixes common issues with package installation and autoloader problems in Docker containers for the Meeting Audio Studio project.

## Quick Start

```bash
# Fix all common issues (recommended)
./scripts/fix-docker-composer.sh

# Or from the scripts directory
cd scripts && ./fix-docker-composer.sh
```

## Usage Examples

### Full Fix (Recommended)
```bash
./scripts/fix-docker-composer.sh
```
This runs all fixes: autoloader, Faker package, and permissions.

### Specific Fixes

**Fix only Faker package issues:**
```bash
./scripts/fix-docker-composer.sh --faker-only
```
Use when you get "Class 'Faker\Factory' not found" errors.

**Fix only autoloader issues:**
```bash
./scripts/fix-docker-composer.sh --autoloader-only
```
Use when you get class not found errors or after package updates.

**Fix only permission issues:**
```bash
./scripts/fix-docker-composer.sh --permissions-only
```
Use when you get permission denied errors on storage or cache directories.

**Validate current state:**
```bash
./scripts/fix-docker-composer.sh --validate-only
```
Use to check if everything is working without making changes.

## Common Error Scenarios

### Scenario 1: Migration Seeding Fails
**Error:**
```
Class "Faker\Factory" not found
```

**Solution:**
```bash
./scripts/fix-docker-composer.sh --faker-only
```

### Scenario 2: Artisan Commands Fail
**Error:**
```
Class not found or autoloader issues
```

**Solution:**
```bash
./scripts/fix-docker-composer.sh --autoloader-only
```

### Scenario 3: After Package Updates
**When:** After running `composer update` or adding new packages

**Solution:**
```bash
./scripts/fix-docker-composer.sh
```

### Scenario 4: Fresh Project Setup
**When:** Setting up the project for the first time

**Solution:**
```bash
./scripts/fix-docker-composer.sh
docker-compose exec backend php artisan migrate:fresh --seed
```

## What the Script Does

1. **Autoloader Fix:**
   - Clears composer cache
   - Removes and reinstalls vendor directory
   - Regenerates optimized autoloader

2. **Faker Package Fix:**
   - Removes fakerphp/faker package
   - Reinstalls it as dev dependency
   - Ensures proper registration

3. **Permission Fix:**
   - Sets correct permissions on storage and bootstrap/cache
   - Ensures www-data owns necessary directories

4. **Validation:**
   - Tests if Faker classes are available
   - Validates autoloader functionality
   - Checks database connection

## Troubleshooting

### Script Fails to Start
- Ensure Docker and docker-compose are installed
- Make sure you're in the project root directory
- Check if containers are running: `docker-compose ps`

### Validation Fails
- Check Docker container logs: `docker-compose logs backend`
- Ensure database is configured properly
- Try running the full fix: `./scripts/fix-docker-composer.sh`

### Permission Issues
- Run: `./scripts/fix-docker-composer.sh --permissions-only`
- Check Docker container user permissions

## After Running the Script

Once the script completes successfully, you can:

```bash
# Test database operations
docker-compose exec backend php artisan migrate:fresh --seed

# Run tests
docker-compose exec backend php artisan test

# Check application status
docker-compose exec backend php artisan about
```
