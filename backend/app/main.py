import logging
from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import requests
from fastapi.responses import JSONResponse

# Centralized settings import
from app.config.settings import settings  # Import the instance

# Import routers
from app.routers import auth, projects, chat, doc
from app.routers.health import router as health_router

# Remove load_dotenv() here - it's handled in settings.py

# Configure logging (can be done here or rely on settings.py)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Use settings instance for variables
API_PREFIX = settings.API_PREFIX
PORT = settings.PORT
HOST = settings.HOST
ENVIRONMENT = settings.ENVIRONMENT
FRONTEND_URL = settings.FRONTEND_URL

# Create FastAPI app
app = FastAPI(
    title="Python App Backend",
    description="FastAPI backend with Supabase authentication",
    version="0.1.0",  # Consider moving version to settings?
)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, can be restricted in production
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Logging and debugging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    # Log the request path and method
    path = request.url.path
    method = request.method
    
    # Skip logging health checks
    if not path.endswith("/health"):
        logger.info(f"{method} {path}")
        
        # Log headers for debugging CORS issues
        if method == "OPTIONS":
            logger.info(f"CORS Preflight - Headers: {dict(request.headers)}")
    
    # Process the request
    try:
        response = await call_next(request)
        
        # Log the response status for non-health endpoints
        if not path.endswith("/health"):
            logger.info(f"{method} {path} - {response.status_code}")
            
            # Debug CORS issues
            if method == "OPTIONS" and response.status_code != 200:
                logger.error(f"CORS Preflight failed - Status: {response.status_code}")
                
        return response
    except Exception as e:
        logger.error(f"Request error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

# Startup event to test database connectivity and schema access
@app.on_event("startup")
async def startup_db_client():
    """Test database connectivity and schema access on startup."""
    logger.info("Testing database connectivity and schema access...")
    
    # Initialize storage service
    try:
        from app.services.storage_service import get_storage_service
        logger.info("Initializing storage service...")
        storage_service = get_storage_service()
        await storage_service.initialize()
        logger.info("Storage service initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize storage service: {str(e)}", exc_info=True)
    
    supabase_url = settings.SUPABASE_URL
    service_role_key = settings.SUPABASE_SERVICE_ROLE_KEY
    
    if not supabase_url or not service_role_key:
        logger.error("Missing Supabase URL or Service Role Key in settings")
        return
    
    # Create headers for testing
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "X-Client-Info": "service_role"
    }
    
    # Check base API connection
    rest_url = f"{supabase_url}/rest/v1"
    try:
        response = requests.get(f"{rest_url}/", headers=headers)
        if response.status_code == 200:
            logger.info("✅ Successfully connected to Supabase REST API")
        else:
            logger.warning(f"⚠️ Base API connection returned status {response.status_code}")
    except Exception as e:
        logger.error(f"❌ Failed to connect to Supabase REST API: {str(e)}")
    
    # Test table access with different schema formats
    tables_to_check = ["projects", "user_profiles"]
    schema_formats = ["", "public."]
    
    for table in tables_to_check:
        table_found = False
        for schema in schema_formats:
            try:
                full_table = f"{schema}{table}"
                url = f"{rest_url}/{full_table}"
                response = requests.head(url, headers=headers)
                
                if response.status_code != 404:
                    logger.info(f"✅ Table '{full_table}' is accessible")
                    table_found = True
                    break
            except Exception as e:
                logger.error(f"❌ Error checking table '{schema}{table}': {str(e)}")
        
        if not table_found:
            logger.warning(f"⚠️ Table '{table}' may not be accessible in any schema")
            logger.warning("This might cause 404 errors when accessing this table")
    
    logger.info("Database connectivity tests completed")

# Include routers (ensure API_PREFIX is handled correctly if needed)
app.include_router(health_router)
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(doc.router)
app.include_router(chat.router)

# Root endpoint for API verification
@app.get("/")
async def root():
    return {"status": "ok", "message": "API is running"}


# Run the application directly when executed as a script
if __name__ == "__main__":
    logger.info(
        f"Starting server on http://{HOST}:{PORT}"
    )  # Use variables from settings
    # Pass host and port from settings
    uvicorn.run(
        "app.main:app", host=HOST, port=PORT, reload=(ENVIRONMENT == "development")
    )
