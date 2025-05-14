#!/bin/bash

# Colors for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project paths
VENV_DIR="venv"
BACKEND_DIR="backend"
FRONTEND_DIR="frontend_new"

# Port configurations
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Print section header
print_header() {
    echo -e "\n${YELLOW}============================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}============================================${NC}\n"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Python 3.12 is installed
check_python() {
    print_header "Checking Python 3.12"
    
    if command_exists python3.12; then
        echo -e "${GREEN}Python 3.12 is installed.${NC}"
        PYTHON_CMD="python3.12"
    elif command_exists python3; then
        PY_VERSION=$(python3 --version | cut -d' ' -f2)
        if [[ $PY_VERSION == 3.12* ]]; then
            echo -e "${GREEN}Python 3.12 is installed.${NC}"
            PYTHON_CMD="python3"
        else
            echo -e "${RED}Python 3.12 is required but Python $PY_VERSION is installed.${NC}"
            echo -e "${RED}Please install Python 3.12 to continue.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Python 3 is not installed. Please install Python 3.12 to continue.${NC}"
        exit 1
    fi
}

# Create or activate virtual environment
setup_venv() {
    print_header "Setting up virtual environment"
    
    if [ ! -d "$VENV_DIR" ]; then
        echo "Creating new virtual environment with $PYTHON_CMD..."
        $PYTHON_CMD -m venv $VENV_DIR
        echo -e "${GREEN}Virtual environment created.${NC}"
    else
        echo -e "${GREEN}Virtual environment already exists.${NC}"
    fi
    
    echo "Activating virtual environment..."
    source $VENV_DIR/bin/activate
    echo -e "${GREEN}Virtual environment activated.${NC}"
    
    # Update pip
    echo "Updating pip..."
    pip install --upgrade pip
}

# Install backend requirements
install_backend_deps() {
    print_header "Installing backend dependencies"
    
    if [ -f "$BACKEND_DIR/requirements.txt" ]; then
        echo "Installing Python dependencies from requirements.txt..."
        pip install -r $BACKEND_DIR/requirements.txt
        echo -e "${GREEN}Backend dependencies installed.${NC}"
    else
        echo -e "${RED}Backend requirements.txt not found!${NC}"
        exit 1
    fi
}

# Install frontend dependencies
install_frontend_deps() {
    print_header "Installing frontend dependencies"
    
    if [ -f "$FRONTEND_DIR/package.json" ]; then
        echo "Installing Node dependencies..."
        cd $FRONTEND_DIR
        npm install
        cd ..
        echo -e "${GREEN}Frontend dependencies installed.${NC}"
    else
        echo -e "${RED}Frontend package.json not found!${NC}"
        exit 1
    fi
}

# Kill processes running on specified ports
kill_processes() {
    print_header "Killing existing processes"
    
    # Kill process on backend port if running
    if lsof -i:$BACKEND_PORT -t &> /dev/null; then
        echo "Killing process on port $BACKEND_PORT..."
        kill $(lsof -i:$BACKEND_PORT -t) 2> /dev/null || true
        echo -e "${GREEN}Process on port $BACKEND_PORT terminated.${NC}"
    else
        echo "No process running on backend port $BACKEND_PORT."
    fi
    
    # Kill process on frontend port if running
    if lsof -i:$FRONTEND_PORT -t &> /dev/null; then
        echo "Killing process on port $FRONTEND_PORT..."
        kill $(lsof -i:$FRONTEND_PORT -t) 2> /dev/null || true
        echo -e "${GREEN}Process on port $FRONTEND_PORT terminated.${NC}"
    else
        echo "No process running on frontend port $FRONTEND_PORT."
    fi
}

# Start backend server
backend() {
    if [ -z "$VIRTUAL_ENV" ]; then
        echo "Virtual environment is not active. Activating it now..."
        
        if [ ! -d "$VENV_DIR" ]; then
            echo "Creating new virtual environment..."
            $PYTHON_CMD -m venv $VENV_DIR
            echo "Virtual environment created."
            source $VENV_DIR/bin/activate
            
            echo "Installing backend dependencies..."
            pip install -r $BACKEND_DIR/requirements.txt
        else
            source $VENV_DIR/bin/activate
        fi
        
        echo "Virtual environment activated."
    fi
    
    echo "Starting backend server on port 8000..."
    cd $BACKEND_DIR
    uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    echo "Backend server started with PID: $BACKEND_PID"
}

# Start frontend server
frontend() {
    echo "Starting frontend server on port 3000..."
    npm run dev --prefix frontend_new &
    echo "Frontend server started with PID: $!"
}

# Setup initial environment
setup() {
    print_header "Initial setup"
    
    check_python
    setup_venv
    install_backend_deps
    install_frontend_deps
    echo -e "${GREEN}Setup completed successfully!${NC}"
}

# Start both servers
start() {
    echo "============================================"
    echo "Killing existing processes"
    echo "============================================"
    ./build.sh kill
    echo "============================================"
    echo "Starting backend server"
    echo "============================================"
    backend
    echo "============================================"
    echo "Starting frontend server"
    echo "============================================"
    frontend
    echo "============================================"
    echo "Servers started"
    echo "============================================"
    echo "Both servers are now running:"
    echo "- Backend: http://localhost:8000"
    echo "- Frontend: http://localhost:3000"
    echo "Press Ctrl+C to stop both servers"
}

# Shutdown both servers gracefully
shutdown() {
    print_header "Shutting down servers"
    
    echo "Shutting down backend server..."
    kill $BACKEND_PID 2> /dev/null || true
    
    echo "Shutting down frontend server..."
    kill $FRONTEND_PID 2> /dev/null || true
    
    echo -e "${GREEN}Servers have been stopped.${NC}"
    exit 0
}

# Update dependencies
update_deps() {
    print_header "Updating dependencies"
    
    if [ -z "$VIRTUAL_ENV" ]; then
        echo "Activating virtual environment..."
        source $VENV_DIR/bin/activate
        echo "Virtual environment activated."
    fi
    
    echo "Updating backend dependencies..."
    pip install -r $BACKEND_DIR/requirements.txt
    
    echo "Updating frontend dependencies..."
    cd $FRONTEND_DIR
    npm install
    cd ..
    
    echo -e "${GREEN}Dependencies updated successfully!${NC}"
}

# Help message
show_help() {
    echo -e "${GREEN}Nova Project Management Script${NC}"
    echo ""
    echo "Usage: ./build.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup       Setup virtual environment and install dependencies"
    echo "  start       Start both backend and frontend servers"
    echo "  kill        Kill processes running on the backend and frontend ports"
    echo "  backend     Start only the backend server"
    echo "  frontend    Start only the frontend server"
    echo "  update-deps Update all dependencies"
    echo "  help        Show this help message"
    echo ""
}

# Main script execution
case "$1" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    kill)
        kill_processes
        ;;
    backend)
        kill_processes
        backend
        wait
        ;;
    frontend)
        kill_processes
        frontend
        wait
        ;;
    update-deps)
        update_deps
        ;;
    help|*)
        show_help
        ;;
esac 