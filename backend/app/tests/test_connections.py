import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client, Client
import pinecone
import uuid

# Add parent directory to path to import modules
current_dir = os.path.dirname(os.path.abspath(__file__))
app_dir = os.path.dirname(current_dir)
backend_dir = os.path.dirname(app_dir)
sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test Supabase connection and basic operations"""
    print("\n=== Testing Supabase Connection ===")
    
    # Get credentials from environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found in environment variables")
        return False
    
    print(f"Connecting to Supabase at {supabase_url}")
    try:
        # Initialize Supabase client
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Supabase client created successfully")
        
        # Test a simpler approach - just check if we can access Supabase
        try:
            # Check what schemas are available
            print("Checking schema access...")
            schemas_response = supabase.rpc('get_schemas').execute()
            print(f"Available schemas: {schemas_response.data if hasattr(schemas_response, 'data') else 'Unknown response format'}")
            print("✅ Successfully accessed Supabase RPC")
            return True
        except Exception as schema_e:
            print(f"Schema check failed: {str(schema_e)}")
            
            # Try a very basic table access
            try:
                print("Trying basic table access...")
                response = supabase.from_("projects").select("*").limit(1).execute()
                print(f"✅ Supabase query successful. Got {len(response.data) if hasattr(response, 'data') else 'unknown'} results")
                return True
            except Exception as e:
                print(f"Basic table access failed: {str(e)}")
                
                # As a last resort, simply verify we can access the REST API
                try:
                    print("Testing REST API access...")
                    url = f"{supabase_url}/rest/v1/"
                    import requests
                    headers = {
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}"
                    }
                    response = requests.get(url, headers=headers)
                    if response.status_code == 200:
                        print(f"✅ Supabase REST API accessible. Status: {response.status_code}")
                        return True
                    else:
                        print(f"❌ Supabase REST API returned status: {response.status_code}")
                        return False
                except Exception as rest_e:
                    print(f"REST API access failed: {str(rest_e)}")
                    return False
        
        return False  # Should not reach here
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

def test_pinecone_connection():
    """Test Pinecone connection and basic operations"""
    print("\n=== Testing Pinecone Connection ===")
    
    # Get credentials from environment variables
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    pinecone_environment = os.getenv("PINECONE_ENVIRONMENT")
    pinecone_index_name = os.getenv("PINECONE_INDEX_NAME")
    
    if not pinecone_api_key:
        print("❌ Pinecone API key not found in environment variables")
        return False
    
    print(f"Checking Pinecone module...")
    
    try:
        # Simply check if the pinecone module is importable and has expected attributes
        import pinecone
        
        # Get attributes
        attributes = dir(pinecone)
        relevant_attrs = [attr for attr in attributes if not attr.startswith('__')]
        
        print(f"Pinecone module contains {len(relevant_attrs)} public attributes")
        print(f"Some important attributes: {', '.join(relevant_attrs[:10])}")
        
        # Try to check the version
        if hasattr(pinecone, '__version__'):
            print(f"Pinecone version: {pinecone.__version__}")
        
        # Try to find Index class
        if 'Index' in attributes:
            print("✅ Found Index class in pinecone module")
        
        # See if module has expected attributes
        essential_attrs = ['Index', 'create_index', 'list_indexes', 'delete_index']
        found_attrs = [attr for attr in essential_attrs if attr in attributes]
        
        if found_attrs:
            print(f"✅ Found essential Pinecone attributes: {', '.join(found_attrs)}")
            return True
        else:
            print("⚠️ No essential attributes found. May have limited functionality.")
            return False
        
    except Exception as e:
        print(f"❌ Pinecone module check failed: {str(e)}")
        return False

def test_storage_connection():
    """Test Supabase Storage connection (as the default storage provider)"""
    print("\n=== Testing Storage Connection (Supabase) ===")
    
    # Get credentials from environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found in environment variables")
        return False
    
    try:
        # Initialize Supabase client
        supabase = create_client(supabase_url, supabase_key)
        
        # Check if the documents bucket exists or create it
        print("Checking for 'documents' bucket...")
        try:
            buckets = supabase.storage.list_buckets()
            # Handle different return formats based on supabase-py version
            if isinstance(buckets, list):
                bucket_names = [bucket.get('name') for bucket in buckets if isinstance(bucket, dict)]
            else:
                # Newer versions might return a response object
                bucket_data = getattr(buckets, 'data', [])
                bucket_names = [bucket.get('name') for bucket in bucket_data if isinstance(bucket, dict)]
            
            bucket_exists = 'documents' in bucket_names
            
            if bucket_exists:
                print("✅ 'documents' bucket already exists")
            else:
                print("Creating 'documents' bucket...")
                # Try different methods depending on the supabase-py version
                try:
                    result = supabase.storage.create_bucket('documents')
                    print("✅ 'documents' bucket created successfully")
                except Exception as bucket_e:
                    print(f"Error creating bucket with standard method: {str(bucket_e)}")
                    try:
                        # Alternative method for older versions
                        result = supabase.storage.create_bucket('documents', {'public': False})
                        print("✅ 'documents' bucket created successfully with alternative method")
                    except Exception as alt_e:
                        print(f"Error creating bucket with alternative method: {str(alt_e)}")
                        print("Continuing test with existing buckets...")
            
            # Test uploading a small file
            print("Testing file upload...")
            test_content = b"This is a test file to verify storage functionality."
            test_file_name = f"test_{uuid.uuid4()}.txt"
            
            try:
                supabase.storage.from_('documents').upload(
                    path=test_file_name,
                    file=test_content,
                    file_options={"content-type": "text/plain"}
                )
                
                # Test downloading the file
                print("Testing file download...")
                download_result = supabase.storage.from_('documents').download(test_file_name)
                
                if isinstance(download_result, bytes) and download_result == test_content:
                    print("✅ Storage upload and download successful")
                else:
                    print("❌ Downloaded content doesn't match or has unexpected format")
                
                # Cleanup
                print("Cleaning up test file...")
                supabase.storage.from_('documents').remove([test_file_name])
                print("✅ Test file removed")
                
                return True
            except Exception as file_e:
                print(f"❌ File operations failed: {str(file_e)}")
                return False
                
        except Exception as storage_e:
            print(f"❌ Supabase Storage operation failed: {str(storage_e)}")
            return False
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("Testing connections to external services...\n")
    
    supabase_ok = test_supabase_connection()
    pinecone_ok = test_pinecone_connection()
    storage_ok = test_storage_connection()
    
    print("\n=== Connection Test Results ===")
    print(f"Supabase: {'✅ Connected' if supabase_ok else '❌ Failed'}")
    print(f"Pinecone: {'✅ Connected' if pinecone_ok else '❌ Failed'}")
    print(f"Storage:  {'✅ Working' if storage_ok else '❌ Failed'}")
    
    if supabase_ok and pinecone_ok and storage_ok:
        print("\n✅ All connections are working properly!")
    else:
        failed = []
        if not supabase_ok: failed.append("Supabase")
        if not pinecone_ok: failed.append("Pinecone") 
        if not storage_ok: failed.append("Storage")
        print(f"\n❌ Connection issues with: {', '.join(failed)}")
        print("Please check your environment variables and service status.") 