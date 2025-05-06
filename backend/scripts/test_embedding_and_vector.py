#!/usr/bin/env python3
"""
Test script for the complete embedding and vector storage pipeline.
"""

import os
import sys
import logging
import asyncio
import uuid
import time
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure the app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the services
from app.services.embedding_service import get_embedding_service, chunk_text, extract_text_from_file
from app.services.vector_store_service import get_vector_store_service
from app.config.settings import settings

async def test_embedding_and_vector_storage():
    """
    Test the complete pipeline from text chunking to embedding generation and vector storage
    """
    print("\n===== Testing Embedding and Vector Storage Pipeline =====")
    
    # Initialize the services
    embedding_service = get_embedding_service()
    vector_service = get_vector_store_service()
    
    print(f"Embedding service initialized with model: {embedding_service.model}")
    print(f"Embedding dimension: {embedding_service.dimension}")
    print(f"Vector service connected to index: {vector_service.index_name}")
    
    # Create test document
    document_id = f"test-doc-{uuid.uuid4().hex[:8]}"
    test_namespace = f"test_{uuid.uuid4().hex[:8]}"
    
    print(f"\nTest document ID: {document_id}")
    print(f"Test namespace: {test_namespace}")
    
    # Test text
    test_text = """
    # Nova Embedding and Vector Storage Test

    This is a test document for the Nova embedding and vector storage system.
    
    It contains multiple paragraphs to test the chunking functionality.
    Each paragraph should be properly chunked according to size parameters.
    
    The document should be:
    1. Chunked into segments
    2. Embedded using the embedding service
    3. Stored in the vector database
    4. Retrieved via search
    
    If all steps complete successfully, the embedding and vector storage pipeline is working correctly.
    """
    
    try:
        # Step 1: Chunk the text
        print("\n[Step 1] Chunking text...")
        chunks = chunk_text(test_text, chunk_size=200, overlap=50)
        print(f"Created {len(chunks)} chunks from the text")
        
        for i, chunk in enumerate(chunks):
            print(f"  Chunk {i+1} ({len(chunk)} chars): {chunk[:50]}...")
        
        # Step 2: Generate embeddings
        print("\n[Step 2] Generating embeddings...")
        start_time = time.time()
        embeddings = await embedding_service.generate_embeddings(chunks)
        
        if not embeddings or len(embeddings) != len(chunks):
            print(f"ERROR: Expected {len(chunks)} embeddings, but got {len(embeddings) if embeddings else 0}")
            return False
        
        print(f"Generated {len(embeddings)} embeddings in {time.time() - start_time:.2f} seconds")
        print(f"First embedding dimension: {len(embeddings[0])}")
        
        # Step 3: Store embeddings in vector database
        print("\n[Step 3] Storing embeddings in vector database...")
        metadata_base = {
            "document_id": document_id,
            "file_name": "test_document.txt",
            "test": True
        }
        
        result = await vector_service.upsert_embeddings_with_metadata(
            embeddings=embeddings,
            texts=chunks,
            metadata_base=metadata_base,
            namespace=test_namespace
        )
        
        print(f"Upsert result: {result}")
        
        # Step 4: Get vector store stats
        print("\n[Step 4] Checking vector store stats...")
        stats = await vector_service.describe_index_stats()
        
        if stats and "namespaces" in stats:
            namespaces = stats["namespaces"]
            if test_namespace in namespaces:
                vector_count = namespaces[test_namespace].get("vector_count", 0)
                print(f"Found {vector_count} vectors in namespace: {test_namespace}")
            else:
                print(f"Namespace {test_namespace} not found in vector store")
                return False
        else:
            print("No namespace data available in vector store stats")
            return False
        
        # Step 5: Test search functionality
        print("\n[Step 5] Testing search functionality...")
        query = "vector storage pipeline"
        
        print(f"Generating embedding for query: '{query}'")
        query_embedding = await embedding_service.generate_single_embedding(query)
        print(f"Query embedding dimension: {len(query_embedding)}")
        
        print(f"Searching for vectors in namespace '{test_namespace}'...")
        search_results = await vector_service.search_by_embedding(
            embedding=query_embedding,
            top_k=2,
            namespace=test_namespace
        )
        
        if search_results:
            print(f"Search returned {len(search_results)} results:")
            for i, result in enumerate(search_results):
                print(f"  {i+1}. Score: {result['score']:.4f}")
                print(f"     Text: {result['text'][:100]}...")
        else:
            print("No search results found")
            return False
        
        # Step 6: Clean up
        print("\n[Step 6] Cleaning up test vectors...")
        await vector_service.delete_document_vectors(
            document_id=document_id,
            namespace=test_namespace
        )
        print("Test vectors deleted")
        
        # Verify deletion
        stats_after = await vector_service.describe_index_stats()
        if test_namespace in stats_after.get("namespaces", {}):
            count = stats_after["namespaces"][test_namespace].get("vector_count", 0)
            if count > 0:
                print(f"WARNING: Namespace {test_namespace} still exists with {count} vectors")
            else:
                print(f"Namespace {test_namespace} has been emptied")
        else:
            print(f"Namespace {test_namespace} successfully removed")
        
        print("\nEmbedding and vector storage test completed successfully!")
        return True
        
    except Exception as e:
        print(f"ERROR in embedding and vector storage test: {e}")
        return False

if __name__ == "__main__":
    try:
        asyncio.run(test_embedding_and_vector_storage())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}") 