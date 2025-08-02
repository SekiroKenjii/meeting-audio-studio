# Docker Composer Fix Script

This script addresses common issues with PHP packages not being properly installed or registered in Docker containers, particularly for Laravel applications.

## Overview

The script provides comprehensive solutions for:
- Package installation issues (especially fakerphp/faker)
- Composer autoloader problems
- File permission issues
- Environment validation using a dedicated Laravel command

## Validation System

The script uses a custom Laravel command (`validate:environment`) for robust validation instead of brittle shell commands. This provides:

- **Reliable Testing**: Uses actual PHP classes and Laravel framework
- **Clear Output**: Structured validation messages with success/failure indicators
- **Component-Specific Validation**: Test individual components independently
- **Proper Error Handling**: Laravel exception handling with meaningful messages

### Laravel Validation Command

The `validate:environment` command tests:

1. **Faker Functionality**:
   - Tests `fake()` helper function
   - Tests `Faker\Factory` class directly
   - Validates generated data is not empty

2. **Autoloader**:
   - Tests key Laravel classes are loadable
   - Validates autoload file exists and is readable
   - Ensures all necessary classes are registered

3. **Database**:
   - Tests database connectivity
   - Checks migration table existence
   - Reports migration status

## Usage Examples

### Validation Only
```bash
# Validate all components
./scripts/fix-docker-composer.sh --validate-only

# Validate specific components
./scripts/fix-docker-composer.sh --validate-faker
./scripts/fix-docker-composer.sh --validate-autoloader
./scripts/fix-docker-composer.sh --validate-database
```

### Fix Specific Issues
```bash
# Fix only Faker package
./scripts/fix-docker-composer.sh --faker-only

# Fix only autoloader
./scripts/fix-docker-composer.sh --autoloader-only

# Fix only permissions
./scripts/fix-docker-composer.sh --permissions-only
```

### Full Fix
```bash
# Run all fixes (default)
./scripts/fix-docker-composer.sh
```

## Options

### Fix Options
- `(no option)`: Run all fixes and validation
- `--faker-only`: Fix only Faker package issues
- `--autoloader-only`: Fix only autoloader issues
- `--permissions-only`: Fix only permission issues

### Validation Options
- `--validate-only`: Validate all components
- `--validate-faker`: Validate only Faker functionality
- `--validate-autoloader`: Validate only autoloader
- `--validate-database`: Validate only database connectivity

### General
- `--help`, `-h`: Show help message

## What the Script Does

### Faker Package Fix
1. Removes fakerphp/faker package
2. Reinstalls fakerphp/faker as dev dependency
3. Validates installation using Laravel command

### Autoloader Fix
1. Clears composer cache
2. Removes vendor directory
3. Reinstalls all packages (including dev dependencies) with optimization
4. Regenerates optimized autoloader
5. Validates class loading

### Permissions Fix
1. Sets proper permissions on storage and bootstrap/cache
2. Sets correct ownership for www-data user

### Validation
1. Uses dedicated Laravel command for robust testing
2. Tests actual functionality rather than file existence
3. Provides clear success/failure indicators
4. Supports component-specific validation

## Common Issues Addressed

1. **"Class 'Faker\Factory' not found"**
   - Caused by incomplete package installation in Docker
   - Fixed by reinstalling faker package

2. **"Faker is not available"**
   - Autoloader not properly updated
   - Fixed by regenerating autoloader

3. **Permission denied errors**
   - Incorrect file/directory permissions
   - Fixed by setting proper permissions and ownership

## Prerequisites

- Docker and docker-compose installed
- Backend container running (script will start if needed)
- Laravel application with proper structure

## Error Handling

The script includes comprehensive error handling:
- Validates Docker environment
- Checks container status
- Provides colored logging for clarity
- Uses proper exit codes for automation
- Validates fixes after application

## Success Indicators

After successful execution, you should see:
- ✓ Faker is working (with generated sample data)
- ✓ Autoloader is working correctly
- ✓ Database connection successful
- ✓ Database initialized with X migrations

## Integration

The script is designed to work with:
- Laravel 11+ applications
- Docker Compose setups
- CI/CD pipelines (supports non-interactive mode)
- Development and testing environments

## Laravel Command Usage

You can also use the validation command directly:

```bash
# Full validation
docker-compose exec backend php artisan validate:environment

# Component-specific validation
docker-compose exec backend php artisan validate:environment --component=faker
docker-compose exec backend php artisan validate:environment --component=autoloader
docker-compose exec backend php artisan validate:environment --component=database
```
