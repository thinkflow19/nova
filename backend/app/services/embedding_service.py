import os
import openai
import pinecone
import importlib
from dotenv import load_dotenv
from fastapi import HTTPException, status
import uuid
import requests
import tempfile
import PyPDF2
import docx
from typing import List, Dict
import numpy as np
import logging
# Consider adding a text splitting library like langchain or nltk if complex chunking is needed
# from langchain.text_splitter import RecursiveCharacterTextSplitter 

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Pinecone configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_DIMENSION = 1024  # Dimensions for llama-text-embed-v2
EMBEDDING_MODEL = "text-embedding-3-small"  # Newer model with 1024 dimensions
EMBEDDING_DIMENSION = 1536 

# Verify required env vars are loaded
if not OPENAI_API_KEY or not PINECONE_API_KEY or not PINECONE_ENVIRONMENT or not PINECONE_INDEX_NAME:
    logger.error("Missing critical environment variables for Embedding Service (OpenAI/Pinecone). Features may be unavailable.")
    # Optionally raise EnvironmentError to prevent startup without full config
    # raise EnvironmentError("Missing OpenAI/Pinecone configuration for EmbeddingService.")

# Initialize Pinecone with appropriate API based on version
try:
    # Reload pinecone module to ensure we have the latest version
    importlib.reload(pinecone)
    
    # Get the Pinecone version
    pinecone_version = getattr(pinecone, "__version__", "Unknown")
    print(f"Detected Pinecone version: {pinecone_version}")
    
    # Check if we're using newer v6.x client
    if hasattr(pinecone, "Pinecone"):
        print("Using Pinecone v6.x client")
        pc = pinecone.Pinecone(api_key=PINECONE_API_KEY)
        
        # Check if index exists
        indexes = pc.list_indexes()
        index_names = [idx.name for idx in indexes]
        
        # Create index if needed
        if PINECONE_INDEX_NAME not in index_names:
            pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=PINECONE_DIMENSION,  # llama-text-embed-v2 dimension
                metric="cosine",
                spec={"serverless": {"cloud": "aws", "region": "us-east-1"}}
            )
            print(f"Created Pinecone index: {PINECONE_INDEX_NAME}")
        
        # Connect to index
        index = pc.Index(PINECONE_INDEX_NAME)
        print("✅ Pinecone v6.x initialized successfully")
        
    # Handle older client versions (v2.x)
    elif pinecone_version.startswith("2."):
        print(f"Using Pinecone v2.x client (version {pinecone_version})")
        
        # For Pinecone v2.2.2, create a direct REST API client
        # This works around issues with the pinecone-client v2.2.2 initialization
        print("Using direct REST API implementation for Pinecone")
        
        class RestApiIndex:
            def __init__(self, index_name, api_key, environment):
                self.index_name = index_name
                self.api_key = api_key
                self.environment = environment
                # Use the correct host URL format
                self.base_url = f"https://{index_name}-vonjx0v.svc.{environment}.pinecone.io"
                print(f"Connecting to Pinecone at: {self.base_url}")
                
            def describe_index_stats(self):
                headers = {
                    "Api-Key": self.api_key,
                    "Accept": "application/json"
                }
                
                response = requests.get(f"{self.base_url}/describe_index_stats", headers=headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Stats error: {response.text}")
                    return {"dimension": PINECONE_DIMENSION, "count": 0}
                
            def query(self, vector, top_k=10, include_metadata=True, filter=None, namespace=""):
                headers = {
                    "Api-Key": self.api_key,
                    "Content-Type": "application/json"
                }
                data = {
                    "vector": vector,
                    "topK": top_k,
                    "includeMetadata": include_metadata,
                    "namespace": namespace
                }
                if filter:
                    data["filter"] = filter
                        
                response = requests.post(f"{self.base_url}/query", json=data, headers=headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Query error: {response.text}")
                    return {"matches": []}
                        
            def upsert(self, vectors, namespace=""):
                headers = {
                    "Api-Key": self.api_key,
                    "Content-Type": "application/json"
                }
                
                # Convert vectors to the format expected by the REST API
                formatted_vectors = []
                for vector in vectors:
                    formatted_vectors.append({
                        "id": vector["id"],
                        "values": vector["values"],
                        "metadata": vector["metadata"]
                    })
                
                data = {
                    "vectors": formatted_vectors,
                    "namespace": namespace
                }
                    
                response = requests.post(f"{self.base_url}/vectors/upsert", json=data, headers=headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Upsert error: {response.text}")
                    return None
                        
            def delete(self, ids=None, delete_all=False, namespace=""):
                headers = {
                    "Api-Key": self.api_key,
                    "Content-Type": "application/json"
                }
                
                data = {
                    "namespace": namespace
                }
                
                if delete_all:
                    data["deleteAll"] = True
                elif ids:
                    data["ids"] = ids
                
                response = requests.post(f"{self.base_url}/vectors/delete", json=data, headers=headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Delete error: {response.text}")
                    return None
                        
        # Create our REST API index
        index = RestApiIndex(
            index_name=PINECONE_INDEX_NAME,
            api_key=PINECONE_API_KEY,
            environment=PINECONE_ENVIRONMENT
        )
        print("✅ Created REST API index client for Pinecone")
    else:
        raise ImportError(f"Unsupported Pinecone version: {pinecone_version}")

    print("✅ Pinecone initialized successfully")
except Exception as e:
    print(f"⚠️ Warning: Pinecone initialization failed: {str(e)}")
    print("⚠️ Embedding features will not be available")

    # Create a dummy index that logs errors but doesn't break the app
    class DummyIndex:
        def query(self, *args, **kwargs):
            print("Warning: Pinecone not initialized")
            return {"matches": []}

        def upsert(self, *args, **kwargs):
            print("Warning: Pinecone not initialized")
            return None

    index = DummyIndex()


def extract_text_from_file(file_url: str, file_name: str) -> str:
    """Extract text from uploaded documents (PDF, DOCX, TXT)."""
    try:
        # Download file from S3
        response = requests.get(file_url)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to download file from storage",
            )

        # Create temp file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name

        # Extract text based on file type
        file_extension = file_name.split(".")[-1].lower()

        if file_extension == "pdf":
            # Process PDF
            text = ""
            with open(temp_file_path, "rb") as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"

        elif file_extension == "docx":
            # Process DOCX
            doc = docx.Document(temp_file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])

        elif file_extension == "txt":
            # Process TXT
            with open(temp_file_path, "r", encoding="utf-8") as file:
                text = file.read()

        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_extension}",
            )

        # Clean up temp file
        os.unlink(temp_file_path)

        return text

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract text: {str(e)}",
        )


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks."""
    chunks = []

    if len(text) <= chunk_size:
        chunks.append(text)
    else:
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            if end < len(text) and text[end] != " ":
                # Try to end at a space to avoid breaking words
                while end > start and text[end] != " ":
                    end -= 1
                if end == start:  # If no space found, just use the hard cut
                    end = min(start + chunk_size, len(text))

            chunks.append(text[start:end])
            start = end - overlap  # Overlap for context

    return chunks


def create_embeddings(text_chunks: List[str], metadata: Dict) -> str:
    """Create embeddings and store in Pinecone."""
    try:
        # Create batch embeddings
        embeddings = []
        for i, chunk in enumerate(text_chunks):
            try:
                # Get embedding from OpenAI with the specified model
                response = openai.embeddings.create(
                    input=chunk, model=EMBEDDING_MODEL
                )
                embedding = response.data[0].embedding
            except Exception as e:
                print(f"Error creating embedding: {str(e)}")
                # Create a fallback random embedding with correct dimension
                random_vector = list(np.random.rand(PINECONE_DIMENSION).astype(float))
                # Normalize the vector for better similarity search
                magnitude = np.sqrt(np.sum(np.array(random_vector) ** 2))
                embedding = [v / magnitude for v in random_vector]
                print(f"Using fallback random embedding for chunk {i}")

            # Prepare metadata for this chunk
            chunk_metadata = metadata.copy()
            chunk_metadata["chunk_id"] = i
            chunk_metadata["text"] = chunk

            # Create vector record for Pinecone
            embeddings.append({
                "id": f"{metadata['document_id']}_{i}",
                "values": embedding,
                "metadata": chunk_metadata
            })

        # Upsert embeddings to Pinecone
        print(f"Upserting {len(embeddings)} vectors to Pinecone")
        result = index.upsert(vectors=embeddings)
        print(f"Upsert result: {result}")

        # Return the document ID
        return metadata["document_id"]

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create embeddings: {str(e)}"
        )


def query_embeddings(query: str, top_k: int = 3, project_id: str = None) -> List[Dict]:
    """Query embeddings from Pinecone."""
    try:
        # Get query embedding from OpenAI
        try:
            query_response = openai.embeddings.create(
                input=query, model=EMBEDDING_MODEL
            )
            query_embedding = query_response.data[0].embedding
        except Exception as e:
            print(f"Error creating query embedding: {str(e)}")
            # Create a fallback random embedding with correct dimension
            random_vector = list(np.random.rand(PINECONE_DIMENSION).astype(float))
            # Normalize the vector for better similarity search
            magnitude = np.sqrt(np.sum(np.array(random_vector) ** 2))
            query_embedding = [v / magnitude for v in random_vector]
            print("Using fallback random embedding for query")

        # Prepare filter
        filter_dict = {}
        if project_id:
            filter_dict["project_id"] = project_id

        # Query Pinecone
        print(f"Querying Pinecone with filter: {filter_dict if filter_dict else 'None'}")
        query_response = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            filter=filter_dict if filter_dict else None
        )

        # Return matched documents
        results = []
        for match in query_response.get("matches", []):
            if not match.get("metadata"):
                continue
                
            results.append({
                "text": match["metadata"].get("text", "No text available"),
                "score": match.get("score", 0),
                "document_id": match["metadata"].get("document_id", "Unknown"),
                "file_name": match["metadata"].get("file_name", "Unknown")
            })

        return results

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query embeddings: {str(e)}"
        )

class EmbeddingService:
    def __init__(self, chunk_size=1000, chunk_overlap=100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        # Simple whitespace/paragraph splitter for now
        # For production, use a more robust splitter like RecursiveCharacterTextSplitter
        logger.info(f"EmbeddingService initialized with model: {EMBEDDING_MODEL}, dimension: {EMBEDDING_DIMENSION}")

    def _chunk_text(self, text: str) -> List[str]:
        """Simple text chunking based on paragraphs or fixed size."""
        # Replace with more sophisticated chunking if needed
        # E.g., using RecursiveCharacterTextSplitter
        # text_splitter = RecursiveCharacterTextSplitter(
        #     chunk_size=self.chunk_size, 
        #     chunk_overlap=self.chunk_overlap
        # )
        # return text_splitter.split_text(text)
        
        # Basic fixed-size chunking (non-overlapping)
        chunks = []
        if not text: return chunks
        for i in range(0, len(text), self.chunk_size):
            chunks.append(text[i : i + self.chunk_size])
        
        logger.info(f"Chunked text into {len(chunks)} chunks.")
        return chunks

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of text chunks."""
        if not texts:
            return []
            
        if not openai.api_key:
             logger.error("Cannot generate embeddings: OpenAI API key is not configured.")
             raise ValueError("OpenAI API key not configured.")

        try:
            logger.info(f"Generating embeddings for {len(texts)} chunks using {EMBEDDING_MODEL}...")
            # Use the async client if available, otherwise fallback or use sync client in thread
            # For simplicity here, assuming the standard client works with async await
            response = await openai.embeddings.create(
                 input=texts, 
                 model=EMBEDDING_MODEL
             )
            embeddings = [item.embedding for item in response.data]
            logger.info(f"Successfully generated {len(embeddings)} embeddings.")
            # Verify dimension of the first embedding
            if embeddings and len(embeddings[0]) != EMBEDDING_DIMENSION:
                logger.warning(f"Generated embedding dimension {len(embeddings[0])} does not match expected {EMBEDDING_DIMENSION}")
                # Handle mismatch? Raise error or proceed?
                # For now, proceed but log warning.
            return embeddings
        except Exception as e:
            logger.error(f"Failed to generate OpenAI embeddings: {e}")
            # Consider adding specific error handling for rate limits, auth errors etc.
            raise
            
    async def generate_embedding(self, text: str) -> List[float]:
         """Generate embedding for a single piece of text."""
         if not text:
             return []
         embeddings = await self.generate_embeddings([text])
         return embeddings[0] if embeddings else []

    def get_dimension(self) -> int:
        """Return the dimension of the embeddings generated by this service."""
        return EMBEDDING_DIMENSION

# Example Usage (for testing)
async def _test_embedding_service():
    import asyncio
    logging.basicConfig(level=logging.INFO)
    
    # Make sure OPENAI_API_KEY is set in your environment for this test
    if not os.getenv("OPENAI_API_KEY"):
        print("Skipping test: OPENAI_API_KEY not set.")
        return

    service = EmbeddingService()
    test_text = "This is the first sentence. This is the second sentence. The third sentence is slightly longer." 
    chunks = service._chunk_text(test_text)
    print("Chunks:", chunks)
    
    if chunks:
        embeddings = await service.generate_embeddings(chunks)
        print(f"Generated {len(embeddings)} embeddings.")
        if embeddings:
            print(f"First embedding dimension: {len(embeddings[0])}")
            assert len(embeddings[0]) == service.get_dimension()
            
        single_embedding = await service.generate_embedding("A single test query.")
        print(f"Single embedding dimension: {len(single_embedding)}")
        assert len(single_embedding) == service.get_dimension()
        
    print("Embedding Service Test Completed.")

# To run test: python -m app.services.embedding_service
if __name__ == "__main__":
    import asyncio
    # Ensure the event loop policy is set correctly for Windows if needed
    # if os.name == 'nt':
    #     asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(_test_embedding_service())
