#!/bin/bash
# Consolidated setup script for the entire project

set -e  # Exit on error

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${GREEN}=== $1 ===${NC}\n"
}

print_step() {
    echo -e "${YELLOW}-> $1${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${RED}WARNING: $1${NC}"
}

print_info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

# Check environment
check_environment() {
    print_header "Checking environment"
    
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is required but not installed"
        exit 1
    fi
    
    echo -e "Python version: $(python3 --version)"
    echo -e "Node version: $(node --version)"
    echo -e "npm version: $(npm --version)"
}

# Setup backend
setup_backend() {
    print_header "Setting up backend"
    
    cd backend
    
    print_step "Creating Python virtual environment"
    python3 -m venv venv
    
    print_step "Activating virtual environment"
    source venv/bin/activate
    
    print_step "Installing dependencies"
    pip install -r requirements.txt
    
    print_step "Backend setup complete"
    
    cd ..
}

# Setup frontend
setup_frontend() {
    print_header "Setting up frontend"
    
    cd frontend
    
    print_step "Installing npm dependencies"
    npm install
    
    print_step "Frontend setup complete"
    
    cd ..
}

# Setup database - this is a separate function that is only called explicitly
setup_database() {
    print_header "Database Setup"
    
    print_warning "This will create or modify database tables."
    print_warning "Existing tables might be altered but data should be preserved."
    print_warning "For a completely fresh setup, you should manually drop tables first."
    
    read -p "Are you sure you want to continue with database setup? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Database setup canceled"
        return
    fi
    
    read -p "Which database type? (postgres/sqlite/mysql) [postgres]: " DB_TYPE
    DB_TYPE=${DB_TYPE:-postgres}
    
    cd scripts
    
    print_step "Installing script dependencies"
    pip install -r requirements.txt
    
    print_step "Creating database tables"
    python db_setup/create_tables.py --db-type "$DB_TYPE"
    
    cd ..
}

# Main script
main() {
    print_header "Starting project setup"
    
    check_environment
    
    # Check for .env file
    if [ ! -f backend/.env ]; then
        print_step "Creating example .env file"
        cp backend/.env.example backend/.env 2>/dev/null || echo -e "# Backend environment variables\n\n# OpenAI\nOPENAI_API_KEY=your_openai_api_key\nDEFAULT_CHAT_MODEL=gpt-3.5-turbo\n\n# Database\nDB_TYPE=postgres\n\n# Supabase\nSUPABASE_URL=your_supabase_url\nSUPABASE_KEY=your_supabase_anon_key\nSUPABASE_JWT_SECRET=your_jwt_secret\nSUPABASE_POSTGRES_PASSWORD=your_db_password\n\n# Pinecone\nPINECONE_API_KEY=your_pinecone_api_key\nPINECONE_ENVIRONMENT=your_pinecone_environment\nPINECONE_INDEX_NAME=your_pinecone_index_name" > backend/.env
        print_step "Please edit backend/.env with your actual credentials"
    fi
    
    # Setup parts
    read -p "Set up backend? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_backend
    fi
    
    read -p "Set up frontend? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_frontend
    fi
    
    # Separate step for database setup with clear warning
    read -p "Do you want to set up the database tables? (This is typically only needed for first-time setup) (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_database
    else
        print_info "Database setup skipped. You can run it later with: ./setup.sh --db-setup"
    fi
    
    print_header "Setup complete!"
    echo -e "To start the backend:"
    echo -e "  cd backend"
    echo -e "  source venv/bin/activate"
    echo -e "  uvicorn app.main:app --reload"
    echo -e "\nTo start the frontend:"
    echo -e "  cd frontend"
    echo -e "  npm run dev"
}

# Support for direct database setup
if [[ "$1" == "--db-setup" ]]; then
    setup_database
    exit 0
fi

# Run the script
main 