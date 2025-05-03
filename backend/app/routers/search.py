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
    prefix="/api/search",
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
    document_ids: Optional[List[str]] = None
    top_k: Optional[int] = 5
    filter_metadata: Optional[Dict[str, Any]] = None


class SearchResult(BaseModel):
    """Response model for search results."""

    text: str
    score: float
    document_id: str
    document_name: Optional[str] = None
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    """Overall response for search operation."""

    results: List[SearchResult]
    query: str
    processing_time_ms: float


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
        project = db_service.get_project(search_query.project_id)
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            # Check if project is shared with the user
            shared_access = db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "filters": {
                        "object_type": "eq.project",
                        "object_id": f"eq.{search_query.project_id}",
                        "shared_with": f"eq.{current_user['id']}",
                    },
                },
            )

            if not shared_access:
                logger.warning(
                    f"User {current_user['id']} not authorized to search in project {search_query.project_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to search in this project",
                )

        # Get indexed documents for the project
        if search_query.document_ids:
            # Filter to specific documents
            documents = [
                db_service.get_document(doc_id)
                for doc_id in search_query.document_ids
                if db_service.get_document(doc_id)["project_id"]
                == search_query.project_id
                and db_service.get_document(doc_id)["status"] == "indexed"
            ]
        else:
            # Get all indexed documents for the project
            all_docs = db_service.list_documents(search_query.project_id, limit=1000)
            documents = [doc for doc in all_docs if doc["status"] == "indexed"]

        if not documents:
            logger.info(
                f"No indexed documents found for project {search_query.project_id}"
            )
            return SearchResponse(
                results=[],
                query=search_query.query,
                processing_time_ms=(time.time() - start_time) * 1000,
            )

        # Collect all namespaces to search
        namespaces = [
            doc["pinecone_namespace"]
            for doc in documents
            if doc.get("pinecone_namespace")
        ]
        logger.info(f"Searching across {len(namespaces)} document namespaces")

        if not namespaces:
            logger.warning(
                f"No valid namespaces found for indexed documents in project {search_query.project_id}"
            )
            return SearchResponse(
                results=[],
                query=search_query.query,
                processing_time_ms=(time.time() - start_time) * 1000,
            )

        # Create filter for vector store
        filter_dict = {"project_id": search_query.project_id}

        # Add document filter if specified
        if search_query.document_ids:
            filter_dict["document_id"] = {"$in": search_query.document_ids}

        # Add any additional metadata filters
        if search_query.filter_metadata:
            filter_dict.update(search_query.filter_metadata)

        # Generate query embedding
        query_embedding = await embedding_service.generate_single_embedding(
            search_query.query
        )

        # Perform the search
        search_results = await vector_store_service.search(
            query_embedding=query_embedding,
            top_k=search_query.top_k,
            namespaces=namespaces,
            filter_dict=filter_dict,
        )

        # Format the results
        formatted_results = []
        for result in search_results:
            # Get document info
            document_id = result["metadata"].get("document_id", "")
            document_name = None

            if document_id:
                try:
                    document = db_service.get_document(document_id)
                    document_name = document.get("name")
                except Exception as e:
                    logger.warning(
                        f"Could not fetch document name for {document_id}: {str(e)}"
                    )

            formatted_results.append(
                SearchResult(
                    text=result["metadata"].get("text", ""),
                    score=result["score"],
                    document_id=document_id,
                    document_name=document_name,
                    metadata=result["metadata"],
                )
            )

        elapsed_time = (time.time() - start_time) * 1000
        logger.info(
            f"Search returned {len(formatted_results)} results in {elapsed_time:.2f}ms"
        )

        return SearchResponse(
            results=formatted_results,
            query=search_query.query,
            processing_time_ms=elapsed_time,
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e

        logger.error(f"Error performing semantic search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform search: {str(e)}",
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
        project = db_service.get_project(project_id)
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            # Check if project is shared with the user
            shared_access = db_service.execute_custom_query(
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
        all_documents = db_service.list_documents(
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
