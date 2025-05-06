import logging
from typing import List, Dict, Any, Optional
import pinecone
from app.config.settings import settings  # Import settings

logger = logging.getLogger(__name__)

# Pinecone Initialization is now handled in embedding_service.py
# We will get the initialized client from there or via dependency injection


class VectorStoreService:
    def __init__(self):
        """Initialize the vector store service, relying on pre-initialized Pinecone client."""
        # Ensure we're using the actual index name from settings
        self.index_name = settings.PINECONE_INDEX
        if not self.index_name:
            logger.warning(
                "PINECONE_INDEX not set in environment, defaulting to 'proj'"
            )
            self.index_name = "proj"  # Use the hardcoded value as specified

        self.namespace = settings.PINECONE_NAMESPACE

        # Attempt to get the client initialized elsewhere (e.g., embedding_service)
        # This assumes embedding_service initializes it first. Better approach: DI.
        try:
            # Access the client instance created in embedding_service
            from app.services.embedding_service import pinecone_client

            self.pinecone_client = pinecone_client
            if self.pinecone_client:
                logger.info(
                    f"VectorStoreService connected to Pinecone index: {self.index_name}"
                )
            else:
                logger.warning(
                    "VectorStoreService initialized, but Pinecone client is not available."
                )
        except ImportError:
            logger.error(
                "Could not import pinecone_client from embedding_service. Ensure it's initialized."
            )
            self.pinecone_client = None
        except Exception as e:
            logger.error(f"Error getting pinecone_client in VectorStoreService: {e}")
            self.pinecone_client = None

        if not self.index_name:
            logger.error(
                "PINECONE_INDEX is not set in settings. Vector store cannot function."
            )
            # Consider raising an error if the index name is essential
            # raise ValueError("PINECONE_INDEX must be configured.")

    async def upsert_vectors(
        self, vectors: List[Dict[str, Any]], namespace: Optional[str] = None
    ):
        """Upsert vectors into the specified Pinecone namespace."""
        if not self.pinecone_client:
            logger.error("Pinecone client not initialized. Cannot upsert vectors.")
            raise ConnectionError("Vector store is not connected.")

        ns = namespace or self.namespace
        try:
            logger.info(f"Upserting {len(vectors)} vectors to namespace '{ns}'")
            upsert_response = self.pinecone_client.upsert(vectors=vectors, namespace=ns)
            logger.info(f"Upsert successful: {upsert_response}")
            return upsert_response
        except Exception as e:
            logger.error(f"Error upserting vectors to Pinecone: {str(e)}")
            raise

    async def query_vectors(
        self,
        query_vector: List[float],
        top_k: int = 5,
        namespace: Optional[str] = None,
        filter: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Query vectors from the specified Pinecone namespace."""
        if not self.pinecone_client:
            logger.error("Pinecone client not initialized. Cannot query vectors.")
            raise ConnectionError("Vector store is not connected.")

        ns = namespace or self.namespace
        try:
            logger.info(f"Querying top {top_k} vectors from namespace '{ns}'")
            query_response = self.pinecone_client.query(
                vector=query_vector,
                top_k=top_k,
                namespace=ns,
                filter=filter,
                include_metadata=True,  # Usually want metadata
            )
            logger.info(
                f"Query returned {len(query_response.get('matches', []))} matches"
            )
            return query_response.get("matches", [])
        except Exception as e:
            logger.error(f"Error querying vectors from Pinecone: {str(e)}")
            raise

    async def delete_vectors(self, ids: List[str], namespace: Optional[str] = None):
        """Delete vectors by ID from the specified Pinecone namespace."""
        if not self.pinecone_client:
            logger.error("Pinecone client not initialized. Cannot delete vectors.")
            raise ConnectionError("Vector store is not connected.")

        ns = namespace or self.namespace
        try:
            logger.info(f"Deleting {len(ids)} vectors from namespace '{ns}'")
            delete_response = self.pinecone_client.delete(ids=ids, namespace=ns)
            logger.info(f"Delete response: {delete_response}")
            return delete_response
        except Exception as e:
            logger.error(f"Error deleting vectors from Pinecone: {str(e)}")
            raise

    async def describe_index_stats(self) -> Dict[str, Any]:
        """Get statistics about the Pinecone index."""
        if not self.pinecone_client:
            logger.error("Pinecone client not initialized. Cannot get stats.")
            raise ConnectionError("Vector store is not connected.")
        try:
            stats = self.pinecone_client.describe_index_stats()
            logger.info(f"Pinecone index stats: {stats}")
            return stats
        except Exception as e:
            logger.error(f"Error getting Pinecone index stats: {str(e)}")
            raise

# Singleton instance
_vector_store_service = None

def get_vector_store_service() -> VectorStoreService:
    """Get or create a singleton instance of VectorStoreService."""
    global _vector_store_service
    if _vector_store_service is None:
        _vector_store_service = VectorStoreService()
    return _vector_store_service
