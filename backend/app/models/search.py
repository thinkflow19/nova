from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SearchQuery(BaseModel):
    """Request model for semantic search."""
    query: str = Field(..., min_length=1, description="The search query text")
    project_id: str = Field(..., description="The project ID to search within")
    doc_ids: Optional[List[str]] = Field(None, description="Optional list of document IDs to limit search to")
    top_k: Optional[int] = Field(5, ge=1, le=50, description="Number of top results to return")
    include_embeddings: Optional[bool] = Field(False, description="Whether to include embeddings in results")

class SearchResult(BaseModel):
    """Response model for individual search results."""
    document_id: str = Field(..., description="ID of the document containing this result")
    chunk_id: str = Field(..., description="ID of the specific chunk/segment")
    text: str = Field(..., description="The matched text content")
    score: float = Field(..., description="Relevance score (higher is better)")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata about the result")
    embedding: Optional[List[float]] = Field(None, description="Embedding vector (if requested)")

class SearchResponse(BaseModel):
    """Overall response for search operation."""
    results: List[SearchResult] = Field(..., description="List of search results")
    elapsed_time: float = Field(..., description="Time taken to complete the search in seconds") 