"""
Agent responsible for search operations.
"""
import logging
import time
from typing import List, Dict, Any, Optional

from app.services.database_service import DatabaseService
from app.services.embedding_service import get_embedding_service
from app.services.vector_store_service import get_vector_store_service

logger = logging.getLogger(__name__)

class SearchAgent:
    def __init__(self):
        self.db_service = DatabaseService()
        self.embedding_service = get_embedding_service()
        self.vector_store_service = get_vector_store_service()

    async def _check_project_access(self, project_id: str, user_id: str) -> Dict[str, Any]:
        """Helper method to check if user has access to a project."""
        logger.info(f"SearchAgent checking access to project {project_id} for user {user_id}")
        
        try:
            project = await self.db_service.get_project(project_id)
        except Exception as e:
            logger.error(f"SearchAgent: Project {project_id} not found: {e}")
            raise ValueError(f"Project not found: {project_id}")
        
        # Check if user owns project or if project is public
        if project["user_id"] == user_id or project.get("is_public", False):
            return project
        
        # Check if project is shared with the user using execute_custom_query
        try:
            shared_access = await self.db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "object_type": "eq.project",
                    "object_id": f"eq.{project_id}",
                    "shared_with": f"eq.{user_id}",
                    "limit": "1"
                }
            )
            
            if shared_access and len(shared_access) > 0:
                logger.info(f"SearchAgent: User {user_id} has shared access to project {project_id}")
                return project
        except Exception as e:
            logger.warning(f"SearchAgent: Error checking shared access: {e}")
        
        logger.warning(f"SearchAgent: User {user_id} does not have access to project {project_id}")
        raise ValueError("You don't have access to this project")

    async def semantic_search(
        self, 
        query: str, 
        project_id: str, 
        user_id: str,
        doc_ids: Optional[List[str]] = None,
        top_k: int = 5,
        include_embeddings: bool = False
    ) -> Dict[str, Any]:
        """
        Perform semantic search across documents in a project.
        
        Returns a dictionary with 'results' and 'elapsed_time' keys.
        """
        start_time = time.time()
        
        logger.info(f"SearchAgent performing semantic search in project {project_id} with query: '{query}'")
        
        # Check project access
        project = await self._check_project_access(project_id, user_id)
        
        # Generate embedding for the query
        try:
            embeddings = await self.embedding_service.generate_embeddings([query])
            if not embeddings or len(embeddings) == 0:
                raise ValueError("Failed to generate embeddings for search query")
            query_embedding = embeddings[0]
        except Exception as e:
            logger.error(f"SearchAgent: Error generating embeddings: {e}")
            raise ValueError(f"Failed to generate embeddings for search query: {e}")
        
        # Define vectors namespace based on project
        namespace = f"user_{project['user_id']}"
        
        # Set up filter condition if doc_ids are provided
        filter_condition = None
        if doc_ids:
            filter_condition = {"document_id": {"$in": doc_ids}}
        
        # Perform vector search
        try:
            search_results = await self.vector_store_service.search_by_embedding(
                embedding=query_embedding,
                top_k=top_k,
                namespace=namespace,
                filter=filter_condition
            )
        except Exception as e:
            logger.error(f"SearchAgent: Vector search failed: {e}")
            raise ValueError(f"Vector search failed: {e}")
        
        # Transform the results into the expected format
        results = []
        for result in search_results:
            search_result = {
                "document_id": result.get("document_id", ""),
                "chunk_id": result.get("id", f"chunk_{len(results)}"),
                "text": result.get("text", ""),
                "score": result.get("score", 0.0),
                "metadata": result.get("metadata", {}),
            }
            
            # Include embeddings if requested (though typically not needed in search results)
            if include_embeddings and "embedding" in result:
                search_result["embedding"] = result["embedding"]
            
            results.append(search_result)
        
        elapsed_time = time.time() - start_time
        logger.info(f"SearchAgent: Search completed in {elapsed_time:.2f}s with {len(results)} results")
        
        return {
            "results": results,
            "elapsed_time": elapsed_time
        }

    async def list_searchable_documents(
        self, 
        project_id: str, 
        user_id: str, 
        limit: int = 100, 
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        List documents that can be searched in a project.
        
        Returns documents that have been indexed and are ready for search.
        """
        logger.info(f"SearchAgent listing searchable documents for project {project_id}, user {user_id}")
        
        # Check project access
        await self._check_project_access(project_id, user_id)
        
        # Query documents from database
        try:
            all_documents = await self.db_service.list_documents(
                project_id=project_id, limit=limit, offset=offset
            )
        except Exception as e:
            logger.error(f"SearchAgent: Error fetching documents: {e}")
            raise ValueError(f"Failed to fetch documents: {e}")
        
        # Filter to only indexed documents
        indexed_documents = [doc for doc in all_documents if doc.get("status") == "indexed"]
        
        logger.info(f"SearchAgent: Found {len(indexed_documents)} indexed documents out of {len(all_documents)} total")
        
        return indexed_documents 