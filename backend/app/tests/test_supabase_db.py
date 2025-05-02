import os
import sys
import uuid
import json
import time
import traceback
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def print_header(text):
    """Print a styled header for test sections"""
    print("\n" + "=" * 50)
    print(f" {text} ".center(50, "="))
    print("=" * 50)

def test_supabase_db():
    """Test Supabase database functionality"""
    print_header("TESTING SUPABASE DATABASE")
    
    try:
        from supabase import create_client
        
        # Get credentials
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            print("❌ Supabase credentials not found in environment variables")
            return False
        
        print(f"Connecting to Supabase at {supabase_url}")
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Successfully created Supabase client")
        
        # Create a test record
        test_id = str(uuid.uuid4())
        test_data = {
            "id": test_id,
            "name": f"Test Project {test_id[:8]}",
            "description": "Created by integration test",
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        # Test with 'projects' table - no schema prefix needed since api schema is exposed by default
        print("Creating test record in projects table...")
        
        try:
            # Insert record into 'projects' table
            print("Inserting test record...")
            response = supabase.from_("projects").insert(test_data).execute()
            
            if hasattr(response, 'data') and response.data:
                inserted_data = response.data
                print(f"✅ Successfully inserted test record: {json.dumps(inserted_data)}")
                
                # Test query
                print(f"Querying test record from projects...")
                query_response = supabase.from_("projects").select("*").eq("id", test_id).execute()
                
                if query_response.data and len(query_response.data) > 0:
                    print(f"✅ Successfully queried test record: {json.dumps(query_response.data[0])}")
                    
                    # Clean up - delete the test record
                    print("Cleaning up test record...")
                    delete_response = supabase.from_("projects").delete().eq("id", test_id).execute()
                    print("✅ Successfully deleted test record")
                    
                    return True
                else:
                    print("❌ Failed to query test record")
            else:
                print(f"❌ Insertion may have failed: {response}")
                
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
        
        return False
    except Exception as e:
        print(f"❌ Supabase connection failed: {str(e)}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_supabase_db()
    if success:
        print("\n✅ SUPABASE DATABASE TEST PASSED")
    else:
        print("\n❌ SUPABASE DATABASE TEST FAILED")
        print("Please check error messages above for details.") 