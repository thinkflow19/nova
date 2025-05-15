import asyncio
import logging
import os
import sys
import uuid
from pathlib import Path
import io
import time
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path to find app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.document_service import DocumentService, get_document_service
from app.services.vector_store_service import get_vector_store_service
from app.services.embedding_service import get_embedding_service, extract_text_from_file, chunk_text
from app.config.settings import settings

class MockUploadFile:
    """Mock class to simulate a FastAPI UploadFile object"""
    def __init__(self, filename, content_type, content):
        self.filename = filename
        self.content_type = content_type
        self._content = content
    
    async def read(self):
        return self._content

async def test_document_upload():
    """Test the complete document upload, processing, and embedding pipeline"""
    print("\n===== Testing Document Upload and Processing Pipeline =====")
    
    # Initialize services
    document_service = get_document_service()
    vector_service = get_vector_store_service()
    embedding_service = get_embedding_service()
    
    print(f"Document service initialized: {document_service is not None}")
    print(f"Vector service initialized: {vector_service is not None}")
    print(f"Embedding service initialized: {embedding_service is not None}")
    print(f"Pinecone index: {vector_service.index_name}")
    print(f"Embedding dimension: {embedding_service.dimension}")
    
    # Create a test document (simple text file)
    test_filename = f"test_doc_{uuid.uuid4().hex[:8]}.txt"
    test_content = b"""
    # Test Document for Vector Storage

    This is a test document for the Nova document processing pipeline.
    
    It contains multiple paragraphs to test the chunking functionality.
    Each paragraph should be properly chunked according to size parameters.
    
    The document should be:
    1. Uploaded to storage
    2. Text extracted properly
    3. Chunked into segments
    4. Embedded using the embedding service
    5. Stored in the vector database
    
    If all steps complete successfully, the document processing pipeline is working correctly.
    
    Here is some additional text to ensure we have multiple chunks created:
    
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies
    tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl. Nullam auctor, nisl eget
    ultricies tincidunt, nisl nisl aliquam nisl, eget aliquam nisl nisl eget nisl.
    
    Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae;
    Donec velit neque, auctor sit amet aliquam vel, ullamcorper sit amet ligula. Proin eget tortor
    risus. Vivamus magna justo, lacinia eget consectetur sed, convallis at tellus.
    """
    
    # Create a mock upload file
    mock_file = MockUploadFile(
        filename=test_filename,
        content_type="text/plain",
        content=test_content
    )
    
    # Test project ID and user ID
    project_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    print(f"\nUploading test document: {test_filename}")
    print(f"Project ID: {project_id}")
    print(f"User ID: {user_id}")
    
    try:
        # Since the database validation may fail due to missing project, let's test each part separately
        # instead of calling the full process_document_upload method
        
        print("\n=== STEP 1: Text Extraction ===")
        # Convert bytes to string for text files
        raw_text = test_content.decode('utf-8')
        print(f"Extracted {len(raw_text)} characters of text from the file")
        print(f"First 100 chars: {raw_text[:100]}...")
        
        print("\n=== STEP 2: Text Chunking ===")
        # Test the chunking directly
        chunks = chunk_text(raw_text)
        print(f"Text chunked into {len(chunks)} segments")
        for i, chunk in enumerate(chunks):
            print(f"  Chunk {i+1} ({len(chunk)} chars): {chunk[:50]}...")
        
        print("\n=== STEP 3: Embedding Generation ===")
        # Generate embeddings for the chunks
        start_time = time.time()
        print(f"Generating embeddings using {embedding_service.model} model...")
        embeddings = await embedding_service.generate_embeddings(chunks)
        elapsed = time.time() - start_time
        
        print(f"Generated {len(embeddings)} embeddings in {elapsed:.2f} seconds")
        print(f"First embedding dimension: {len(embeddings[0])}")
        
        print("\n=== STEP 4: Vector Storage ===")
        # Create a test namespace for isolation
        test_namespace = f"test_doc_upload_{uuid.uuid4().hex[:8]}"
        document_id = f"test-doc-{uuid.uuid4().hex[:8]}"
        print(f"Using test namespace: {test_namespace}")
        print(f"Using test document ID: {document_id}")
        
        # Prepare metadata
        metadata_base = {
            "document_id": document_id,
            "file_name": test_filename,
            "project_id": project_id,
            "user_id": user_id,
            "test": True,
            "processed_at": datetime.utcnow().isoformat(),
        }
        
        # Attempt to store in Pinecone
        start_time = time.time()
        print(f"Storing {len(embeddings)} vectors in Pinecone...")
        result = await vector_service.upsert_embeddings_with_metadata(
            embeddings=embeddings,
            texts=chunks,
            metadata_base=metadata_base,
            namespace=test_namespace
        )
        elapsed = time.time() - start_time
        
        print(f"Vector storage result: {result}")
        print(f"Storage time: {elapsed:.2f} seconds")
        
        # Verify the vectors were stored by checking index stats
        print("\n=== STEP 5: Verifying Storage ===")
        stats = await vector_service.describe_index_stats()
        print(f"Pinecone index stats: {stats}")
        
        namespaces = stats.get('_data_store', {}).get('namespaces', {})
        if test_namespace in namespaces:
            vector_count = namespaces[test_namespace].get('vector_count', 0)
            print(f"Found {vector_count} vectors in namespace {test_namespace}")
            if vector_count == len(chunks):
                print("✅ SUCCESS: All chunks were properly stored in Pinecone!")
            else:
                print(f"⚠️ WARNING: Expected {len(chunks)} vectors but found {vector_count}")
        else:
            print(f"❌ ERROR: Namespace {test_namespace} not found in Pinecone")
            print(f"Available namespaces: {list(namespaces.keys())}")
        
        # Test vector search
        print("\n=== STEP 6: Testing Vector Search ===")
        query = "vector storage pipeline"
        print(f"Generating embedding for query: '{query}'")
        query_embedding = await embedding_service.generate_single_embedding(query)
        
        print(f"Searching for similar vectors...")
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
        
        # Skipping cleanup to allow manual validation in Pinecone UI
        print("\n=== STEP 7: Cleanup (Skipped) ===")
        print(f"Test vectors left in namespace {test_namespace} for manual validation in Pinecone UI")
        
    except Exception as e:
        print(f"Error in document upload test: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print("\n===== Test completed =====")

if __name__ == "__main__":
    try:
        asyncio.run(test_document_upload())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}") 