import logging
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Centralized settings import
from app.config.settings import settings  # Import the instance

# Import routers
from app.routers import auth, projects, documents, search  # Add other routers as needed

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

# Configure CORS using settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],  # Use variable from settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (ensure API_PREFIX is handled correctly if needed)
# If routers don't use settings.API_PREFIX internally, adjust here or in routers
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(projects.router, prefix=API_PREFIX)
app.include_router(documents.router, prefix=API_PREFIX)
app.include_router(search.router, prefix=API_PREFIX)
# app.include_router(payments.router, prefix=API_PREFIX)
# app.include_router(embeddings.router, prefix=API_PREFIX)
# app.include_router(chat.router, prefix=API_PREFIX)


# Root endpoint for health check (outside API prefix)
@app.get("/")
async def root():
    return {"status": "ok", "message": "API is running"}


@app.get("/health")  # Health check usually outside API prefix
async def health_check():
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,  # Use variable from settings
        "version": app.version,
    }


# Run the application directly when executed as a script
if __name__ == "__main__":
    logger.info(
        f"Starting server on http://{HOST}:{PORT}"
    )  # Use variables from settings
    # Pass host and port from settings
    uvicorn.run(
        "app.main:app", host=HOST, port=PORT, reload=(ENVIRONMENT == "development")
    )
