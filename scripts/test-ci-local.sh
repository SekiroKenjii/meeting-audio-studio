#!/bin/bash

# Local CI/CD Testing Script
# This script allows you to test different parts of the CI pipeline locally

set -e

echo "Local CI/CD Testing Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Function to test frontend
test_frontend() {
    print_step "Testing Frontend..."

    cd frontend

    # Create .env file
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created frontend .env file"
    fi

    # Install dependencies
    print_step "Installing frontend dependencies..."
    npm ci --prefer-offline --no-audit

    # Run linting
    print_step "Running ESLint..."
    npm run lint

    # Run type checking
    print_step "Running TypeScript type check..."
    npm run type-check

    # Run tests
    print_step "Running frontend tests..."
    npm run test:ci

    # Build
    print_step "Building frontend..."
    npm run build

    cd ..
    print_success "Frontend tests completed!"
}

# Function to test backend
test_backend() {
    print_step "Testing Backend..."

    cd backend

    # Create .env file
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created backend .env file"
    fi

    # Install dependencies
    print_step "Installing backend dependencies..."
    composer install --no-progress --prefer-dist --optimize-autoloader

    # Generate app key
    print_step "Generating application key..."
    php artisan key:generate

    # Configure testing environment
    print_step "Configuring test environment..."
    {
        echo "OPENAI_API_KEY=dummy_key_for_testing"
        echo "REVERB_APP_ID=meeting-audio-studio"
        echo "REVERB_APP_KEY=local"
        echo "REVERB_APP_SECRET=local"
        echo "REVERB_HOST=localhost"
        echo "REVERB_PORT=8081"
        echo "REVERB_SCHEME=http"
    } >> .env

    # Run tests (using SQLite for local testing)
    print_step "Running backend tests..."
    if php artisan test --help >/dev/null 2>&1; then
        php artisan test
    else
        print_warning "Using PHPUnit directly..."
        ./vendor/bin/phpunit
    fi

    cd ..
    print_success "Backend tests completed!"
}

# Function to test Docker builds
test_docker() {
    print_step "Testing Docker builds..."

    # Create env files
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env

    # Build frontend image
    print_step "Building frontend Docker image..."
    docker build -t meeting-audio-studio-frontend:test ./frontend

    # Build backend image
    print_step "Building backend Docker image..."
    docker build -t meeting-audio-studio-backend:test ./backend

    # Test docker-compose config
    print_step "Testing docker-compose configuration..."
    docker compose config >/dev/null

    print_success "Docker builds completed!"
}

# Function to run security scan
test_security() {
    print_step "Running security scan with Trivy..."

    if command -v trivy &> /dev/null; then
        TRIVY_CMD="trivy"
        print_step "Using system-installed Trivy..."
    elif [ -f "./bin/trivy" ]; then
        TRIVY_CMD="./bin/trivy"
        print_step "Using locally installed Trivy..."
    else
        # Check if running non-interactively (command line args provided)
        if [ $# -gt 0 ] || [ -n "$CI" ]; then
            print_warning "Trivy not found. Attempting Docker fallback..."
            if docker run --rm -v "$(pwd)":/workdir aquasec/trivy:latest fs --format table --severity HIGH,CRITICAL /workdir; then
                print_success "Security scan completed via Docker!"
                return 0
            else
                print_warning "Docker fallback failed. Attempting local installation..."
                # Ensure bin directory exists and has correct ownership
                rm -rf ./bin 2>/dev/null || true
                mkdir -p ./bin

                # Download and install Trivy manually to avoid permission issues
                TRIVY_VERSION=$(curl -s https://api.github.com/repos/aquasecurity/trivy/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/' 2>/dev/null || echo "v0.65.0")
                TRIVY_URL="https://github.com/aquasecurity/trivy/releases/download/${TRIVY_VERSION}/trivy_${TRIVY_VERSION#v}_Linux-64bit.tar.gz"

                if curl -sL "$TRIVY_URL" | tar -xz -C ./bin trivy 2>/dev/null; then
                    chmod +x ./bin/trivy
                    print_success "Trivy installed to ./bin/trivy"
                    TRIVY_CMD="./bin/trivy"
                else
                    print_warning "Security scan skipped - install Trivy manually for security testing"
                    return 0
                fi
            fi
        else
            # Interactive mode
            print_warning "Trivy not found. Choose installation method:"
            echo "1) Install to local ./bin directory (no sudo required)"
            echo "2) Use Docker (requires Docker to be running)"
            echo "3) Skip security scan"
            read -p "Enter choice [1-3]: " trivy_choice

            case $trivy_choice in
                1)
                    print_step "Installing Trivy to local directory..."
                    # Ensure bin directory exists and has correct ownership
                    rm -rf ./bin 2>/dev/null || true
                    mkdir -p ./bin

                    # Download and install Trivy manually to avoid permission issues
                    TRIVY_VERSION=$(curl -s https://api.github.com/repos/aquasecurity/trivy/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
                    TRIVY_URL="https://github.com/aquasecurity/trivy/releases/download/${TRIVY_VERSION}/trivy_${TRIVY_VERSION#v}_Linux-64bit.tar.gz"

                    print_step "Downloading Trivy ${TRIVY_VERSION}..."
                    if curl -sL "$TRIVY_URL" | tar -xz -C ./bin trivy; then
                        chmod +x ./bin/trivy
                        print_success "Trivy installed to ./bin/trivy"
                        TRIVY_CMD="./bin/trivy"
                    else
                        print_error "Failed to install Trivy locally"
                        return 1
                    fi
                    ;;
                2)
                    print_step "Using Trivy via Docker..."
                    if docker run --rm -v "$(pwd)":/workdir aquasec/trivy:latest fs --format table --severity HIGH,CRITICAL /workdir; then
                        print_success "Security scan completed via Docker!"
                        return 0
                    else
                        print_error "Failed to run Trivy via Docker"
                        return 1
                    fi
                    ;;
                3)
                    print_warning "Skipping security scan"
                    return 0
                    ;;
                *)
                    print_error "Invalid choice. Skipping security scan."
                    return 0
                    ;;
            esac
        fi
    fi

    print_step "Running filesystem scan..."
    $TRIVY_CMD fs --format table --severity HIGH,CRITICAL .
    print_success "Security scan completed!"
}

