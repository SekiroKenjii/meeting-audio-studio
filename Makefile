# Meeting Audio Studio - Makefile
# Centralized commands for development and deployment

# Variables
COMPOSE_FILE=docker-compose.yml
BACKEND_CONTAINER=meeting-audio-studio-backend-1
FRONTEND_CONTAINER=meeting-audio-studio-frontend-1
POSTGRES_CONTAINER=meeting-audio-studio-postgres-1

# Help command - shows available targets
.PHONY: help
help:
	@echo "Meeting Audio Studio - Available Commands:"
	@echo ""
	@echo "Docker Management:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make restart     - Restart all services"
	@echo "  make build       - Build all containers"
	@echo "  make rebuild     - Rebuild and restart all services"
	@echo "  make status      - Show container status"
	@echo ""
	@echo "Backend Commands:"
	@echo "  make be-logs     - View backend logs"
	@echo "  make be-laravel  - View Laravel application logs"
	@echo "  make be-shell    - Access backend container shell"
	@echo "  make be-restart  - Restart backend service"
	@echo "  make be-build    - Build backend container"
	@echo "  make be-clear    - Clear Laravel cache and config"
	@echo "  make be-setup    - Setup backend with Horizon and Redis"
	@echo "  make be-horizon  - View Horizon dashboard status"
	@echo "  make be-redis    - Access Redis CLI"
	@echo ""
	@echo "Frontend Commands:"
	@echo "  make fe-logs    - View frontend logs"
	@echo "  make fe-shell   - Access frontend container shell"
	@echo "  make fe-restart - Restart frontend service"
	@echo "  make fe-build   - Build frontend container"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-logs     - View database logs"
	@echo "  make db-shell    - Access database shell"
	@echo "  make db-migrate  - Run Laravel migrations"
	@echo "  make db-fresh    - Fresh migration with seed"
	@echo "  make db-status   - Check migration status"
	@echo ""
	@echo "Queue & WebSocket:"
	@echo "  make queue-work   - Run queue worker manually"
	@echo "  make queue-status - Check queue job count"
	@echo "  make queue-clear  - Clear failed jobs"
	@echo ""
	@echo "Testing & CI/CD:"
	@echo "  make test              - Interactive testing menu"
	@echo "  make test-frontend     - Test frontend locally"
	@echo "  make test-backend      - Test backend locally"
	@echo "  make test-docker       - Test Docker builds"
	@echo "  make test-security     - Run security scan"
	@echo "  make test-integration  - Run integration tests"
	@echo "  make test-all          - Run all tests"
	@echo "  make test-act          - Run GitHub Actions locally (all jobs)"
	@echo "  make test-act-frontend - Run frontend job with act"
	@echo "  make test-act-backend  - Run backend job with act"
	@echo "  make validate-setup    - Validate CI/CD setup"
	@echo "  make ws-test      - Test WebSocket connection"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean       - Clean Docker resources"
	@echo "  make reset       - Reset entire environment"
	@echo "  make logs        - View all container logs"
	@echo "  make health      - Check system health"

# Docker Management
.PHONY: up down restart build rebuild status
up:
	@echo "Starting all services..."
	docker-compose -f $(COMPOSE_FILE) up -d

down:
	@echo "Stopping all services..."
	docker-compose -f $(COMPOSE_FILE) down

restart:
	@echo "Restarting all services..."
	docker-compose -f $(COMPOSE_FILE) restart

build:
	@echo "Building all containers..."
	docker-compose -f $(COMPOSE_FILE) build

rebuild:
	@echo "Rebuilding and restarting all services..."
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_FILE) build
	docker-compose -f $(COMPOSE_FILE) up -d

status:
	@echo "Container Status:"
	docker-compose -f $(COMPOSE_FILE) ps

# Backend Commands
.PHONY: be-logs be-laravel be-shell be-restart be-build be-clear be-setup be-horizon be-redis
be-logs:
	@echo "Backend Logs (last 50 lines):"
	docker logs $(BACKEND_CONTAINER) --tail 50 -f

