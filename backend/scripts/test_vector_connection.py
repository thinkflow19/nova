import os
import sys
import logging
import pinecone
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_pinecone_connection():
    """Test basic connectivity to the Pinecone service"""
    print("\n===== Testing Pinecone Connection =====")
    
    # Load environment variables
    load_dotenv()
    
    # Check for API key
    pinecone_api_key = os.environ.get("PINECONE_API_KEY")
    if not pinecone_api_key:
        print("ERROR: PINECONE_API_KEY environment variable not set")
        print("Please set this in your .env file or environment variables")
        return False
    else:
        print(f"PINECONE_API_KEY found with length: {len(pinecone_api_key)}")
    
    # Check for other settings
    pinecone_environment = os.environ.get("PINECONE_ENVIRONMENT", "")
    pinecone_index = os.environ.get("PINECONE_INDEX", "")
    
    print(f"PINECONE_ENVIRONMENT: {pinecone_environment or 'Not set'}")
    print(f"PINECONE_INDEX: {pinecone_index or 'Not set'}")
    
    # Try to connect to Pinecone
    try:
        print("\nInitializing Pinecone client...")
        pc = pinecone.Pinecone(api_key=pinecone_api_key)
        
        # List available indexes
        print("Listing Pinecone indexes...")
        try:
            indexes = pc.list_indexes()
            if isinstance(indexes, list):
                index_names = indexes
            else:
                # Handle newer SDK versions
                index_names = [index.name for index in indexes]
                
            print(f"Available indexes: {index_names}")
            
            if not index_names:
                print("WARNING: No indexes found in your Pinecone account")
            elif pinecone_index and pinecone_index not in index_names:
                print(f"WARNING: Configured index '{pinecone_index}' not found in your Pinecone account")
                
        except Exception as e:
            print(f"ERROR listing indexes: {str(e)}")
            return False
        
        # If we have a configured index, try to connect to it
        if pinecone_index and pinecone_index in index_names:
            print(f"\nConnecting to index: {pinecone_index}")
            try:
                index = pc.Index(pinecone_index)
                stats = index.describe_index_stats()
                print(f"Successfully connected to index: {pinecone_index}")
                print(f"Index stats: {stats}")
            except Exception as e:
                print(f"ERROR connecting to index: {str(e)}")
                return False
        
        print("\nPinecone connection test completed successfully!")
        return True
        
    except Exception as e:
        print(f"ERROR: Failed to connect to Pinecone: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_pinecone_connection()
    sys.exit(0 if success else 1) 