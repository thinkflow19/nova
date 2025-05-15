import asyncio
import logging
import os
import sys
import uuid
import random

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path to find app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vector_store_service import get_vector_store_service
from app.services.embedding_service import get_embedding_service, chunk_text
from app.config.settings import settings

async def test_vector_store():
    """Test vector store with real embeddings"""
    print("\n===== Testing Vector Store Service =====")
    
    # Initialize services
    vector_service = get_vector_store_service()
    embedding_service = get_embedding_service()
    
    print(f"Vector service initialized: {vector_service is not None}")
    print(f"Embedding service initialized: {embedding_service is not None}")
    
    # Create test data
    test_text = """
    # Test Document for Vector Storage

    This is a test document for the Nova vector storage system.
    
    It contains multiple paragraphs to test the chunking functionality.
    Each paragraph should be properly chunked according to size parameters.
    
    The text should be:
    1. Chunked into segments
    2. Embedded using the embedding service
    3. Stored in the vector database
    4. Retrieved via search
    
    If all steps complete successfully, the vector storage is working correctly.
    """
    
    # Generate a unique document ID
    document_id = f"test-{uuid.uuid4().hex[:8]}"
    namespace = f"test_{uuid.uuid4().hex[:8]}"
    
    try:
        # 1. Chunk the text
        print("\nChunking text...")
        chunks = chunk_text(test_text)
        print(f"Created {len(chunks)} chunks")
        
        # 2. Generate embeddings
        print("\nGenerating embeddings...")
        embeddings = await embedding_service.generate_embeddings(chunks)
        print(f"Generated {len(embeddings)} embeddings")
        
        # 3. Store in vector database
        print("\nStoring embeddings in vector database...")
        metadata = {
            "document_id": document_id,
            "file_name": "test_vector_store.txt",
            "project_id": "test_project"
        }
        
        result = await vector_service.upsert_embeddings_with_metadata(
            embeddings=embeddings,
            texts=chunks,
            metadata_base=metadata,
            namespace=namespace
        )
        
        print(f"Upsert result: {result}")
        
        # 4. Get vector store stats
        print("\nChecking vector store stats...")
        stats = await vector_service.describe_index_stats()
        
        # Check if our namespace exists
        if stats and "namespaces" in stats:
            namespaces = stats["namespaces"]
            if namespace in namespaces:
                vector_count = namespaces[namespace].get("vector_count", 0)
                print(f"Found {vector_count} vectors in namespace: {namespace}")
            else:
                print(f"Namespace {namespace} not found in vector store")
                
            print("\nAll namespaces in vector store:")
            for ns, ns_data in namespaces.items():
                print(f"  - {ns}: {ns_data.get('vector_count', 0)} vectors")
        else:
            print("No namespace data available in vector store stats")
        
        # 5. Test search functionality
        print("\nTesting search functionality...")
        
        # Generate embedding for query
        query = "vector storage test"
        query_embedding = await embedding_service.generate_single_embedding(query)
        
        # Search using the embedding
        search_results = await vector_service.search_by_embedding(
            embedding=query_embedding,
            top_k=2,
            namespace=namespace
        )
        
        if search_results:
            print(f"Search returned {len(search_results)} results:")
            for i, result in enumerate(search_results):
                print(f"  {i+1}. Score: {result['score']:.4f}")
                print(f"     Text: {result['text'][:100]}...")
        else:
            print("No search results found")
        
        # 6. Clean up
        print("\nCleaning up test vectors...")
        await vector_service.delete_document_vectors(
            document_id=document_id,
            namespace=namespace
        )
        print("Test vectors deleted")
        
        # Verify deletion
        stats_after = await vector_service.describe_index_stats()
        if namespace in stats_after.get("namespaces", {}):
            count = stats_after["namespaces"][namespace].get("vector_count", 0)
            print(f"Namespace {namespace} still exists with {count} vectors")
        else:
            print(f"Namespace {namespace} successfully removed")
        
        print("\nVector store test completed successfully!")
        
    except Exception as e:
        print(f"Error testing vector store: {e}")
    
    print("\n===== Test completed =====")

if __name__ == "__main__":
    try:
        asyncio.run(test_vector_store())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}") 