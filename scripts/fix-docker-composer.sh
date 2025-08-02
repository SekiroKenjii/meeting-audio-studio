#!/bin/bash

# Fix Docker Composer Package Installation and Autoloader Issues
# This script addresses common issues with packages not being properly installed
# or registered in the Docker container's autoloader

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the correct directory
if [ ! -f "$PROJECT_ROOT/docker-compose.yml" ]; then
    log_error "docker-compose.yml not found. Please run this script from the project root or scripts directory."
    exit 1
fi

# Change to project root
cd "$PROJECT_ROOT"

log_info "Starting Docker Composer package fix..."
log_info "Project root: $PROJECT_ROOT"

# Check if Docker and docker-compose are available
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed or not in PATH"
    exit 1
fi

# Check if backend container is running
log_info "Checking if backend container is running..."
if ! docker-compose ps backend | grep -q "Up"; then
    log_warning "Backend container is not running. Starting containers..."
    docker-compose up -d

    # Wait for backend to be ready
    log_info "Waiting for backend container to be ready..."
    sleep 10

    # Check again
    if ! docker-compose ps backend | grep -q "Up"; then
        log_error "Failed to start backend container"
        exit 1
    fi
fi

log_success "Backend container is running"

# Function to fix specific package issues
fix_faker_package() {
    log_info "Fixing Faker package issues..."

    # Remove and reinstall faker
    log_info "Removing fakerphp/faker..."
    docker-compose exec backend composer remove --no-interaction fakerphp/faker || true

    log_info "Reinstalling fakerphp/faker..."
    docker-compose exec backend composer require fakerphp/faker --dev

    log_success "Faker package fixed"
}

# Function to clear and regenerate autoloader
fix_autoloader() {
    log_info "Fixing autoloader issues..."

    # Clear composer cache
    log_info "Clearing composer cache..."
    docker-compose exec backend composer clear-cache

    # Remove vendor directory and reinstall
    log_info "Removing vendor directory..."
    docker-compose exec backend rm -rf vendor

    log_info "Reinstalling all packages with dev dependencies..."
    docker-compose exec backend composer install --dev --optimize-autoloader

    # Dump optimized autoloader
    log_info "Generating optimized autoloader..."
    docker-compose exec backend composer dump-autoload --optimize

    log_success "Autoloader fixed"
}

# Function to fix permission issues
fix_permissions() {
    log_info "Fixing permission issues..."

    # Fix storage and bootstrap/cache permissions
    docker-compose exec backend chmod -R 775 storage bootstrap/cache
    docker-compose exec backend chown -R www-data:www-data storage bootstrap/cache

    log_success "Permissions fixed"
}

# Function to validate specific components
validate_component() {
    local component=$1
    log_info "Validating $component..."

    if docker-compose exec -T backend php artisan validate:environment --component="$component"; then
        log_success "$component validation passed"
        return 0
    else
        log_error "$component validation failed"
        return 1
    fi
}

# Function to validate the fix
validate_fix() {
    log_info "Validating the fix..."

    # Use the Laravel validation command
    log_info "Running environment validation..."
    if docker-compose exec -T backend php artisan validate:environment; then
        log_success "All validations passed"
        return 0
    else
        log_error "Some validations failed"
        return 1
    fi
}

# Main execution
main() {
    log_info "=== Docker Composer Fix Script ==="

    # Show current status
    log_info "Current container status:"
    docker-compose ps

    # Fix common issues
    log_info "Step 1: Fixing autoloader issues..."
    fix_autoloader

    log_info "Step 2: Fixing Faker package issues..."
    fix_faker_package

    log_info "Step 3: Fixing permissions..."
    fix_permissions

    log_info "Step 4: Validating fixes..."
    if validate_fix; then
        log_success "All fixes applied successfully!"
    else
        log_error "Some issues may still exist. Check the output above."
        exit 1
    fi

    log_info "=== Fix Complete ==="
    log_success "You can now try running your Laravel commands:"
    echo "  docker-compose exec backend php artisan migrate:fresh --seed"
    echo "  docker-compose exec backend php artisan test"
}

# Handle script arguments
case "${1:-}" in
    --faker-only)
        log_info "Running Faker fix only..."
        fix_faker_package
        validate_component "faker"
        ;;
    --autoloader-only)
        log_info "Running autoloader fix only..."
        fix_autoloader
        validate_component "autoloader"
        ;;
    --permissions-only)
        log_info "Running permissions fix only..."
        fix_permissions
        ;;
    --validate-only)
        log_info "Running validation only..."
        validate_fix
        ;;
    --validate-faker)
        log_info "Validating Faker only..."
        if validate_component "faker"; then
            exit 0
        else
            exit 1
        fi
        ;;
    --validate-autoloader)
        log_info "Validating autoloader only..."
        if validate_component "autoloader"; then
            exit 0
        else
            exit 1
        fi
        ;;
    --validate-database)
        log_info "Validating database only..."
        if validate_component "database"; then
            exit 0
        else
            exit 1
        fi
        ;;
    --help|-h)
        echo "Docker Composer Fix Script"
        echo ""
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Fix Options:"
        echo "  (no option)         Run all fixes"
        echo "  --faker-only        Fix only Faker package issues"
        echo "  --autoloader-only   Fix only autoloader issues"
        echo "  --permissions-only  Fix only permission issues"
        echo ""
        echo "Validation Options:"
        echo "  --validate-only     Validate all components"
        echo "  --validate-faker    Validate only Faker functionality"
        echo "  --validate-autoloader  Validate only autoloader"
        echo "  --validate-database Validate only database connectivity"
        echo ""
        echo "General:"
        echo "  --help, -h          Show this help message"
        echo ""
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "Unknown option: $1"
        log_info "Use --help for usage information"
        exit 1
        ;;
esac