be-laravel:
	@echo "Laravel Application Logs (last 100 lines):"
	@docker exec -it $(BACKEND_CONTAINER) sh -c "if [ ! -f storage/logs/laravel.log ]; then echo 'Laravel log file not found. Creating...'; touch storage/logs/laravel.log; chmod 664 storage/logs/laravel.log; fi"
	@docker exec -it $(BACKEND_CONTAINER) sh -c "if [ -s storage/logs/laravel.log ]; then tail -n 100 -f storage/logs/laravel.log; else echo 'Laravel log file is empty. Waiting for new entries...'; tail -f storage/logs/laravel.log; fi"

be-shell:
	@echo "Accessing backend container shell..."
	docker exec -it $(BACKEND_CONTAINER) /bin/bash

be-restart:
	@echo "Restarting backend service..."
	docker-compose -f $(COMPOSE_FILE) restart backend

be-build:
	@echo "Building backend container..."
	docker-compose -f $(COMPOSE_FILE) build backend

be-clear:
	@echo "Clearing Laravel cache and config..."
	docker exec -it $(BACKEND_CONTAINER) php artisan config:clear
	docker exec -it $(BACKEND_CONTAINER) php artisan cache:clear
	docker exec -it $(BACKEND_CONTAINER) php artisan route:clear
	docker exec -it $(BACKEND_CONTAINER) php artisan view:clear
	@echo "Cache and config cleared successfully!"

be-setup:
	@echo "Setting up backend with Horizon and Redis..."
	docker exec -it $(BACKEND_CONTAINER) composer install
	docker exec -it $(BACKEND_CONTAINER) php artisan setup:horizon
	docker exec -it $(BACKEND_CONTAINER) php artisan config:cache
	@echo "Backend setup completed!"

be-horizon:
	@echo "Horizon Dashboard Info:"
	@echo "Access Horizon at: http://localhost:8000/horizon"
	@echo "Checking Horizon status..."
	docker exec -it $(BACKEND_CONTAINER) php artisan horizon:status

be-redis:
	@echo "Accessing Redis CLI..."
	docker exec -it meeting-audio-studio-redis-1 redis-cli

# Frontend Commands
.PHONY: fe-logs fe-shell fe-restart fe-build
fe-logs:
	@echo "Frontend Logs (last 50 lines):"
	docker logs $(FRONTEND_CONTAINER) --tail 50 -f

fe-shell:
	@echo "Accessing frontend container shell..."
	docker exec -it $(FRONTEND_CONTAINER) /bin/bash

fe-restart:
	@echo "Restarting frontend service..."
	docker-compose -f $(COMPOSE_FILE) restart frontend

fe-build:
	@echo "Building frontend container..."
	docker-compose -f $(COMPOSE_FILE) build frontend

# Database Commands
.PHONY: db-logs db-shell db-migrate db-fresh db-status
db-logs:
	@echo "Database Logs (last 50 lines):"
	docker logs $(POSTGRES_CONTAINER) --tail 50 -f

db-shell:
	@echo "Accessing database shell..."
	docker exec -it $(POSTGRES_CONTAINER) psql -U postgres -d meeting_audio_studio

db-migrate:
	@echo "Running Laravel migrations..."
	docker exec -it $(BACKEND_CONTAINER) php artisan migrate

db-fresh:
	@echo "Fresh migration with seed..."
	docker exec -it $(BACKEND_CONTAINER) php artisan migrate:fresh --seed

db-status:
	@echo "Migration Status:"
	docker exec -it $(BACKEND_CONTAINER) php artisan migrate:status

# Queue & WebSocket Commands
.PHONY: queue-work queue-status queue-clear ws-test
queue-work:
	@echo "⚡ Running queue worker..."
	docker exec -it $(BACKEND_CONTAINER) php artisan queue:work --timeout=300 --tries=3

queue-status:
	@echo "Queue Status:"
	docker exec -it $(BACKEND_CONTAINER) php artisan tinker --execute="dump('Jobs in queue: ' . DB::table('jobs')->count());"

queue-clear:
	@echo "Clearing failed jobs..."
	docker exec -it $(BACKEND_CONTAINER) php artisan queue:clear
	docker exec -it $(BACKEND_CONTAINER) php artisan queue:flush

ws-test:
	@echo "Testing WebSocket connection..."
	@echo "WebSocket should be available at: ws://localhost:8081"
	@echo "You can test this in your browser console or use a WebSocket client"

