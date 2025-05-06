import asyncio
import logging
import os
from app.services.embedding_service import get_embedding_service, chunk_text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_embedding_service():
    """Test the embedding service functionality"""
    print("\n===== Testing Embedding Service =====")
    
    # Initialize the embedding service
    embedding_service = get_embedding_service()
    print(f"Embedding service initialized: {embedding_service is not None}")
    print(f"Using model: {embedding_service.model}")
    print(f"Embedding dimension: {embedding_service.dimension}")
    
    # Test text chunking first
    test_text = """
    This is a test document for embedding generation.
    
    It contains multiple paragraphs to test the chunking functionality.
    Each paragraph should be properly chunked according to size parameters.
    
    The text should be:
    1. Chunked into segments
    2. Embedded using the embedding service
    
    Let's see how this works with the embedding service.
    """
    
    # Chunk the text
    print("\nChunking text...")
    chunks = chunk_text(test_text, chunk_size=200, overlap=50)
    print(f"Created {len(chunks)} chunks from the text:")
    for i, chunk in enumerate(chunks):
        print(f"  Chunk {i+1} ({len(chunk)} chars): {chunk[:50]}...")
        
    # Test embedding generation
    print("\nGenerating embeddings...")
    try:
        embeddings = await embedding_service.generate_embeddings(chunks)
        print(f"Generated {len(embeddings)} embeddings")
        
        if embeddings:
            # Check dimensions
            print(f"First embedding dimension: {len(embeddings[0])}")
            print(f"Expected dimension: {embedding_service.dimension}")
            
            # Generate a single embedding
            query = "This is a test query"
            print(f"\nGenerating single embedding for: '{query}'")
            single_embedding = await embedding_service.generate_single_embedding(query)
            print(f"Single embedding dimension: {len(single_embedding)}")
            
            # Test cosine similarity between embeddings
            print("\nTesting similarity calculation...")
            similarity = embedding_service.cosine_similarity(embeddings[0], single_embedding)
            print(f"Similarity between first chunk and query: {similarity:.4f}")
            
            print("\nEmbedding service test completed successfully!")
            
    except Exception as e:
        print(f"Error in embedding generation: {str(e)}")
    
if __name__ == "__main__":
    try:
        asyncio.run(test_embedding_service())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}") 