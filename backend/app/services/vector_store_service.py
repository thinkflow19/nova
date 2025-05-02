import os
import logging
from typing import List, Dict, Optional, Tuple
from pinecone import Pinecone, Index, PodSpec
from app.services.embedding_service import (
    EmbeddingService,
    EmbeddingProviderFactory,
    EmbeddingProvider,
)  # Assuming EmbeddingService is in the same directory level

logger = logging.getLogger(__name__)

# Pinecone configuration from environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv(
    "PINECONE_ENVIRONMENT"
)  # e.g., 'gcp-starter' or specific region
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

if not PINECONE_API_KEY or not PINECONE_ENVIRONMENT:
    logger.error("Pinecone API Key or Environment not found in environment variables.")
    # Decide handling: raise error or allow limited init?
    # raise EnvironmentError("Missing Pinecone configuration.")


class VectorStoreService:
    def __init__(self):
        self.index_name = PINECONE_INDEX_NAME
        self.pinecone: Optional[Pinecone] = None
        self.index: Optional[Index] = None
        # Use the embedding service factory to get the correct provider
        embedding_provider = EmbeddingProviderFactory.get_provider()
        self.dimension = embedding_provider.dimension

        if PINECONE_API_KEY and PINECONE_ENVIRONMENT:
            try:
                logger.info(
                    f"Initializing Pinecone client for environment: {PINECONE_ENVIRONMENT}"
                )
                self.pinecone = Pinecone(
                    api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT
                )
                self._connect_to_index()
            except Exception as e:
                logger.error(f"Failed to initialize Pinecone client: {e}")
                self.pinecone = None  # Ensure client is None if init fails
        else:
            logger.warning("Pinecone not initialized due to missing configuration.")

    def _connect_to_index(self):
        """Connects to the specific Pinecone index, creating it if necessary."""
        if not self.pinecone:
            logger.error("Cannot connect to index: Pinecone client not initialized.")
            return

        try:
            # Check if index exists - for Pinecone v6
            existing_indexes = self.pinecone.list_indexes()
            logger.info("Using Pinecone v6.x client")

            if self.index_name not in [idx.name for idx in existing_indexes]:
                logger.warning(
                    f"Index '{self.index_name}' not found. Creating index..."
                )
                # Define index spec - use a suitable pod type/size for your needs
                # Cosine similarity is standard for text embeddings
                spec = PodSpec(
                    environment=PINECONE_ENVIRONMENT
                )  # Adjust pod type/size as needed
                self.pinecone.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=spec,
                )
                logger.info(f"Index '{self.index_name}' created successfully.")
            else:
                logger.info(f"Found existing index '{self.index_name}'.")

            self.index = self.pinecone.Index(self.index_name)
            logger.info(f"Connected to Pinecone index: {self.index_name}")
            stats = self.index.describe_index_stats()
            logger.info(f"Index stats: {stats}")
            # Check if index dimension matches service dimension
            if stats.dimension != self.dimension:
                logger.error(
                    f"Pinecone index dimension ({stats.dimension}) does not match embedding dimension ({self.dimension})!"
                )
                # Handle this mismatch - maybe raise an error or log critical warning
                # For now, log error and disable index interaction
                self.index = None
                raise ValueError("Index dimension mismatch.")

        except Exception as e:
            logger.error(
                f"Failed to connect to or create Pinecone index '{self.index_name}': {e}"
            )
            self.index = None  # Ensure index is None if connection fails

    async def upsert_vectors(
        self, vectors: List[Tuple[str, List[float], Dict]]
    ) -> Dict:
        """Upsert vectors into the Pinecone index."""
        if not self.index:
            logger.error("Cannot upsert: Pinecone index not available.")
            raise ConnectionError("Pinecone index not available")

        # Expecting vectors as list of tuples: (id, values, metadata)
        try:
            logger.info(
                f"Upserting {len(vectors)} vectors into index '{self.index_name}'"
            )
            upsert_response = self.index.upsert(vectors=vectors)
            logger.info(f"Upsert response: {upsert_response}")
            return upsert_response
        except Exception as e:
            logger.error(f"Failed to upsert vectors: {e}")
            raise

    async def query_vectors(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        project_id: Optional[str] = None,
        # Add other potential filters like document_id, etc.
    ) -> List[Dict]:
        """Query the Pinecone index for similar vectors, optionally filtering by project_id."""
        if not self.index:
            logger.error("Cannot query: Pinecone index not available.")
            raise ConnectionError("Pinecone index not available")

        if not query_embedding or len(query_embedding) != self.dimension:
            logger.error(
                f"Invalid query embedding provided (Dimension: {len(query_embedding)}, Expected: {self.dimension})."
            )
            raise ValueError("Invalid query embedding")

        filter_dict = {}
        if project_id:
            filter_dict["project_id"] = project_id
            # Example: Add other filters if needed
            # filter_dict['document_type'] = 'pdf'

        try:
            logger.info(
                f"Querying index '{self.index_name}' with top_k={top_k}, filter={filter_dict}"
            )
            query_response = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict if filter_dict else None,
            )
            logger.info(f"Query returned {len(query_response.matches)} matches.")
            # Format matches to return list of dicts with id, score, metadata
            results = [
                {"id": match.id, "score": match.score, "metadata": match.metadata}
                for match in query_response.matches
            ]
            return results
        except Exception as e:
            logger.error(f"Failed to query vectors: {e}")
            raise

    async def delete_vectors_by_project(self, project_id: str) -> Dict:
        """Delete all vectors associated with a specific project ID."""
        if not self.index:
            logger.error("Cannot delete: Pinecone index not available.")
            raise ConnectionError("Pinecone index not available")

        try:
            logger.warning(
                f"Attempting to delete all vectors for project_id: {project_id}"
            )
            # Note: Deleting by metadata filter can be resource-intensive on some Pinecone plans.
            # Consider alternative strategies if performance is an issue (e.g., namespaces per project).
            delete_response = self.index.delete(filter={"project_id": project_id})
            logger.info(f"Delete response for project {project_id}: {delete_response}")
            return delete_response
        except Exception as e:
            logger.error(f"Failed to delete vectors for project {project_id}: {e}")
            raise


