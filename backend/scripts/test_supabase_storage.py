#!/usr/bin/env python3
"""
Test script for Supabase storage upload functionality
"""

import asyncio
import logging
import os
import sys
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add parent directory to path to find app module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.storage_service import get_storage_service, StorageService
from app.config.settings import settings

async def test_storage_upload():
    """Test basic storage upload functionality"""
    print("\n===== Testing Supabase Storage Upload =====")
    
    # Initialize storage service
    storage_service = get_storage_service()
    await storage_service.initialize()
    
    # Create test content
    test_content = b"This is a test file for Supabase storage upload."
    test_file_name = f"test_file_{uuid.uuid4().hex[:8]}.txt"
    storage_bucket = "documents"
    
    print(f"Uploading test file: {test_file_name}")
    print(f"Content size: {len(test_content)} bytes")
    print(f"Storage bucket: {storage_bucket}")
    
    try:
        # Upload file
        result = await storage_service.upload_document(
            file_content=test_content,
            storage_path=test_file_name,
            storage_bucket=storage_bucket,
            content_type="text/plain"
        )
        
        print(f"Upload successful!")
        print(f"Upload result: {result}")
        
        # Important: Get the actual file key/path from the result
        # This is the path we need to use for subsequent operations
        actual_file_path = result.get('key')
        
        if not actual_file_path:
            print("❌ ERROR: File key not found in upload result")
            return
            
        print(f"Actual file path in storage: {actual_file_path}")
        
        # Verify file exists using the actual path
        print("\nVerifying file exists in storage...")
        file_exists = await storage_service.check_file_exists(actual_file_path, storage_bucket)
        
        if file_exists:
            print(f"✅ File verification successful!")
        else:
            print(f"❌ File verification failed - file not found in storage")
        
        # Try to download the file using the actual path
        print("\nDownloading file from storage...")
        try:
            download_content = await storage_service.get_document(actual_file_path, storage_bucket)
            print(f"✅ Download successful! Downloaded {len(download_content)} bytes")
            print(f"Content: {download_content.decode('utf-8')}")
        except Exception as e:
            print(f"❌ Download failed: {str(e)}")
        
        # Clean up - delete the file using the actual path
        print("\nCleaning up - deleting test file...")
        try:
            await storage_service.delete_document(actual_file_path, storage_bucket)
            print(f"✅ File deletion successful!")
        except Exception as e:
            print(f"❌ File deletion failed: {str(e)}")
        
    except Exception as e:
        print(f"❌ ERROR: Storage test failed: {str(e)}")
        import traceback
        traceback.print_exc()

async def main():
    await test_storage_upload()

if __name__ == "__main__":
    asyncio.run(main()) 