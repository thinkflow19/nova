import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from .env file at the project root
# This should be done before importing other modules that rely on env vars
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# Load routes *after* loading .env
from app.routes.project_routes import router as project_router
from app.routes.chat_routes import router as chat_router
from app.routers.auth import router as auth_router  # Assuming auth routes exist
from app.routers.documents import router as document_router # Import document router
from app.routers.chat import router as new_chat_router # Import the new chat router

# Create FastAPI app
app = FastAPI(
    title="Backend API",
    description="Backend API for cursor-python application",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(project_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(document_router) # Prefix is defined in the router itself
app.include_router(new_chat_router) # Prefix is defined in the router itself

@app.get("/")
async def root():
    """
    Root endpoint for health check
    """
    return {"status": "ok", "message": "API is running"}

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    }

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.getenv("PORT", 8000))
    
    # Run the FastAPI app
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
