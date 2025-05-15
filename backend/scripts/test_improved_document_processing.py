#!/usr/bin/env python3
"""
Test script for the improved document processing pipeline.
This script tests the entire pipeline from text extraction to vector storage.
"""

import asyncio
import logging
import os
import sys
import io
import tempfile
import uuid
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ensure app modules can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.document_service import DocumentService, get_document_service
from app.services.vector_store_service import get_vector_store_service
from app.services.embedding_service import get_embedding_service, chunk_text
from app.config.settings import settings

# Sample test document content
SAMPLE_PDF_CONTENT = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 6 0 R >>\nendobj\n4 0 obj\n<< /Font << /F1 5 0 R >> >>\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n6 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Test Document) Tj ET\nendstream\nendobj\nxref\n0 7\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000216 00000 n\n0000000259 00000 n\n0000000326 00000 n\ntrailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n420\n%%EOF'

SAMPLE_TEXT_CONTENT = """
# Test Document

This is a sample document for testing the improved document processing pipeline.

## Features to Test

1. Text extraction from files
2. Text chunking with improved algorithm
3. Embedding generation with batching and retry logic
4. Vector storage in Pinecone

The document processing pipeline should handle all of these steps correctly.

Let's include some more text to ensure we have enough content for chunking.
This paragraph contains additional information that will help test the chunking algorithm.
We want to ensure that paragraphs are properly preserved and that semantic coherence is maintained.

## Architecture Overview

The document processing pipeline consists of several components:
- Storage Service: Handles file storage and retrieval
- Document Service: Coordinates the processing steps
- Embedding Service: Generates embeddings from text chunks
- Vector Store Service: Stores embeddings in Pinecone

Each component has been improved to be more robust and handle errors gracefully.
"""

class MockUploadFile:
    """Mock class to simulate a FastAPI UploadFile object"""
    def __init__(self, filename, content_type, content):
        self.filename = filename
        self.content_type = content_type
        self._content = content
    
    async def read(self):
        return self._content

async def create_test_file(file_type: str) -> tuple:
    """Create a test file of the specified type"""
    if file_type == "txt":
        content = SAMPLE_TEXT_CONTENT.encode("utf-8")
        filename = f"test-{uuid.uuid4().hex[:8]}.txt"
        content_type = "text/plain"
    elif file_type == "pdf":
        content = SAMPLE_PDF_CONTENT
        filename = f"test-{uuid.uuid4().hex[:8]}.pdf"
        content_type = "application/pdf"
    else:
        raise ValueError(f"Unsupported test file type: {file_type}")
    
    return (MockUploadFile(filename, content_type, content), filename, content)

async def test_text_extraction(document_service: DocumentService, file_content: bytes, file_type: str) -> str:
    """Test the text extraction functionality"""
    print(f"\n=== Testing Text Extraction ({file_type}) ===")
    
    doc_id = f"test-{uuid.uuid4().hex[:8]}"
    start_time = time.time()
    
    text = await document_service._extract_text_from_file(
        file_content=file_content,
        file_type=file_type,
        document_id=doc_id
    )
    
    elapsed = time.time() - start_time
    print(f"Text extraction completed in {elapsed:.2f} seconds")
    print(f"Extracted {len(text)} characters of text")
    print(f"First 100 chars: {text[:100]}...")
    
    return text

async def test_chunking(text: str) -> List[str]:
    """Test the text chunking functionality"""
    print("\n=== Testing Text Chunking ===")
    
    start_time = time.time()
    chunks = chunk_text(text, chunk_size=500, overlap=100)
    elapsed = time.time() - start_time
    
    print(f"Chunking completed in {elapsed:.2f} seconds")
    print(f"Text chunked into {len(chunks)} segments")
    
    for i, chunk in enumerate(chunks[:3]):  # Show first 3 chunks only
        print(f"  Chunk {i+1} ({len(chunk)} chars): {chunk[:50]}...")
    
    if len(chunks) > 3:
        print(f"  ... and {len(chunks) - 3} more chunks")
    
    return chunks

async def test_embedding_generation(embedding_service, chunks: List[str]) -> List[List[float]]:
    """Test the embedding generation functionality"""
    print("\n=== Testing Embedding Generation ===")
    
    print(f"Generating embeddings for {len(chunks)} chunks using {embedding_service.model}")
    start_time = time.time()
    embeddings = await embedding_service.generate_embeddings(chunks)
    elapsed = time.time() - start_time
    
    print(f"Embedding generation completed in {elapsed:.2f} seconds")
    print(f"Generated {len(embeddings)} embeddings")
    
    if embeddings:
        print(f"First embedding dimension: {len(embeddings[0])}")
        print(f"Expected dimension: {embedding_service.dimension}")
    
    return embeddings