# Example Usage (for testing - requires Pinecone/OpenAI setup)
async def _test_vector_store_service():
    import asyncio
    import uuid

    logging.basicConfig(level=logging.INFO)

    if (
        not PINECONE_API_KEY
        or not PINECONE_ENVIRONMENT
        or not os.getenv("OPENAI_API_KEY")
    ):
        print("Skipping test: Pinecone/OpenAI environment variables not fully set.")
        return

    vs_service = VectorStoreService()
    emb_service = vs_service.embedding_service  # Use the same instance
    test_project_id = f"test-proj-{uuid.uuid4().hex[:6]}"
    test_doc_id = f"test-doc-{uuid.uuid4().hex[:6]}"

    # Ensure index is ready
    if not vs_service.index:
        print("Test failed: Could not connect to Pinecone index.")
        return

    try:
        # 1. Upsert
        print("\n--- Testing Upsert ---")
        text1 = "The first test document talks about apples."
        text2 = "The second test document mentions bananas."
        emb1 = await emb_service.generate_embedding(text1)
        emb2 = await emb_service.generate_embedding(text2)

        vectors_to_upsert = [
            (
                f"{test_doc_id}-chunk1",
                emb1,
                {
                    "project_id": test_project_id,
                    "document_id": test_doc_id,
                    "text": text1,
                },
            ),
            (
                f"{test_doc_id}-chunk2",
                emb2,
                {
                    "project_id": test_project_id,
                    "document_id": test_doc_id,
                    "text": text2,
                },
            ),
        ]
        upsert_res = await vs_service.upsert_vectors(vectors_to_upsert)
        print(f"Upsert Result: {upsert_res}")
        # Add a small delay for indexing
        await asyncio.sleep(5)

        # 2. Query
        print("\n--- Testing Query ---")
        query_text = "Tell me about apples"
        query_emb = await emb_service.generate_embedding(query_text)
        query_res = await vs_service.query_vectors(
            query_emb, top_k=1, project_id=test_project_id
        )
        print(f"Query Result for '{query_text}': {query_res}")
        assert len(query_res) > 0
        assert "apples" in query_res[0]["metadata"]["text"].lower()

        query_text_banana = "What about bananas?"
        query_emb_banana = await emb_service.generate_embedding(query_text_banana)
        query_res_banana = await vs_service.query_vectors(
            query_emb_banana, top_k=1, project_id=test_project_id
        )
        print(f"Query Result for '{query_text_banana}': {query_res_banana}")
        assert len(query_res_banana) > 0
        assert "bananas" in query_res_banana[0]["metadata"]["text"].lower()

        # 3. Query with mismatching project_id (should return empty)
        print("\n--- Testing Query with Wrong Project ID ---")
        query_res_wrong_proj = await vs_service.query_vectors(
            query_emb, top_k=1, project_id="wrong-project"
        )
        print(f"Query Result for wrong project: {query_res_wrong_proj}")
        assert len(query_res_wrong_proj) == 0

    except Exception as e:
        print(f"An error occurred during testing: {e}")
        import traceback

        traceback.print_exc()
    finally:
        # 4. Delete
        print("\n--- Testing Delete ---")
        if vs_service.index and test_project_id:  # Check again in case init failed
            try:
                delete_res = await vs_service.delete_vectors_by_project(test_project_id)
                print(f"Delete Result: {delete_res}")
            except Exception as e:
                print(f"Error during cleanup delete: {e}")
        else:
            print("Skipping delete cleanup as index/project_id not available.")

    print("\nVector Store Service Test Completed.")


# To run test: python -m app.services.vector_store_service
if __name__ == "__main__":
    import asyncio

    # if os.name == 'nt':
    #     asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(_test_vector_store_service())
