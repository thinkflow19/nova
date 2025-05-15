#!/usr/bin/env python
"""
Script to verify document upload and vector storage
"""
import sys
import os
import asyncio
import logging
from pprint import pprint
import uuid

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config.settings import settings
from app.services.database_service import DatabaseService
from app.services.storage_service import get_storage_service
from app.services.vector_store_service import get_vector_store_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_document(document_id=None, project_id=None):
    """Verify document upload and vector storage."""
    try:
        # Initialize services
        db_service = DatabaseService()
        storage_service = get_storage_service()
        vector_service = get_vector_store_service()
        
        # If document_id is provided, verify that document
        if document_id:
            logger.info(f"Verifying document with ID: {document_id}")
            
            # Check document in database
            document = await db_service.get_document(document_id)
            logger.info("Document record in database:")
            pprint(document)
            
            # Check document in storage
            storage_path = document.get("storage_path")
            storage_bucket = document.get("storage_bucket")
            if storage_path and storage_bucket:
                logger.info(f"Checking document in storage: {storage_bucket}/{storage_path}")
                
                # Get file metadata
                try:
                    content = await storage_service.get_document(
                        path=storage_path,
                        bucket=storage_bucket
                    )
                    if content:
                        logger.info(f"✅ Document exists in storage ({len(content)} bytes)")
                    else:
                        logger.warning("❌ Document not found in storage")
                except Exception as e:
                    logger.error(f"Error checking storage: {str(e)}")
            
            # Check vectors in Pinecone
            namespace = document.get("pinecone_namespace")
            if namespace:
                logger.info(f"Checking vectors in namespace: {namespace}")
                
                # Get vector count
                try:
                    stats = await vector_service.get_namespace_stats(namespace)
                    logger.info("Pinecone namespace stats:")
                    pprint(stats)
                    
                    # If vectors exist, fetch a sample
                    if stats.get("vector_count", 0) > 0:
                        logger.info(f"✅ Vectors exist in Pinecone ({stats.get('vector_count')} vectors)")
                        
                        # Fetch vectors by document ID
                        try:
                            vectors = await vector_service.fetch_by_metadata(
                                {"document_id": document_id},
                                namespace=namespace,
                                limit=5
                            )
                            logger.info(f"Found {len(vectors)} vectors for document:")
                            for i, vector in enumerate(vectors):
                                logger.info(f"Vector {i+1} metadata:")
                                pprint(vector.get("metadata", {}))
                        except Exception as e:
                            logger.error(f"Error fetching vectors: {str(e)}")
                    else:
                        logger.warning("❌ No vectors found in Pinecone for this document")
                except Exception as e:
                    logger.error(f"Error checking Pinecone: {str(e)}")
        
        # If project_id is provided, list all documents in the project
        elif project_id:
            logger.info(f"Listing documents for project: {project_id}")
            
            # Get documents from database
            documents = await db_service.list_documents(project_id, limit=100)
            logger.info(f"Found {len(documents)} documents in project")
            
            # Print document summary
            for i, doc in enumerate(documents):
                logger.info(f"Document {i+1}: {doc.get('name')} (ID: {doc.get('id')}, Status: {doc.get('status')})")
        
        # If no document_id or project_id provided, print usage
        else:
            logger.info("Please provide either a document_id or project_id")
            logger.info("Usage: python verify_document_pipeline.py --document_id <document_id>")
            logger.info("   or: python verify_document_pipeline.py --project_id <project_id>")
    
    except Exception as e:
        logger.error(f"Error verifying document: {str(e)}")
        raise

if __name__ == "__main__":
    import argparse
    
    # Parse arguments
    parser = argparse.ArgumentParser(description="Verify document upload and vector storage")
    parser.add_argument("--document_id", help="Document ID to verify")
    parser.add_argument("--project_id", help="Project ID to list documents for")
    args = parser.parse_args()
    
    # Run the verification
    asyncio.run(verify_document(document_id=args.document_id, project_id=args.project_id)) 