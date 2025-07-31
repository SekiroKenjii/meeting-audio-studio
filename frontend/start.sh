#!/bin/sh

# Frontend start script for Meeting Audio Studio
# This script ensures a clean build before starting the development server

set -e  # Exit on any error

echo "Starting Meeting Audio Studio Frontend..."
echo "Installing dependencies..."

# Install dependencies (in case of new packages)
npm ci

echo "Building application..."

# Run TypeScript compilation and build
npm run build

echo "Build completed successfully!"
echo "Starting development server..."

# Start the development server
npm run dev
