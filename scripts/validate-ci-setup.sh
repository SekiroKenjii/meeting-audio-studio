#!/bin/bash

# CI/CD Local Testing Setup Validator
# This script checks if everything is set up correctly for local testing

echo "CI/CD Local Testing Setup Validation"
echo "======================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_passed=0
check_failed=0

check_command() {
    local cmd=$1
    local name=$2

    if command -v $cmd &> /dev/null; then
        echo -e "${GREEN}$name is installed${NC}"
        ((check_passed++))
    else
        echo -e "${RED}$name is NOT installed${NC}"
        ((check_failed++))
    fi
}

check_file() {
    local file=$1
    local name=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}$name exists${NC}"
        ((check_passed++))
    else
        echo -e "${RED}$name is missing${NC}"
        ((check_failed++))
    fi
}

echo "Checking required tools..."
check_command "docker" "Docker"
check_command "docker-compose" "Docker Compose"
check_command "act" "Act (GitHub Actions runner)"
check_command "node" "Node.js"
check_command "npm" "NPM"
check_command "php" "PHP"
check_command "composer" "Composer"

echo ""
echo "Checking project files..."
check_file ".github/workflows/ci.yml" "CI/CD workflow file"
check_file "docker-compose.yml" "Docker Compose file"
check_file "frontend/package.json" "Frontend package.json"
check_file "backend/composer.json" "Backend composer.json"
check_file "scripts/test-ci-local.sh" "Local testing script"
check_file ".actrc" "Act configuration"
check_file ".env.act" "Act environment file"

echo ""
echo "Checking environment files..."
if [ -f "frontend/.env.example" ]; then
    echo -e "${GREEN}Frontend .env.example exists${NC}"
    ((check_passed++))
else
    echo -e "${YELLOW} Frontend .env.example is missing${NC}"
fi

if [ -f "backend/.env.example" ]; then
    echo -e "${GREEN}Backend .env.example exists${NC}"
    ((check_passed++))
else
    echo -e "${YELLOW}Backend .env.example is missing${NC}"
fi

echo ""
echo "Testing Docker..."
if docker info &> /dev/null; then
    echo -e "${GREEN}Docker is running${NC}"
    ((check_passed++))
else
    echo -e "${RED}Docker is not running${NC}"
    ((check_failed++))
fi

echo ""
echo "Testing Act..."
if act --list &> /dev/null; then
    echo -e "${GREEN}Act can read workflow file${NC}"
    ((check_passed++))
    echo "Available jobs:"
    act --list | grep -E "^\s" | head -5
else
    echo -e "${RED}Act cannot read workflow file${NC}"
    ((check_failed++))
fi

echo ""
echo "========================================="
echo "Summary:"
echo -e "Passed: ${GREEN}$check_passed${NC}"
if [ $check_failed -gt 0 ]; then
    echo -e "Failed: ${RED}$check_failed${NC}"
else
    echo -e "Failed: $check_failed"
fi

echo ""
if [ $check_failed -eq 0 ]; then
    echo -e "${GREEN}Everything looks good! You can start testing your CI/CD pipeline locally.${NC}"
    echo ""
    echo "Quick start commands:"
    echo "  ./scripts/test-ci-local.sh           # Interactive menu"
    echo "  ./scripts/test-ci-local.sh frontend  # Test frontend only"
    echo "  ./scripts/test-ci-local.sh backend   # Test backend only"
    echo "  ./scripts/test-ci-local.sh act       # Run with GitHub Actions locally"
    echo "  make test                            # Use Makefile shortcut"
else
    echo -e "${YELLOW}Some checks failed. Please install missing tools or fix configuration.${NC}"
fi