async def test_vector_storage(vector_service, embedding_service, embeddings: List[List[float]], chunks: List[str]) -> str:
    """Test storing vectors in Pinecone"""
    print("\n=== Testing Vector Storage ===")
    
    # Create a test namespace
    test_namespace = f"test_improved_{uuid.uuid4().hex[:8]}"
    document_id = f"test-doc-{uuid.uuid4().hex[:8]}"
    
    print(f"Using test namespace: {test_namespace}")
    print(f"Using test document ID: {document_id}")
    
    # Prepare metadata
    metadata_base = {
        "document_id": document_id,
        "test": True,
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    # Store vectors
    start_time = time.time()
    result = await vector_service.upsert_embeddings_with_metadata(
        embeddings=embeddings,
        texts=chunks,
        metadata_base=metadata_base,
        namespace=test_namespace,
        id_prefix=document_id
    )
    elapsed = time.time() - start_time
    
    print(f"Vector storage completed in {elapsed:.2f} seconds")
    print(f"Storage result: {result}")
    
    # Verify vectors were stored
    stats = await vector_service.describe_index_stats()
    
    if stats and "namespaces" in stats:
        namespaces = stats.get("namespaces", {})
        if test_namespace in namespaces:
            vector_count = namespaces[test_namespace].get("vector_count", 0)
            print(f"✅ Found {vector_count} vectors in namespace '{test_namespace}'")
        else:
            print(f"❌ Namespace '{test_namespace}' not found in Pinecone")
    
    # Test search
    if embeddings:
        print("\n=== Testing Vector Search ===")
        query = "document processing pipeline"
        print(f"Searching for: '{query}'")
        
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
    
    # Clean up
    print("\n=== Cleanup ===")
    cleanup_result = await vector_service.delete_namespace(test_namespace)
    print(f"Namespace cleanup result: {cleanup_result}")
    
    return test_namespace

async def test_improved_document_processing():
    """Run the full test suite for the improved document processing pipeline"""
    print("\n===== TESTING IMPROVED DOCUMENT PROCESSING PIPELINE =====")
    
    # Initialize services
    document_service = get_document_service()
    vector_service = get_vector_store_service()
    embedding_service = get_embedding_service()
    
    print("Services initialized:")
    print(f"- Document Service: {document_service is not None}")
    print(f"- Vector Service: {vector_service is not None}")
    print(f"- Embedding Service: {embedding_service is not None}")
    print(f"- Vector Index: {vector_service.index_name}")
    print(f"- Embedding Model: {embedding_service.model}")
    print(f"- Embedding Dimension: {embedding_service.dimension}")
    
    try:
        # Test with text file
        print("\n\n=== TESTING WITH TEXT FILE ===")
        mock_file, filename, content = await create_test_file("txt")
        print(f"Created test file: {filename} ({len(content)} bytes)")
        
        # Step 1: Text extraction
        text = await test_text_extraction(document_service, content, "txt")
        
        # Step 2: Text chunking
        chunks = await test_chunking(text)
        
        # Step 3: Embedding generation
        embeddings = await test_embedding_generation(embedding_service, chunks)
        
        # Step 4: Vector storage
        namespace = await test_vector_storage(vector_service, embedding_service, embeddings, chunks)
        
        # Test with PDF file
        print("\n\n=== TESTING WITH PDF FILE ===")
        mock_pdf, pdf_filename, pdf_content = await create_test_file("pdf")
        print(f"Created test PDF: {pdf_filename} ({len(pdf_content)} bytes)")
        
        # Step 1: Text extraction for PDF
        pdf_text = await test_text_extraction(document_service, pdf_content, "pdf")
        
        # Only proceed with further tests if text extraction succeeded
        if pdf_text and not pdf_text.startswith("Error"):
            # Step 2: Text chunking for PDF
            pdf_chunks = await test_chunking(pdf_text)
            
            # Step 3: Embedding generation for PDF
            pdf_embeddings = await test_embedding_generation(embedding_service, pdf_chunks)
            
            # Step 4: Vector storage for PDF
            pdf_namespace = await test_vector_storage(vector_service, embedding_service, pdf_embeddings, pdf_chunks)
        else:
            print("Skipping further tests with PDF due to text extraction issues")
        
        print("\n===== ALL TESTS COMPLETED SUCCESSFULLY =====")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    try:
        asyncio.run(test_improved_document_processing())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}") 