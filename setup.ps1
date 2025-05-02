# PowerShell script for setting up the project on Windows

# Print colored output
function Write-Header {
    param($message)
    Write-Host "`n=== $message ===`n" -ForegroundColor Green
}

function Write-Step {
    param($message)
    Write-Host "-> $message" -ForegroundColor Yellow
}

function Write-Error {
    param($message)
    Write-Host "ERROR: $message" -ForegroundColor Red
}

function Write-Warning {
    param($message)
    Write-Host "WARNING: $message" -ForegroundColor Red
}

function Write-Info {
    param($message)
    Write-Host "INFO: $message" -ForegroundColor Blue
}

# Check environment
function Check-Environment {
    Write-Header "Checking environment"
    
    try {
        $pythonVersion = python --version
        Write-Host "Python version: $pythonVersion"
    }
    catch {
        Write-Error "Python is required but not installed"
        exit 1
    }
    
    try {
        $nodeVersion = node --version
        Write-Host "Node version: $nodeVersion"
    }
    catch {
        Write-Error "Node.js is required but not installed"
        exit 1
    }
    
    try {
        $npmVersion = npm --version
        Write-Host "npm version: $npmVersion"
    }
    catch {
        Write-Error "npm is required but not installed"
        exit 1
    }
}

# Setup backend
function Setup-Backend {
    Write-Header "Setting up backend"
    
    Push-Location backend
    
    Write-Step "Creating Python virtual environment"
    python -m venv venv
    
    Write-Step "Activating virtual environment"
    .\venv\Scripts\Activate.ps1
    
    Write-Step "Installing dependencies"
    pip install -r requirements.txt
    
    Write-Step "Backend setup complete"
    
    Pop-Location
}

# Setup frontend
function Setup-Frontend {
    Write-Header "Setting up frontend"
    
    Push-Location frontend
    
    Write-Step "Installing npm dependencies"
    npm install
    
    Write-Step "Frontend setup complete"
    
    Pop-Location
}

# Setup database - this is a separate function that is only called explicitly
function Setup-Database {
    Write-Header "Database Setup"
    
    Write-Warning "This will create or modify database tables."
    Write-Warning "Existing tables might be altered but data should be preserved."
    Write-Warning "For a completely fresh setup, you should manually drop tables first."
    
    $confirmation = Read-Host "Are you sure you want to continue with database setup? (y/n)"
    if ($confirmation -ne "y") {
        Write-Info "Database setup canceled"
        return
    }
    
    $dbType = Read-Host "Which database type? (postgres/sqlite/mysql) [postgres]"
    if ([string]::IsNullOrEmpty($dbType)) {
        $dbType = "postgres"
    }
    
    Push-Location scripts
    
    Write-Step "Installing script dependencies"
    pip install -r requirements.txt
    
    Write-Step "Creating database tables"
    python db_setup/create_tables.py --db-type $dbType
    
    Pop-Location
}

# Main script
function Main {
    param(
        [switch]$DbSetup
    )
    
    # Handle direct database setup call
    if ($DbSetup) {
        Setup-Database
        return
    }
    
    Write-Header "Starting project setup"
    
    Check-Environment
    
    # Check for .env file
    if (-not (Test-Path "backend\.env")) {
        Write-Step "Creating example .env file"
        $envContent = @"
# Backend environment variables

# OpenAI
OPENAI_API_KEY=your_openai_api_key
DEFAULT_CHAT_MODEL=gpt-3.5-turbo

# Database
DB_TYPE=postgres

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_POSTGRES_PASSWORD=your_db_password

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_pinecone_index_name
"@
        $envContent | Out-File -FilePath "backend\.env" -Encoding utf8
        Write-Step "Please edit backend\.env with your actual credentials"
    }
    
    # Setup parts
    $setupBackend = Read-Host "Set up backend? (y/n)"
    if ($setupBackend -eq "y") {
        Setup-Backend
    }
    
    $setupFrontend = Read-Host "Set up frontend? (y/n)"
    if ($setupFrontend -eq "y") {
        Setup-Frontend
    }
    
    # Separate step for database setup with clear warning
    $setupDatabase = Read-Host "Do you want to set up the database tables? (This is typically only needed for first-time setup) (y/n)"
    if ($setupDatabase -eq "y") {
        Setup-Database
    } else {
        Write-Info "Database setup skipped. You can run it later with: .\setup.ps1 -DbSetup"
    }
    
    Write-Header "Setup complete!"
    Write-Host "To start the backend:"
    Write-Host "  cd backend"
    Write-Host "  .\venv\Scripts\Activate.ps1"
    Write-Host "  uvicorn app.main:app --reload"
    Write-Host "`nTo start the frontend:"
    Write-Host "  cd frontend"
    Write-Host "  npm run dev"
}

# Check for parameters
$scriptParams = @{}
if ($args -contains "-DbSetup") {
    $scriptParams.Add("DbSetup", $true)
}

# Run the script with parameters
Main @scriptParams 