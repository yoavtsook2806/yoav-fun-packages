#!/bin/bash

echo "🚀 Setting up local development environment..."

# Start DynamoDB Local in the background
echo "📦 Starting DynamoDB Local..."
dynamodb-local --port 8000 --inMemory &
DYNAMODB_PID=$!

# Wait for DynamoDB to start
sleep 3

# Set up local tables
echo "🗄️  Creating local DynamoDB tables..."
node scripts/setup-local-tables.js

# Start the serverless offline server
echo "🌐 Starting Serverless Offline..."
export IS_LOCAL=true
export DYNAMODB_ENDPOINT=http://localhost:8000
npx serverless offline --stage dev --httpPort 3000

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up..."
    kill $DYNAMODB_PID
    exit 0
}

# Trap cleanup function on script exit
trap cleanup EXIT
