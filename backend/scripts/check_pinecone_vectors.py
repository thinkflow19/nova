#!/usr/bin/env python
"""
Script to check Pinecone for vectors directly
"""
import sys
import os
import asyncio
import logging
from pprint import pprint

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config.settings import settings
from app.services.vector_store_service import get_vector_store_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def check_pinecone_vectors(user_id=None, project_id=None, document_id=None):
    """Check vectors in Pinecone directly."""
    try:
        # Initialize vector service
        vector_service = get_vector_store_service()
        
        logger.info(f"Connected to Pinecone index: {settings.PINECONE_INDEX}")
        
        # If document_id provided, check vectors for document
        if document_id:
            # We need to query vectors with document_id metadata filter
            logger.info(f"Checking vectors for document: {document_id}")
            
            try:
                # Try in both namespace types
                for ns_type in ["user_8ea670d5-7a3c-44c0-8f77-9c8da99811df", "doc_" + document_id]:
                    try:
                        filter_dict = {"document_id": document_id}
                        logger.info(f"Searching in namespace {ns_type} with filter: {filter_dict}")
                        
                        # Use dummy query vector (all zeros) since we just want to filter by metadata
                        dummy_vector = [0.0] * settings.EMBEDDING_DIMENSION
                        results = await vector_service.search(
                            query_embedding=dummy_vector,
                            filter_dict=filter_dict,
                            namespaces=[ns_type],
                            top_k=5
                        )
                        
                        if results:
                            logger.info(f"Found {len(results)} vectors for document {document_id} in namespace {ns_type}")
                            for i, result in enumerate(results[:5]):
                                logger.info(f"Vector {i+1} metadata:")
                                pprint(result.get("metadata", {}))
                        else:
                            logger.warning(f"No vectors found for document {document_id} in namespace {ns_type}")
                    except Exception as e:
                        logger.error(f"Error checking document in namespace {ns_type}: {str(e)}")
            except Exception as e:
                logger.error(f"Error checking document vectors: {str(e)}")
        
        # If user_id provided, check vectors for user
        if user_id:
            namespace = f"user_{user_id}"
            logger.info(f"Checking for any vectors in namespace: {namespace}")
            
            try:
                # Use dummy query vector (all zeros) and namespace filter
                dummy_vector = [0.0] * settings.EMBEDDING_DIMENSION
                results = await vector_service.search(
                    query_embedding=dummy_vector,
                    namespaces=[namespace],
                    top_k=5
                )
                
                if results:
                    logger.info(f"Found {len(results)} vectors in namespace {namespace}")
                    for i, result in enumerate(results[:5]):
                        logger.info(f"Vector {i+1} metadata:")
                        pprint(result.get("metadata", {}))
                else:
                    logger.warning(f"No vectors found in namespace {namespace}")
            except Exception as e:
                logger.error(f"Error checking namespace {namespace}: {str(e)}")
        
        # If project_id provided, check vectors for project
        if project_id:
            project_namespace = f"project_{project_id}"
            logger.info(f"Checking vectors in namespace for project: {project_namespace}")
            
            try:
                # Use dummy query vector (all zeros) and project namespace
                dummy_vector = [0.0] * settings.EMBEDDING_DIMENSION
                results = await vector_service.search(
                    query_embedding=dummy_vector,
                    namespaces=[project_namespace],
                    top_k=5
                )
                
                if results:
                    logger.info(f"Found {len(results)} vectors in namespace {project_namespace}")
                    for i, result in enumerate(results[:5]):
                        logger.info(f"Vector {i+1} metadata:")
                        pprint(result.get("metadata", {}))
                else:
                    logger.warning(f"No vectors found in namespace {project_namespace}")
            except Exception as e:
                logger.error(f"Error checking project namespace: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error checking Pinecone vectors: {str(e)}")
        raise

if __name__ == "__main__":
    import argparse
    
    # Parse arguments
    parser = argparse.ArgumentParser(description="Check vectors in Pinecone directly")
    parser.add_argument("--user_id", help="User ID to check vectors for")
    parser.add_argument("--project_id", help="Project ID to check vectors for")
    parser.add_argument("--document_id", help="Document ID to check vectors for")
    args = parser.parse_args()
    
    # Run the check
    asyncio.run(check_pinecone_vectors(
        user_id=args.user_id,
        project_id=args.project_id,
        document_id=args.document_id
    )) 