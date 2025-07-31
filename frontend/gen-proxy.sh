#!/bin/sh

# API Proxy Generator for Meeting Audio Studio Frontend
# This script reads the backend API documentation and generates/updates the API service

set -e  # Exit on any error

echo "Generating API Proxy from Backend Documentation..."

# Configuration
export API_BASE_URL=${API_BASE_URL:-"http://localhost:8000/api"}

echo "Backend API URL: $API_BASE_URL"
echo "Running API generator..."

# Run the Node.js generator
node generate-api.js

echo "API Proxy generation completed!"
echo ""
echo "To use the new API methods:"
echo "   import { apiService } from './services/apiService';"
echo "   await apiService.getAudioFiles();"
