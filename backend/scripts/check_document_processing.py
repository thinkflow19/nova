#!/usr/bin/env python3
"""
Script to check document processing status and verify vectors are stored in Pinecone.
This script helps debug issues with the document upload and processing pipeline.
"""

import asyncio
import os
import sys
import logging
from typing import List, Dict, Any, Optional
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.database_service import DatabaseService
from app.services.vector_store_service import get_vector_store_service
from app.services.embedding_service import get_embedding_service
from app.services.document_service import get_document_service
from app.config.settings import settings

async def check_document_processing():
    """Check if documents have been correctly processed and stored in Pinecone"""
    print("\n===== Checking Document Processing Pipeline =====")
    
    # Initialize services
    db_service = DatabaseService()
    vector_service = get_vector_store_service()
    
    print(f"Database service initialized: {db_service is not None}")
    print(f"Vector service initialized: {vector_service is not None}")
    print(f"Pinecone index: {vector_service.index_name}")
    
    try:
        # Get all documents from database
        print("\n=== STEP 1: Checking Documents in Database ===")
        
        # Use direct SQL query for documents since we don't have get_all_documents
        documents = []
        try:
            # Try using a direct SQL query to get recent documents
            sql_query = """
            SELECT * FROM documents 
            ORDER BY created_at DESC 
            LIMIT 20
            """
            
            print("Executing SQL query to get recent documents...")
            recent_docs = await db_service.execute_sql(sql_query)
            if recent_docs:
                print(f"Found {len(recent_docs)} recent documents using SQL")
                documents = recent_docs
            else:
                print("No documents found with SQL query.")
                
                # Try alternative approach - use list_documents with a dummy project_id
                print("Trying to find any documents regardless of project...")
                
                # Get list of projects first 
                try:
                    projects_query = "SELECT id FROM projects LIMIT 10"
                    projects = await db_service.execute_sql(projects_query)
                    
                    if projects:
                        print(f"Found {len(projects)} projects")
                        for project in projects:
                            project_id = project.get("id")
                            if project_id:
                                print(f"Checking documents for project: {project_id}")
                                project_docs = await db_service.list_documents(project_id)
                                if project_docs:
                                    documents.extend(project_docs)
                                    print(f"Found {len(project_docs)} documents for project {project_id}")
                    else:
                        print("No projects found in database.")
                except Exception as proj_err:
                    print(f"Error getting projects: {proj_err}")
        
        except Exception as db_err:
            print(f"Error querying documents: {db_err}")
            print(f"Exception type: {type(db_err).__name__}")
            print("Continuing with other checks...")
        
        if documents:
            print(f"Found {len(documents)} documents in the database:")
            for i, doc in enumerate(documents):
                doc_id = doc.get("id")
                status = doc.get("status", "unknown")
                name = doc.get("name", "Unnamed")
                created_at = doc.get("created_at", "Unknown date")
                pinecone_ns = doc.get("pinecone_namespace")
                project_id = doc.get("project_id", "unknown")
                
                print(f"  {i+1}. Document: {name}")
                print(f"     ID: {doc_id}")
                print(f"     Project ID: {project_id}")
                print(f"     Status: {status}")
                print(f"     Created: {created_at}")
                print(f"     Pinecone namespace: {pinecone_ns or 'Not set'}")
                
                # Check if document is in Pinecone
                if doc_id:
                    namespace = f"doc_{doc_id}"
                    print(f"\n=== STEP 2: Checking Document {doc_id} in Pinecone ===")
                    stats = await vector_service.describe_index_stats()
                    
                    if stats and "namespaces" in stats:
                        namespaces = stats.get("namespaces", {})
                        if namespace in namespaces:
                            vector_count = namespaces[namespace].get("vector_count", 0)
                            print(f"✅ Found {vector_count} vectors for document in namespace '{namespace}'")
                        else:
                            print(f"❌ Document namespace '{namespace}' not found in Pinecone")
                            print(f"   Available namespaces: {list(namespaces.keys())}")
                    else:
                        print("No namespaces found in Pinecone.")
                    
                    # If document is marked as failed, show error
                    if status == "failed":
                        error = doc.get("processing_error", "No error message available")
                        print(f"❌ Document processing failed: {error}")
                
                print("\n---")
        else:
            print("No documents found in the database.")
        
        # Check all available namespaces in Pinecone
        print("\n=== STEP 3: All Namespaces in Pinecone ===")
        stats = await vector_service.describe_index_stats()
        all_namespaces = stats.get("namespaces", {})
        
        if all_namespaces:
            print(f"Found {len(all_namespaces)} namespaces in Pinecone:")
            for ns, ns_data in all_namespaces.items():
                vector_count = ns_data.get("vector_count", 0)
                print(f"  - {ns}: {vector_count} vectors")
                
                # If namespace starts with doc_, try to match it to a document
                if ns.startswith("doc_"):
                    doc_id = ns[4:]  # Remove 'doc_' prefix
                    print(f"    This appears to be for document ID: {doc_id}")
                    
                    # Try to verify if this document exists in the database
                    try:
                        doc = await db_service.get_document(doc_id)
                        if doc:
                            print(f"    ✅ Matched to document: {doc.get('name', 'Unnamed')}")
                        else:
                            print(f"    ❓ No matching document found in database")
                    except:
                        print(f"    ❓ Could not query document {doc_id}")
        else:
            print("No namespaces found in Pinecone index.")
            
        # Print overall index stats
        print("\n=== STEP 4: Pinecone Index Stats ===")
        print(f"Index dimension: {stats.get('dimension')}")
        print(f"Total vector count: {stats.get('total_vector_count')}")
        print(f"Index fullness: {stats.get('index_fullness')}")
        
        # Add manual testing option
        print("\n=== STEP 5: Manual Testing ===")
        print("Do you want to test querying a specific document? (y/n)")
        choice = input("> ").strip().lower()
        
        if choice == 'y':
            if not documents:
                print("No document IDs available. Please enter a document ID manually:")
                doc_id = input("> ").strip()
            else:
                print("\nAvailable document IDs:")
                for i, doc in enumerate(documents):
                    print(f"{i+1}. {doc.get('id')} - {doc.get('name', 'Unnamed')}")
                
                print("\nEnter document number or ID to test:")
                doc_input = input("> ").strip()
                
                # Check if input is a number (index) or a uuid (direct ID)
                try:
                    idx = int(doc_input) - 1
                    if 0 <= idx < len(documents):
                        doc_id = documents[idx].get('id')
                    else:
                        print("Invalid document number")
                        doc_id = None
                except ValueError:
                    # Not a number, assume it's an ID
                    doc_id = doc_input
            
            if doc_id:
                namespace = f"doc_{doc_id}"
                print(f"Using namespace: {namespace}")
                
                print("\nEnter a search query:")
                query = input("> ").strip()
                
                if query:
                    # Get embedding service
                    embedding_service = get_embedding_service()
                    print(f"Generating embedding for query: '{query}'")
                    query_embedding = await embedding_service.generate_single_embedding(query)
                    
                    print(f"Searching for similar content...")
                    search_results = await vector_service.search_by_embedding(
                        embedding=query_embedding,
                        top_k=3,
                        namespace=namespace
                    )
                    
                    if search_results:
                        print(f"Search returned {len(search_results)} results:")
                        for i, result in enumerate(search_results):
                            print(f"  {i+1}. Score: {result['score']:.4f}")
                            print(f"     Text: {result['text'][:100]}...")
                    else:
                        print("No search results found")
    
    except Exception as e:
        print(f"Error checking document processing: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n===== Check completed =====")

if __name__ == "__main__":
    try:
        asyncio.run(check_document_processing())
    except KeyboardInterrupt:
        print("\nCheck interrupted by user")
    except Exception as e:
        print(f"Check failed with error: {e}") 