from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import logging

from app.services.dependencies import get_current_user
from app.agents.embedding_agent import EmbeddingAgent

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/embed",
    tags=["embeddings"],
)

# Dependency to get EmbeddingAgent instance
def get_embedding_agent() -> EmbeddingAgent:
    return EmbeddingAgent()

@router.post("/{document_id}")
async def embed_document_endpoint(
    document_id: str,
    current_user=Depends(get_current_user),
    embedding_agent: EmbeddingAgent = Depends(get_embedding_agent),
):
    """Embed a document in the vector store via EmbeddingAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Starting embedding for document {document_id}, user {user_id}")
        
        # Use EmbeddingAgent to embed the document
        result = await embedding_agent.embed_document(document_id, user_id)
        
        logger.info(f"Router: Embedding completed for document {document_id} with status {result.get('status')}")
        return result
        
    except ValueError as ve:
        logger.warning(f"Router: Embedding validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error in document embedding: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to embed document: {str(e)}",
        )

@router.post("/batch/{project_id}")
async def batch_embed_documents_endpoint(
    project_id: str,
    current_user=Depends(get_current_user),
    embedding_agent: EmbeddingAgent = Depends(get_embedding_agent),
):
    """Embed all unprocessed documents in a project via EmbeddingAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Starting batch embedding for project {project_id}, user {user_id}")
        
        # Use EmbeddingAgent to batch embed documents
        result = await embedding_agent.batch_embed_documents(project_id, user_id)
        
        logger.info(f"Router: Batch embedding completed for project {project_id}: {result.get('documents_successful')} successful, {result.get('documents_failed')} failed")
        return result
        
    except ValueError as ve:
        logger.warning(f"Router: Batch embedding validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error in batch embedding: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start batch embedding: {str(e)}",
        )
