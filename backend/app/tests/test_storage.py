import os
import unittest
import uuid
import sys
import traceback
from dotenv import load_dotenv
# Add the parent directory to the path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.services.storage_service import StorageService, StorageProvider

# Load environment variables
load_dotenv()

# Debug output
print("Starting storage service test")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"Environment variables: SUPABASE_URL={os.getenv('SUPABASE_URL', 'Not set')}")

class TestStorageService(unittest.TestCase):
    """Test the storage service functionality"""
    
    def setUp(self):
        """Set up the test environment"""
        print("Setting up test environment")
        try:
            # Initialize storage service with default provider (Supabase)
            self.storage_service = StorageService()
            # Generate a unique test file name
            self.test_filename = f"test_file_{uuid.uuid4()}.txt"
            # Create a test file content
            self.test_content = b"This is a test file for storage service"
            print(f"Test file created: {self.test_filename}")
        except Exception as e:
            print(f"Error in setUp: {e}")
            traceback.print_exc()
            raise
        
    def test_upload_and_download(self):
        """Test uploading and downloading a file"""
        print("Running upload and download test")
        try:
            # Upload the test file
            result = self.storage_service.upload_document(
                file_content=self.test_content,
                file_name=self.test_filename,
                content_type="text/plain"
            )
            
            print(f"Upload result: {result}")
            
            # Check that the result is returned
            self.assertIsNotNone(result)
            self.assertIn("url", result)
            self.assertIn("key", result)
            self.assertIn("provider", result)
            print(f"Uploaded document: {result}")
            
            file_path = result["key"]
            
            # Get the document URL
            url = self.storage_service.get_document_url(file_path)
            self.assertIsNotNone(url)
            print(f"Document URL: {url}")
            
            # Download the file
            downloaded_content = self.storage_service.get_document(file_path)
            self.assertEqual(downloaded_content, self.test_content)
            print("Downloaded content matches uploaded content")
            
            # Delete the file
            success = self.storage_service.delete_document(file_path)
            self.assertTrue(success)
            print(f"Successfully deleted document: {file_path}")
        except Exception as e:
            print(f"Error in test: {e}")
            traceback.print_exc()
            raise
        
    def tearDown(self):
        """Clean up after tests"""
        print("Tearing down test environment")
        pass

if __name__ == "__main__":
    try:
        unittest.main()
    except Exception as e:
        print(f"Error running tests: {e}")
        traceback.print_exc() 