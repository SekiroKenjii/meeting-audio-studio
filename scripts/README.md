# Scripts Directory

This directory contains utility scripts for the Meeting Audio Studio project.

## Testing Scripts

### `test-ci-local.sh`
**Purpose**: Local CI/CD pipeline testing script
**Usage**:
- Interactive: `./scripts/test-ci-local.sh`
- Command line: `./scripts/test-ci-local.sh [frontend|backend|docker|security|integration|act|all]`
- Makefile: `make test`, `make test-frontend`, etc.

**Features**:
- Frontend testing (ESLint, TypeScript, Vitest, build)
- Backend testing (PHP, Laravel tests, Composer)
- Docker image builds and compose configuration
- Security scanning with Trivy
- Integration testing with full stack
- GitHub Actions simulation with `act`

### `validate-ci-setup.sh`
**Purpose**: Validates local CI/CD testing environment setup
**Usage**:
- Direct: `./scripts/validate-ci-setup.sh`
- Makefile: `make validate-setup`

**Features**:
- Checks required tools (Docker, Node.js, PHP, Composer, act, etc.)
- Validates project files and configuration
- Tests Docker availability
- Validates act workflow reading

## Usage Examples

```bash
# Quick validation
make validate-setup

# Interactive testing menu
make test

# Test specific components
make test-frontend
make test-backend
make test-security

# Run all tests
make test-all

# GitHub Actions simulation
make test-act
```

## Dependencies

Required tools for full functionality:
- **Node.js & npm** - Frontend testing
- **PHP & Composer** - Backend testing
- **Docker & Docker Compose** - Container builds and integration tests
- **act** - GitHub Actions local simulation
- **curl & tar** - Trivy security scanner download
- **bash** - Script execution

## Maintenance

These scripts are designed to mirror the GitHub Actions CI/CD pipeline defined in `.github/workflows/ci.yml`. When updating the CI pipeline, ensure these local scripts are updated accordingly to maintain consistency.
