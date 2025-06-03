from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Dict, Any
import logging

from app.services.dependencies import get_current_user
from app.agents.search_agent import SearchAgent
from app.models.search import SearchQuery, SearchResult, SearchResponse

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/search",
    tags=["search"],
)

# Dependency to get SearchAgent instance
def get_search_agent() -> SearchAgent:
    return SearchAgent()

@router.post("/semantic", response_model=SearchResponse)
async def semantic_search_endpoint(
    search_query: SearchQuery, 
    current_user=Depends(get_current_user),
    search_agent: SearchAgent = Depends(get_search_agent)
):
    """
    Perform semantic search across documents via SearchAgent.

    This endpoint allows searching for relevant content based on meaning,
    not just keywords. The search can be limited to specific documents within a project.
    """
    try:
        user_id = current_user['id']
        logger.info(f"Router: Performing semantic search in project {search_query.project_id} for user {user_id}")
        
        # Use SearchAgent to perform the search
        search_results = await search_agent.semantic_search(
            query=search_query.query,
            project_id=search_query.project_id,
            user_id=user_id,
            doc_ids=search_query.doc_ids,
            top_k=search_query.top_k,
            include_embeddings=search_query.include_embeddings
        )
        
        # Convert results to SearchResult objects
        results = [SearchResult(**result) for result in search_results["results"]]
        
        logger.info(f"Router: Search completed with {len(results)} results in {search_results['elapsed_time']:.2f}s")
        
        return SearchResponse(
            results=results,
            elapsed_time=search_results["elapsed_time"]
        )
        
    except ValueError as ve:
        logger.warning(f"Router: Search validation error: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error in semantic search: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}",
        )

@router.get("/documents/{project_id}", response_model=List[Dict[str, Any]])
async def list_searchable_documents_endpoint(
    project_id: str,
    current_user=Depends(get_current_user),
    search_agent: SearchAgent = Depends(get_search_agent),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List documents that can be searched in a project via SearchAgent.

    This endpoint returns documents that have been indexed and are ready for search.
    """
    try:
        user_id = current_user['id']
        logger.info(f"Router: Listing searchable documents for project {project_id}, user {user_id}")
        
        # Use SearchAgent to get searchable documents
        indexed_documents = await search_agent.list_searchable_documents(
            project_id=project_id,
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        logger.info(f"Router: Found {len(indexed_documents)} indexed documents for project {project_id}")
        return indexed_documents
        
    except ValueError as ve:
        logger.warning(f"Router: Validation error listing documents: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error listing searchable documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list searchable documents: {str(e)}",
        )
