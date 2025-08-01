# Local CI/CD Testing Guide

This guide shows you how to test the CI/CD pipeline locally before pushing changes to GitHub.

## 🚀 Quick Start

### Method 1: Interactive Script
```bash
./scripts/test-ci-local.sh
```

### Method 2: Direct Commands
```bash
# Test specific components
./scripts/test-ci-local.sh frontend    # Frontend only
./scripts/test-ci-local.sh backend     # Backend only
./scripts/test-ci-local.sh docker      # Docker builds
./scripts/test-ci-local.sh security    # Security scan
./scripts/test-ci-local.sh integration # Integration tests
./scripts/test-ci-local.sh all         # Everything

# Use GitHub Actions locally (with act)
./scripts/test-ci-local.sh act                # All jobs
./scripts/test-ci-local.sh act frontend       # Frontend job only
./scripts/test-ci-local.sh act backend        # Backend job only
```

### Method 3: Using Makefile
```bash
make test              # Interactive menu
make test-frontend     # Frontend only
make test-backend      # Backend only
make test-docker       # Docker builds
make test-all          # All tests
make test-act          # GitHub Actions locally
make validate-setup    # Validate setup
```

## 🔧 Setup Validation

Run this to check if everything is set up correctly:
```bash
./scripts/validate-ci-setup.sh
# or
make validate-setup
```

## 📋 Available Testing Options

### 1. Frontend Testing
- **What it tests**: ESLint, TypeScript checking, React tests, build process
- **Runtime**: ~2-5 minutes
- **Requirements**: Node.js, npm

### 2. Backend Testing
- **What it tests**: PHP syntax, Laravel tests, database setup
- **Runtime**: ~3-7 minutes
- **Requirements**: PHP, Composer, SQLite (for local testing)

### 3. Docker Testing
- **What it tests**: Docker image builds, docker-compose configuration
- **Runtime**: ~5-10 minutes
- **Requirements**: Docker, Docker Compose

### 4. Security Testing
- **What it tests**: Vulnerability scanning with Trivy
- **Runtime**: ~1-3 minutes
- **Requirements**: Trivy (auto-installed)

### 5. Integration Testing
- **What it tests**: Full application stack, API health checks
- **Runtime**: ~2-4 minutes
- **Requirements**: Docker, Docker Compose

### 6. GitHub Actions Local (Act)
- **What it tests**: Exact same environment as GitHub Actions
- **Runtime**: ~10-20 minutes (full pipeline)
- **Requirements**: Docker, act

## 🛠 Tools Used

- **act**: Runs GitHub Actions locally
- **Docker**: Container builds and integration tests
- **Trivy**: Security vulnerability scanning
- **Native tools**: Node.js, PHP, Composer for direct testing

## 🎯 Recommended Workflow

1. **During development**: Use component-specific tests
   ```bash
   make test-frontend  # After frontend changes
   make test-backend   # After backend changes
   ```

2. **Before committing**: Run all tests
   ```bash
   make test-all
   ```

3. **Before pushing**: Test with exact GitHub Actions environment
   ```bash
   make test-act
   ```

## 📁 Configuration Files

- `.actrc` - Act configuration for GitHub Actions local execution
- `.env.act` - Environment variables for act
- `scripts/test-ci-local.sh` - Main testing script
- `scripts/validate-ci-setup.sh` - Setup validation script

## 🐛 Troubleshooting

### Docker Issues
```bash
# Make sure Docker is running
docker info

# Clean up Docker resources
docker system prune -f
```

### Act Issues
```bash
# Update act to latest version
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Clear act cache
act --rm
```

### Missing Dependencies
```bash
# Run validation to see what's missing
./validate-ci-setup.sh
```

## 💡 Tips

1. **Faster feedback**: Test individual components during development
2. **Save time**: Use `make test-all` for comprehensive testing
3. **Exact GitHub environment**: Use `make test-act` for final validation
4. **Debug failures**: Each test method provides detailed output
5. **Environment isolation**: Each test cleans up after itself

## 🔄 Integration with Development

Add this to your git hooks or development workflow:

```bash
# Pre-commit hook
#!/bin/bash
echo "Running local CI tests..."
make test-all
```

This ensures your changes will pass CI before pushing to GitHub!
