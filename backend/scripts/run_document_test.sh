#!/bin/bash

# Set up environment
echo "Setting up environment..."
export PYTHONPATH="$(pwd)"

# Check if .env file exists and source it
if [ -f .env ]; then
    echo "Loading environment variables from .env"
    set -o allexport
    source .env
    set +o allexport
else
    echo "Warning: No .env file found. Make sure required environment variables are set."
fi

# Check for required environment variables
if [ -z "$PINECONE_API_KEY" ]; then
    echo "Error: PINECONE_API_KEY environment variable is not set."
    exit 1
fi

if [ -z "$PINECONE_INDEX" ]; then
    echo "Error: PINECONE_INDEX environment variable is not set."
    exit 1
fi

# Ensure the OPENAI_API_KEY is set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable is not set."
    exit 1
fi

echo "=== Running Document Processing Test ==="
python3 test_improved_document_processing.py

exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo "✅ Test completed successfully!"
else
    echo "❌ Test failed with exit code $exit_code"
fi

exit $exit_code 