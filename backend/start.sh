#!/bin/bash

# Wait for dependencies
echo "Waiting for Redis..."
until redis-cli -h redis ping; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "Redis is ready!"

# Run Laravel setup commands
echo "Running Laravel setup..."
php artisan config:cache
php artisan route:cache

# Start services in the background
echo "Starting Laravel Horizon (Redis Queue Manager)..."
php artisan horizon &

echo "Starting Reverb WebSocket Server..."
php artisan reverb:start --host=0.0.0.0 --port=8081 &

echo "Starting Laravel Development Server..."
php artisan serve --host=0.0.0.0 --port=8000