# Maintenance Commands
.PHONY: clean reset logs health
clean:
	@echo "Cleaning Docker resources..."
	docker system prune -f
	docker volume prune -f

reset:
	@echo "Resetting entire environment..."
	docker-compose -f $(COMPOSE_FILE) down -v
	docker system prune -f
	docker-compose -f $(COMPOSE_FILE) build
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "Waiting for services to start..."
	sleep 10
	$(MAKE) db-migrate
	sleep 10
	$(MAKE) db-fresh

logs:
	@echo "All Container Logs:"
	docker-compose -f $(COMPOSE_FILE) logs --tail=50

health:
	@echo "System Health Check:"
	@echo ""
	@echo "Container Status:"
	docker-compose -f $(COMPOSE_FILE) ps
	@echo ""
	@echo "Database Connection:"
	@docker exec -it $(BACKEND_CONTAINER) php artisan tinker --execute="try { DB::connection()->getPdo(); echo 'Database: Connected'; } catch(Exception \$$e) { echo 'Database: Failed - ' . \$$e->getMessage(); }" 2>/dev/null || echo "Database: Backend not running"
	@echo ""
	@echo "⚡ Queue Status:"
	@docker exec -it $(BACKEND_CONTAINER) php artisan tinker --execute="echo 'Queue jobs: ' . DB::table('jobs')->count();" 2>/dev/null || echo "Queue: Backend not running"
	@echo ""
	@echo "WebSocket Status:"
	@echo "WebSocket server should be running on port 8081"
	@echo ""
	@echo "Service URLs:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend API: http://localhost:8000/api"
	@echo "  WebSocket: ws://localhost:8081"

# Development shortcuts
.PHONY: dev dev-logs artisan tinker npm
dev: up
	@echo "Development environment started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:8000/api"
	@echo "WebSocket: ws://localhost:8081"

dev-logs:
	@echo "Development Logs (all services):"
	docker-compose -f $(COMPOSE_FILE) logs -f

artisan:
	@echo "Laravel Artisan CLI:"
	docker exec -it $(BACKEND_CONTAINER) php artisan

tinker:
	@echo "Laravel Tinker:"
	docker exec -it $(BACKEND_CONTAINER) php artisan tinker

npm:
	@echo "NPM in frontend container:"
	docker exec -it $(FRONTEND_CONTAINER) npm

# File uploads and storage
.PHONY: storage-link storage-clear storage-permissions
storage-link:
	@echo "Creating storage symbolic link..."
	docker exec -it $(BACKEND_CONTAINER) php artisan storage:link

storage-clear:
	@echo "Clearing storage files..."
	docker exec -it $(BACKEND_CONTAINER) rm -rf storage/app/audio-files/*
	docker exec -it $(BACKEND_CONTAINER) rm -rf storage/audio-backups/*

storage-permissions:
	@echo "Setting storage permissions..."
	docker exec -it $(BACKEND_CONTAINER) chmod -R 755 storage
	docker exec -it $(BACKEND_CONTAINER) chown -R www-data:www-data storage

# Testing and CI/CD
.PHONY: test test-frontend test-backend test-docker test-security test-integration test-all test-act
test:
	@echo "Running local CI/CD tests..."
	./scripts/test-ci-local.sh

test-frontend:
	@echo "Testing frontend locally..."
	./scripts/test-ci-local.sh frontend

test-backend:
	@echo "Testing backend locally..."
	./scripts/test-ci-local.sh backend

test-docker:
	@echo "Testing Docker builds..."
	./scripts/test-ci-local.sh docker

test-security:
	@echo "Running security scan..."
	./scripts/test-ci-local.sh security

test-integration:
	@echo "Running integration tests..."
	./scripts/test-ci-local.sh integration

test-all:
	@echo "Running all tests..."
	./scripts/test-ci-local.sh all

test-act:
	@echo "Running GitHub Actions locally with act..."
	./scripts/test-ci-local.sh act

test-act-frontend:
	@echo "Running frontend job with act..."
	./scripts/test-ci-local.sh act frontend

test-act-backend:
	@echo "Running backend job with act..."
	./scripts/test-ci-local.sh act backend

validate-setup:
	@echo "Validating CI/CD setup..."
	./scripts/validate-ci-setup.sh

# Default target
.DEFAULT_GOAL := help
