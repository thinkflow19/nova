from fastapi import APIRouter, Depends
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/health",
    tags=["health"],
)

@router.get("")
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT
    }

@router.get("/db")
async def db_health():
    """Database health check endpoint."""
    try:
        from app.services.database_service import DatabaseService
        db_service = DatabaseService()
        # Simple query to verify database connection
        result = await db_service.execute_custom_query(
            table="health_checks",
            query_params={"select": "count(*)", "limit": 1},
            fallback_value={"count": 0}
        )
        return {
            "status": "healthy",
            "database": "connected",
            "details": result
        }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

@router.get("/storage")
async def storage_health():
    """Storage service health check endpoint."""
    try:
        from app.services.storage_service import get_storage_service
        storage_service = get_storage_service()
        # Simple check - try to list files in default bucket
        await storage_service.list_files(prefix="", limit=1)
        return {
            "status": "healthy",
            "storage": "connected"
        }
    except Exception as e:
        logger.error(f"Storage health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "storage": "disconnected",
            "error": str(e)
        } 