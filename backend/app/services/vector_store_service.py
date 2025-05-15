import logging
from typing import List, Dict, Any, Optional
from uuid import uuid4
import asyncio
from pinecone import Pinecone, ServerlessSpec
from app.config.settings import settings

logger = logging.getLogger(__name__)

class VectorStoreService:
    def __init__(self, pinecone_client=None):
        """Initialize the vector store service with a Pinecone client.

        Args:
            pinecone_client: Initialized Pinecone client instance (optional)

        Raises:
            ValueError: If required settings are missing
            ConnectionError: If index connection fails
        """
        # Create client if not provided
        if not pinecone_client:
            if not settings.PINECONE_API_KEY:
                logger.error("PINECONE_API_KEY is not set in settings")
                raise ValueError("PINECONE_API_KEY is required")
                
            try:
                pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
                logger.info("Initialized Pinecone client")
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone client: {str(e)}")
                raise ConnectionError(f"Could not initialize Pinecone client: {str(e)}")

        self.pinecone_client = pinecone_client
        self.index_name = settings.PINECONE_INDEX
        self.namespace = settings.PINECONE_NAMESPACE

        # Validate required settings
        if not self.index_name:
            logger.error("PINECONE_INDEX is not set in settings")
            raise ValueError("PINECONE_INDEX is required")
        if not self.namespace:
            logger.error("PINECONE_NAMESPACE is not set in settings")
            raise ValueError("PINECONE_NAMESPACE is required")

        try:
            # Verify index exists and is accessible
            self.index = self.pinecone_client.Index(self.index_name)
            self.index.describe_index_stats()
            logger.info(f"Connected to Pinecone index: {self.index_name}")
        except Exception as e:
            logger.error(f"Failed to connect to Pinecone index {self.index_name}: {str(e)}")
            raise ConnectionError(f"Invalid Pinecone index configuration: {str(e)}")

    async def upsert_vectors(
        self,
        vectors: List[Dict[str, Any]],
        namespace: Optional[str] = None,
        batch_size: int = 100,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """Upsert vectors into the specified Pinecone namespace in batches.

        Args:
            vectors: List of vector dictionaries with id, values, and optional metadata
            namespace: Target namespace (defaults to configured namespace)
            batch_size: Number of vectors to upsert in each batch
            timeout: Timeout in seconds for each batch operation

        Returns:
            Dict containing upsert statistics (e.g., {"upserted_count": N})

        Raises:
            ValueError: If namespace or vector format is invalid
            Exception: If Pinecone operation fails
        """
        if not self.index:
            raise ConnectionError("Pinecone index not initialized")

        ns = namespace or self.namespace
        if not ns:
            raise ValueError("Namespace is required")

        if not vectors:
            logger.info("No vectors provided for upsert")
            return {"upserted_count": 0}

        # Validate vector format
        for i, vector in enumerate(vectors):
            if not isinstance(vector, dict) or "id" not in vector or "values" not in vector:
                logger.error(f"Invalid vector format at index {i}: {vector}")
                raise ValueError("Each vector must be a dict with 'id' and 'values'")

        # Process in batches
        total_upserted = 0
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            try:
                logger.info(f"Upserting batch {i//batch_size + 1}/{(len(vectors) + batch_size - 1)//batch_size} of {len(batch)} vectors to namespace '{ns}'")
                
                # Use to_thread to make the blocking call non-blocking
                await asyncio.to_thread(
                    self.index.upsert,
                    vectors=batch,
                    namespace=ns,
                    async_req=False  # Updated param name in newer Pinecone versions
                )
                
                total_upserted += len(batch)
                logger.debug(f"Successfully upserted batch of {len(batch)} vectors")
                
            except Exception as e:
                logger.error(f"Failed to upsert batch {i//batch_size + 1}: {str(e)}")
                raise
        
        logger.info(f"Successfully upserted {total_upserted} vectors to namespace '{ns}'")
        return {"upserted_count": total_upserted}

    async def upsert_embeddings_with_metadata(
        self,
        embeddings: List[List[float]],
        texts: List[str],
        metadata_base: Dict[str, Any],
        namespace: Optional[str] = None,
        id_prefix: str = "",
        batch_size: int = 100
    ) -> Dict[str, Any]:
        """Upsert text embeddings with their original texts as metadata.
        
        Args:
            embeddings: List of embedding vectors
            texts: List of original text chunks
            metadata_base: Base metadata to include with all vectors
            namespace: Target namespace
            id_prefix: Optional prefix for vector IDs
            batch_size: Number of vectors to upsert in each batch
            
        Returns:
            Dict containing upsert statistics
        """
        if len(embeddings) != len(texts):
            raise ValueError(f"Embedding count ({len(embeddings)}) must match text count ({len(texts)})")
            
        # Create vector objects with metadata
        vectors = []
        for i, (embedding, text) in enumerate(zip(embeddings, texts)):
            # Create a unique vector ID with optional prefix
            vector_id = f"{id_prefix}_chunk_{i}" if id_prefix else f"chunk_{uuid4().hex}"
            
            # Create metadata with the text and base metadata
            metadata = {
                "text": text,  # Store the original text
                "chunk_index": i,
                **metadata_base  # Include all base metadata
            }
            
            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": metadata
            })
            
        # Upsert the vectors
        return await self.upsert_vectors(
            vectors=vectors,
            namespace=namespace,
            batch_size=batch_size
        )

    async def query_vectors(
        self,
        vector: List[float],
        top_k: int = 5,
        namespace: Optional[str] = None,
        filter: Optional[Dict[str, Any]] = None,
        include_values: bool = False,
        include_metadata: bool = True,
        timeout: int = 30
    ) -> List[Dict[str, Any]]:
        """Query vectors from the specified Pinecone namespace.

        Args:
            vector: Query vector as list of floats
            top_k: Number of results to return (1-1000)
            namespace: Target namespace
            filter: Optional metadata filter
            include_values: Whether to include vector values in results
            include_metadata: Whether to include metadata in results
            timeout: Timeout in seconds for the query

        Returns:
            List of matching vectors with metadata

        Raises:
            ValueError: If vector or top_k is invalid
            Exception: If Pinecone operation fails
        """
        if not self.index:
            raise ConnectionError("Pinecone index not initialized")

        if not isinstance(vector, list) or not all(isinstance(x, (int, float)) for x in vector):
            raise ValueError("Query vector must be a list of numbers")
        if not vector:
            raise ValueError("Query vector cannot be empty")
        if not isinstance(top_k, int) or top_k < 1 or top_k > 1000:
            raise ValueError("top_k must be an integer between 1 and 1000")

        ns = namespace or self.namespace
        if not ns:
            raise ValueError("Namespace is required")

        try:
            # In newer Pinecone versions, query returns a QueryResponse object
            response = await asyncio.to_thread(
                self.index.query,
                vector=vector,
                top_k=top_k,
                namespace=ns,
                filter=filter,
                include_values=include_values,
                include_metadata=include_metadata
            )

            # Extract matches from response
            matches = response.get('matches', [])
            logger.info(f"Query returned {len(matches)} matches from namespace '{ns}'")
            return matches

        except Exception as e:
            logger.error(f"Failed to query vectors from namespace '{ns}': {str(e)}")
            raise

    async def delete_vectors(
        self,
        ids: List[str],
        namespace: Optional[str] = None,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """Delete vectors by ID from the specified Pinecone namespace.

        Args:
            ids: List of vector IDs to delete
            namespace: Target namespace
            timeout: Timeout in seconds for the deletion

        Returns:
            Dict containing deletion statistics (e.g., {"deleted_count": N})

        Raises:
            ValueError: If ids or namespace is invalid
            Exception: If Pinecone operation fails
        """
        if not self.index:
            raise ConnectionError("Pinecone index not initialized")

        ns = namespace or self.namespace
        if not ns:
            raise ValueError("Namespace is required")

        if not ids:
            logger.info("No IDs provided for deletion")
            return {"deleted_count": 0}

        if not all(isinstance(id_, str) for id_ in ids):
            raise ValueError("All IDs must be strings")

        try:
            await asyncio.to_thread(
                self.index.delete,
                ids=ids,
                namespace=ns
            )

            deleted_count = len(ids)  # Pinecone doesn't return deleted count
            logger.info(f"Deleted {deleted_count} vectors from namespace '{ns}'")
            return {"deleted_count": deleted_count}

        except Exception as e:
            logger.error(f"Failed to delete vectors from namespace '{ns}': {str(e)}")
            raise

    async def delete_document_vectors(
        self,
        document_id: str,
        namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Delete all vectors associated with a document ID.
        
        Args:
            document_id: Document ID to filter by
            namespace: Target namespace
            
        Returns:
            Dict containing deletion statistics
        """
        if not self.index:
            raise ConnectionError("Pinecone index not initialized")

        ns = namespace or self.namespace
        
        try:
            # Use Pinecone's metadata filtering to delete by document_id
            filter = {"document_id": {"$eq": document_id}}
            
            logger.info(f"Deleting vectors for document {document_id} from namespace '{ns}'")
            await asyncio.to_thread(
                self.index.delete,
                filter=filter,
                namespace=ns
            )
            
            # Unfortunately, Pinecone doesn't return count for filtered deletes
            # So we'll just log success and return a generic message
            logger.info(f"Successfully deleted vectors for document {document_id}")
            return {"success": True, "document_id": document_id}
            
        except Exception as e:
            logger.error(f"Failed to delete vectors for document {document_id}: {str(e)}")
            raise

    async def delete_namespace(
        self,
        namespace: Optional[str] = None
    ) -> Dict[str, Any]:
        """Delete an entire namespace.
        
        Args:
            namespace: Target namespace to delete
            
        Returns:
            Dict containing deletion status
        """
        if not self.index:
            raise ConnectionError("Pinecone index not initialized")

        ns = namespace or self.namespace
        
        try:
            logger.info(f"Deleting entire namespace '{ns}'")
            
            # In newer Pinecone versions, we delete by passing an empty filter
            await asyncio.to_thread(
                self.index.delete,
                delete_all=True,
                namespace=ns
            )
            
            logger.info(f"Successfully deleted namespace '{ns}'")
            return {"success": True, "namespace": ns}
            
        except Exception as e:
            logger.error(f"Failed to delete namespace '{ns}': {str(e)}")
            raise

    async def describe_index_stats(self, timeout: int = 30) -> Dict[str, Any]:
        """Get statistics about the Pinecone index.

        Args:
            timeout: Timeout in seconds for the operation

        Returns:
            Dict containing index statistics

        Raises:
            Exception: If Pinecone operation fails
        """
        if not self.index:
            raise ConnectionError("Pinecone index not initialized")

        try:
            stats = await asyncio.to_thread(self.index.describe_index_stats)
            
            # Convert stats to a dict if it's not already
            if not isinstance(stats, dict):
                stats = stats.__dict__
                
            logger.info(f"Retrieved index stats: {stats}")
            return stats

        except Exception as e:
            logger.error(f"Failed to get index stats: {str(e)}")
            raise

    async def format_search_results(self, matches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format raw query matches into a more usable structure.
        
        Args:
            matches: Raw matches from Pinecone query
            
        Returns:
            List of formatted search results
        """
        results = []
        for match in matches:
            # Handle both object-style and dict-style responses
            if hasattr(match, 'id'):
                # Object-style response (newer Pinecone client)
                match_id = match.id
                score = match.score
                metadata = match.metadata if hasattr(match, 'metadata') else {}
            else:
                # Dict-style response
                match_id = match.get('id', 'unknown')
                score = match.get('score', 0)
                metadata = match.get('metadata', {})
            
            # Extract text from metadata
            text = metadata.get('text', None)
            if not metadata or not text:
                logger.warning(f"Skipping match {match_id} due to missing metadata or text")
                continue
                
            results.append({
                "text": text,
                "score": score,
                "document_id": metadata.get("document_id", "Unknown"),
                "file_name": metadata.get("source_doc_name", metadata.get("file_name", "Unknown")),
            })
        
        return results

    async def search_by_embedding(
        self,
        embedding: List[float],
        top_k: int = 5,
        namespace: Optional[str] = None,
        filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search Pinecone by embedding vector and return formatted results.
        
        Args:
            embedding: Query vector as list of floats
            top_k: Number of results to return
            namespace: Target namespace
            filter: Optional metadata filter
            
        Returns:
            List of formatted search results
        """
        # Get raw matches from Pinecone
        matches = await self.query_vectors(
            vector=embedding,
            top_k=top_k,
            namespace=namespace,
            filter=filter,
            include_metadata=True
        )
        
        # Format results
        return await self.format_search_results(matches)

def get_vector_store_service() -> VectorStoreService:
    """Get or create a VectorStoreService instance."""
    try:
        pinecone_client = Pinecone(api_key=settings.PINECONE_API_KEY)
        return VectorStoreService(pinecone_client)
    except Exception as e:
        logger.error(f"Failed to initialize vector store service: {str(e)}")
        raise