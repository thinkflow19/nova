#!/bin/bash

echo "Setting up backend environment..."

# Kill any existing uvicorn processes
echo "Stopping any running uvicorn processes..."
pkill -f uvicorn || echo "No uvicorn processes found"

# Remove existing venv if it exists
if [ -d "venv" ]; then
  echo "Removing existing virtual environment..."
  rm -rf venv
fi

# Create a new virtual environment with Python 3.12
echo "Creating a new virtual environment with Python 3.12..."
python3.12 -m venv venv

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "====================================================="
echo "Backend setup complete!"
echo "To run the backend server, use:"
echo "source venv/bin/activate && uvicorn app.main:app --reload"
echo "=====================================================" 