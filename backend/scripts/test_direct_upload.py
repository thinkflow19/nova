#!/usr/bin/env python3
"""
Direct test to upload a document to Pinecone without database interactions.
This helps isolate if the issue is with Pinecone or with the database/UI flow.
"""

import asyncio
import os
import sys
import logging
import uuid
import time
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vector_store_service import get_vector_store_service
from app.services.embedding_service import get_embedding_service, chunk_text
from app.config.settings import settings

async def direct_upload_test():
    """Test direct upload of text content to Pinecone"""
    print("\n===== Testing Direct Upload to Pinecone =====")
    
    # Initialize services
    vector_service = get_vector_store_service()
    embedding_service = get_embedding_service()
    
    print(f"Vector service initialized: {vector_service is not None}")
    print(f"Embedding service initialized: {embedding_service is not None}")
    print(f"Vector service connected to: {vector_service.index_name}")
    print(f"Embedding dimension: {embedding_service.dimension}")
    
    # Get the index dimension from the settings
    pinecone_dimension = settings.EMBEDDING_DIMENSION  # Use the setting value
    print(f"Pinecone expected dimension: {pinecone_dimension}")
    
    # Sample text content (could be from a file, but for testing we'll use direct text)
    test_text = """
    # Direct Upload to Pinecone Test

    This is a test document for verifying direct uploads to Pinecone.
    
    If this content shows up in Pinecone, then the basic embedding and vector storage 
    functionality is working correctly, and the issue is likely with the database 
    processing pipeline.
    
    We should be able to search for this content using keywords like:
    - Pinecone
    - direct upload
    - test document
    - embedding
    - vector storage
    
    This text will be chunked, embedded, and stored directly in Pinecone without 
    going through the database.
    """
    
    # Generate a unique ID for this test
    document_id = f"direct-test-{uuid.uuid4().hex[:8]}"
    test_namespace = f"direct_test_{uuid.uuid4().hex[:8]}"
    
    print(f"\nTest document ID: {document_id}")
    print(f"Test namespace: {test_namespace}")
    
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
        elapsed = time.time() - start_time
        
        if not embeddings:
            print("ERROR: Failed to generate embeddings")
            return
            
        print(f"Generated {len(embeddings)} embeddings in {elapsed:.2f} seconds")
        print(f"First embedding dimension: {len(embeddings[0])}")
        
        if len(embeddings[0]) != pinecone_dimension:
            print(f"WARNING: Embedding dimension ({len(embeddings[0])}) doesn't match expected Pinecone dimension ({pinecone_dimension})!")
            print("Will try to proceed anyway (embeddings may be resized automatically)...")
        
        # Step 3: Upload to Pinecone
        print("\n[Step 3] Uploading to Pinecone...")
        metadata_base = {
            "document_id": document_id,
            "source": "direct_test",
            "test": True,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        start_time = time.time()
        result = await vector_service.upsert_embeddings_with_metadata(
            embeddings=embeddings,
            texts=chunks,
            metadata_base=metadata_base,
            namespace=test_namespace
        )
        elapsed = time.time() - start_time
        
        print(f"Upload result: {result}")
        print(f"Upload took {elapsed:.2f} seconds")
        
        # Step 4: Verify upload
        print("\n[Step 4] Verifying upload...")
        stats = await vector_service.describe_index_stats()
        
        # Get the actual dimension from stats
        actual_dimension = stats.get('dimension')
        if actual_dimension:
            print(f"Actual Pinecone index dimension from stats: {actual_dimension}")
            if actual_dimension != pinecone_dimension:
                print(f"WARNING: Settings dimension ({pinecone_dimension}) doesn't match actual index dimension ({actual_dimension})")
        
        if stats and "namespaces" in stats:
            namespaces = stats.get("namespaces", {})
            if test_namespace in namespaces:
                vector_count = namespaces[test_namespace].get("vector_count", 0)
                print(f"✅ SUCCESS: Found {vector_count} vectors in namespace '{test_namespace}'")
                if vector_count != len(chunks):
                    print(f"WARNING: Expected {len(chunks)} vectors but found {vector_count}")
            else:
                print(f"ERROR: Namespace '{test_namespace}' not found in Pinecone")
                print(f"Available namespaces: {list(namespaces.keys())}")
        else:
            print("No namespaces found in Pinecone stats")
        
        # Step 5: Test search
        print("\n[Step 5] Testing search...")
        test_queries = [
            "direct upload to pinecone",
            "vector storage test",
            "database processing pipeline"
        ]
        
        for query in test_queries:
            print(f"\nSearching for: '{query}'")
            query_embedding = await embedding_service.generate_single_embedding(query)
            
            search_results = await vector_service.search_by_embedding(
                embedding=query_embedding,
                top_k=2,
                namespace=test_namespace
            )
            
            if search_results:
                print(f"Found {len(search_results)} results:")
                for i, result in enumerate(search_results):
                    print(f"  {i+1}. Score: {result['score']:.4f}")
                    print(f"     Text: {result['text'][:100]}...")
            else:
                print("No search results found")
        
        # Step 6: Clean up
        print("\n[Step 6] Cleaning up...")
        await vector_service.delete_document_vectors(
            document_id=document_id,
            namespace=test_namespace
        )
        
        # Verify deletion
        stats_after = await vector_service.describe_index_stats()
        if test_namespace in stats_after.get("namespaces", {}):
            remaining = stats_after["namespaces"][test_namespace].get("vector_count", 0)
            print(f"WARNING: Namespace {test_namespace} still exists with {remaining} vectors")
        else:
            print(f"✅ Successfully removed namespace {test_namespace}")
        
        print("\nDirect upload test completed successfully!")
        
    except Exception as e:
        print(f"ERROR in direct upload test: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n===== Test completed =====")

if __name__ == "__main__":
    try:
        asyncio.run(direct_upload_test())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}") 