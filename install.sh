#!/bin/bash

# MCP Git Command Server Installation Script

set -e

echo "Installing MCP Git Command Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

# Make the main script executable
chmod +x dist/index.js

echo "Installation complete!"
echo ""
echo "To start the server, run:"
echo "  npm start"
echo ""
echo "For development mode, run:"
echo "  npm run dev"
echo ""
echo "To test the installation, run:"
echo "  npm test"