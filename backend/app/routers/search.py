from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any, Optional
import logging
from pydantic import BaseModel

from app.services.dependencies import get_current_user
from app.services.database_service import DatabaseService
from app.services.embedding_service import get_embedding_service
from app.services.vector_store_service import get_vector_store_service

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/search",
    tags=["search"],
)

# Initialize services
db_service = DatabaseService()
embedding_service = get_embedding_service()
vector_store_service = get_vector_store_service()


class SearchQuery(BaseModel):
    """Request model for semantic search."""

    query: str
    project_id: str
    doc_ids: Optional[List[str]] = None
    top_k: Optional[int] = 5
    include_embeddings: Optional[bool] = False


class SearchResult(BaseModel):
    """Response model for search results."""

    document_id: str
    chunk_id: str
    text: str
    score: float
    metadata: Dict[str, Any] = {}
    embedding: Optional[List[float]] = None


class SearchResponse(BaseModel):
    """Overall response for search operation."""

    results: List[SearchResult]
    elapsed_time: float


@router.post("/semantic", response_model=SearchResponse)
async def semantic_search(
    search_query: SearchQuery, current_user=Depends(get_current_user)
):
    """
    Perform semantic search across documents.

    This endpoint allows searching for relevant content based on meaning,
    not just keywords. The search can be limited to specific documents within a project.
    """
    import time

    start_time = time.time()

    try:
        logger.info(
            f"Performing semantic search in project {search_query.project_id} with query: {search_query.query}"
        )

        # Verify project exists and user has access
        project = await db_service.get_project(search_query.project_id)
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            # Check if project is shared with the user
            shared_access = await db_service.check_shared_access(
                "project", search_query.project_id, current_user["id"]
            )
            if not shared_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this project",
                )

        # Generate embedding for the query
        embeddings = await embedding_service.generate_embeddings([search_query.query])
        if not embeddings or len(embeddings) == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate embeddings for search query",
            )
        query_embedding = embeddings[0]

        # Define vectors namespace based on project
        namespace = f"user_{project['user_id']}"

        # Perform vector search
        # We'll filter by doc_ids if provided
        filter_condition = None
        if search_query.doc_ids:
            filter_condition = {"document_id": {"$in": search_query.doc_ids}}

        search_results = await vector_store_service.search_by_embedding(
            embedding=query_embedding,
            top_k=search_query.top_k,
            namespace=namespace,
            filter=filter_condition
        )

        # Transform the results into the SearchResponse format
        results = []
        for result in search_results:
            search_result = SearchResult(
                document_id=result.get("document_id", ""),
                chunk_id=result.get("id", "chunk_" + str(len(results))),  # Use index as fallback ID
                text=result.get("text", ""),
                score=result.get("score", 0.0),
                metadata=result.get("metadata", {}),
            )
            # We don't have embeddings in the results from search_by_embedding
            results.append(search_result)

        elapsed_time = time.time() - start_time
        logger.info(
            f"Search completed in {elapsed_time:.2f}s with {len(results)} results"
        )

        return SearchResponse(results=results, elapsed_time=elapsed_time)

    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Error in semantic search: {str(e)}", exc_info=True)
        
        if isinstance(e, HTTPException):
            raise e
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )


@router.get("/documents/{project_id}", response_model=List[Dict[str, Any]])
async def list_searchable_documents(
    project_id: str,
    current_user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List documents that can be searched in a project.

    This endpoint returns documents that have been indexed and are ready for search.
    """
    try:
        logger.info(f"Listing searchable documents for project ID: {project_id}")

        # Verify project exists and user has access to it
        project = await db_service.get_project(project_id)
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            # Check if project is shared with the user
            shared_access = await db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "filters": {
                        "object_type": "eq.project",
                        "object_id": f"eq.{project_id}",
                        "shared_with": f"eq.{current_user['id']}",
                    },
                },
            )

            if not shared_access:
                logger.warning(
                    f"User {current_user['id']} not authorized to access project {project_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access documents in this project",
                )

        # Query documents from database
        all_documents = await db_service.list_documents(
            project_id=project_id, limit=limit, offset=offset
        )

        # Filter to only indexed documents
        indexed_documents = [doc for doc in all_documents if doc["status"] == "indexed"]

        logger.info(f"Found {len(indexed_documents)} indexed documents for project")
        return indexed_documents

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error listing searchable documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list searchable documents: {str(e)}",
        )