# Function to run integration tests
test_integration() {
    print_step "Running integration tests..."

    # Create env files
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env

    # Start services
    print_step "Starting services with docker-compose..."
    docker compose up -d --quiet-pull

    # Wait for services
    print_step "Waiting for services to start..."
    sleep 30

    # Test health endpoint
    print_step "Testing health endpoint..."
    timeout 60 bash -c 'until curl -f -s http://localhost:8000/api/health; do sleep 2; done' || {
        print_error "Services failed to start, checking logs..."
        docker compose logs --tail=10
        docker compose down -v
        exit 1
    }

    print_success "Integration test passed!"

    # Cleanup
    print_step "Cleaning up..."
    docker compose down -v

    print_success "Integration tests completed!"
}

# Function to run with act (GitHub Actions locally)
test_with_act() {
    print_step "Running GitHub Actions locally with act..."

    # Create .actrc file for act configuration
    if [ ! -f .actrc ]; then
        echo "-P ubuntu-latest=ghcr.io/catthehacker/ubuntu:act-latest" > .actrc
        print_success "Created .actrc configuration"
    fi

    case $1 in
        "frontend")
            print_step "Running frontend-tests job with act..."
            act -j frontend-tests
            ;;
        "backend")
            print_step "Running backend-tests job with act..."
            act -j backend-tests
            ;;
        "security")
            print_step "Running security-scan job with act..."
            act -j security-scan
            ;;
        "docker")
            print_step "Running docker-build job with act..."
            act -j docker-build
            ;;
        *)
            print_step "Running all jobs with act..."
            act
            ;;
    esac
}

# Main menu
show_menu() {
    echo ""
    echo "Select testing option:"
    echo "1) Test Frontend only"
    echo "2) Test Backend only"
    echo "3) Test Docker builds"
    echo "4) Test Security scan"
    echo "5) Test Integration"
    echo "6) Test with act (GitHub Actions locally) - All jobs"
    echo "7) Test with act - Frontend job only"
    echo "8) Test with act - Backend job only"
    echo "9) Test Everything (1-5)"
    echo "0) Exit"
    echo ""
}

# Handle command line arguments
if [ $# -gt 0 ]; then
    case $1 in
        "frontend"|"f")
            test_frontend
            ;;
        "backend"|"b")
            test_backend
            ;;
        "docker"|"d")
            test_docker
            ;;
        "security"|"s")
            test_security
            ;;
        "integration"|"i")
            test_integration
            ;;
        "act")
            test_with_act $2
            ;;
        "all"|"a")
            test_frontend
            test_backend
            test_docker
            test_security
            test_integration
            ;;
        *)
            echo "Usage: $0 [frontend|backend|docker|security|integration|act|all]"
            echo "       $0 act [frontend|backend|security|docker]"
            exit 1
            ;;
    esac
    exit 0
fi

# Interactive menu
while true; do
    show_menu
    read -p "Enter your choice [0-9]: " choice

    case $choice in
        1)
            test_frontend
            ;;
        2)
            test_backend
            ;;
        3)
            test_docker
            ;;
        4)
            test_security
            ;;
        5)
            test_integration
            ;;
        6)
            test_with_act
            ;;
        7)
            test_with_act frontend
            ;;
        8)
            test_with_act backend
            ;;
        9)
            print_step "Running all tests..."
            test_frontend
            test_backend
            test_docker
            test_security
            test_integration
            print_success "All tests completed!"
            ;;
        0)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            print_error "Invalid option. Please try again."
            ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
done
