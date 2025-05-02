import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def test_simple_insert():
    """Test a simple insert operation with minimal fields"""
    # Get credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    print(f"Connecting to Supabase at {supabase_url}")
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Connected to Supabase")
    
    # Try with only the required name field
    test_data = {
        "name": "Test Project Minimal"
    }
    
    print(f"Inserting minimal record: {test_data}")
    response = supabase.from_("projects").insert(test_data).execute()
    
    if hasattr(response, 'data') and response.data:
        print(f"✅ Success! Inserted data: {response.data}")
        
        # Get the ID of the inserted record
        inserted_id = response.data[0]['id']
        
        # Delete the test record to clean up
        print(f"Cleaning up - deleting record with ID: {inserted_id}")
        delete_response = supabase.from_("projects").delete().eq("id", inserted_id).execute()
        print("✅ Deleted test record")
    else:
        print(f"❌ Failed to insert: {response}")

if __name__ == "__main__":
    test_simple_insert() 