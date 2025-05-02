import os
import sys
import uuid
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("Script started")
print(f"Current directory: {os.getcwd()}")
print(f"Python version: {sys.version}")
print(f"Supabase URL: {os.getenv('SUPABASE_URL', 'Not set')}")

try:
    # Add the parent directory to the path
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../'))
    print(f"Adding to path: {parent_dir}")
    sys.path.append(parent_dir)
    
    # Try importing the module
    print("Importing storage service...")
    from app.services.storage_service import StorageService, StorageProvider
    print("Successfully imported storage service")
    
    def test_storage():
        """Simple test for the storage service"""
        print("Testing storage service...")
        
        try:
            # Create a storage service
            storage = StorageService()
            print(f"Storage service initialized with provider: {storage.storage.__class__.__name__}")
            
            # Create a test file
            test_filename = f"test_file_{uuid.uuid4()}.txt"
            test_content = b"This is a test file for storage service"
            print(f"Created test file: {test_filename}")
            
            try:
                # Upload the file
                print("Uploading file...")
                result = storage.upload_document(
                    file_content=test_content,
                    file_name=test_filename,
                    content_type="text/plain"
                )
                print(f"Upload result: {result}")
                
                file_path = result["key"]
                
                # Get URL
                print("Getting URL...")
                url = storage.get_document_url(file_path)
                print(f"File URL: {url}")
                
                # Download
                print("Downloading file...")
                content = storage.get_document(file_path)
                print(f"Downloaded content length: {len(content)} bytes")
                print(f"Content matches: {content == test_content}")
                
                # Delete
                print("Deleting file...")
                success = storage.delete_document(file_path)
                print(f"Delete success: {success}")
                
                print("All storage operations completed successfully!")
                return True
            except Exception as op_e:
                print(f"Error during storage operations: {op_e}")
                traceback.print_exc()
                return False
        except Exception as init_e:
            print(f"Error initializing storage: {init_e}")
            traceback.print_exc()
            return False

    if __name__ == "__main__":
        test_storage()
except Exception as e:
    print(f"Error in script: {e}")
    traceback.print_exc() 