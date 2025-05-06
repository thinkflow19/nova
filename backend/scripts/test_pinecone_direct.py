#!/usr/bin/env python3
"""
Direct test script for Pinecone API to ensure the connection is working properly.
This script bypasses the application services and connects to Pinecone directly.
"""

import os
import logging
import json
import pinecone
from dotenv import load_dotenv
import asyncio
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_pinecone_direct():
    """Test Pinecone API directly"""
    print("\n===== Testing Pinecone API Directly =====")
    
    # Load environment variables
    load_dotenv()
    
    # Get Pinecone credentials from environment
    api_key = os.environ.get("PINECONE_API_KEY")
    if not api_key:
        print("ERROR: PINECONE_API_KEY environment variable not set")
        return False
    
    print(f"Using Pinecone API key: {api_key[:5]}...{api_key[-5:]}")
    index_name = os.environ.get("PINECONE_INDEX", "proj")
    print(f"Using index name: {index_name}")
    
    try:
        # Initialize Pinecone client
        print("\nInitializing Pinecone client...")
        pc = pinecone.Pinecone(api_key=api_key)
        
        # List available indexes
        print("Listing Pinecone indexes...")
        indexes = pc.list_indexes()
        
        # Extract index names based on the response format
        try:
            # Handle response as list of dictionaries
            if isinstance(indexes, list) and isinstance(indexes[0], dict):
                index_names = [idx.get('name') for idx in indexes]
            # Handle response as list of objects with name attribute
            elif hasattr(indexes[0], 'name'):
                index_names = [idx.name for idx in indexes]
            # Handle direct list of strings
            elif isinstance(indexes, list) and isinstance(indexes[0], str):
                index_names = indexes
            else:
                # Try to convert to JSON for inspection
                print(f"Unexpected index format: {json.dumps(indexes, default=str)}")
                index_names = []
        except Exception as format_err:
            # Manual extraction as fallback
            print(f"Error parsing indexes: {format_err}")
            if isinstance(indexes, str):
                # Try to parse JSON string
                try:
                    index_data = json.loads(indexes)
                    if isinstance(index_data, list):
                        index_names = [idx.get('name') for idx in index_data if isinstance(idx, dict) and 'name' in idx]
                    else:
                        index_names = []
                except:
                    index_names = []
            else:
                # Just stringify and report
                print(f"Raw indexes response: {str(indexes)}")
                index_names = []
                
        print(f"Available indexes: {index_names}")
        
        if index_name not in index_names:
            print(f"WARNING: Index '{index_name}' not found in list. Trying to connect anyway...")
        
        # Connect to the index anyway (sometimes list_indexes doesn't parse correctly)
        try:
            print(f"\nConnecting to index '{index_name}'...")
            index = pc.Index(index_name)
            
            # Get index stats
            print("Getting index stats...")
            stats = index.describe_index_stats()
            print(f"Index stats: {stats}")
            
            # Extract dimension from stats
            dimension = stats.get('dimension', 1024)
            print(f"Index dimension: {dimension}")
            
            # Create a test namespace
            test_namespace = f"test_direct_{os.urandom(4).hex()}"
            print(f"\nCreating test namespace: {test_namespace}")
            
            # Create random vectors for testing
            print("Creating test vectors...")
            num_vectors = 3
            test_vectors = []
            
            for i in range(num_vectors):
                # Generate random vector with the right dimension
                vector = np.random.rand(dimension).tolist()
                
                # Create a vector entry
                vector_entry = {
                    "id": f"test-vector-{i}",
                    "values": vector,
                    "metadata": {
                        "text": f"This is test vector {i}",
                        "test": True
                    }
                }
                test_vectors.append(vector_entry)
            
            # Upsert vectors
            print(f"Upserting {len(test_vectors)} vectors to namespace '{test_namespace}'...")
            result = index.upsert(vectors=test_vectors, namespace=test_namespace)
            print(f"Upsert result: {result}")
            
            # Query the vectors
            print("\nQuerying vectors...")
            query_result = index.query(
                vector=test_vectors[0]["values"],
                top_k=3,
                namespace=test_namespace,
                include_metadata=True
            )
            print(f"Query result: {query_result}")
            
            # Clean up
            print("\nCleaning up test vectors...")
            delete_result = index.delete(delete_all=True, namespace=test_namespace)
            print(f"Delete result: {delete_result}")
            
            # Verify deletion
            stats_after = index.describe_index_stats()
            print(f"Index stats after cleanup: {stats_after}")
            
            print("\nPinecone API test completed successfully!")
            return True
            
        except Exception as index_err:
            print(f"ERROR accessing index: {index_err}")
            return False
        
    except Exception as e:
        print(f"ERROR testing Pinecone API: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_pinecone_direct()) 