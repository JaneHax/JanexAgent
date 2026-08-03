#!/bin/bash
set -e

echo "Deploying Janex on macOS..."

if ! command -v node &> /dev/null; then
  echo "Error: Node.js not found"
  exit 1
fi

echo "Building..."
npm run build

echo "Linking..."
npm link

echo "macOS deploy complete!"
