import os
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

def list_tables_and_schemas():
    """List all tables and schemas available in the Supabase database"""
    # Get credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    print(f"Connecting to Supabase at {supabase_url}")
    supabase = create_client(supabase_url, supabase_key)
    print("✅ Connected to Supabase")
    
    # Using the rpc function to execute a SQL query
    print("\n==== Listing Database Schemas ====")
    try:
        response = supabase.rpc(
            "execute_sql",
            {"query": "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;"}
        ).execute()
        
        if hasattr(response, 'data') and response.data:
            print(f"Available schemas: {response.data}")
        else:
            print(f"❌ Failed to get schemas: {response}")
    except Exception as e:
        print(f"Error querying schemas: {str(e)}")
        # Fallback to direct query if RPC not available
        try:
            print("Trying direct query for schemas...")
            response = supabase.table("information_schema.schemata").select("schema_name").execute()
            if hasattr(response, 'data') and response.data:
                print(f"Available schemas via direct query: {response.data}")
            else:
                print(f"❌ Failed to get schemas via direct query: {response}")
        except Exception as e2:
            print(f"Error with direct schema query: {str(e2)}")
    
    print("\n==== Listing Tables in Each Schema ====")
    try:
        response = supabase.rpc(
            "execute_sql",
            {"query": """
                SELECT 
                    table_schema, 
                    table_name 
                FROM 
                    information_schema.tables 
                WHERE 
                    table_schema NOT IN ('pg_catalog', 'information_schema') 
                ORDER BY 
                    table_schema, table_name;
            """}
        ).execute()
        
        if hasattr(response, 'data') and response.data:
            print("Tables by schema:")
            for row in response.data:
                print(f"  {row['table_schema']}.{row['table_name']}")
        else:
            print(f"❌ Failed to get tables: {response}")
    except Exception as e:
        print(f"Error querying tables: {str(e)}")
        # Try another approach
        try:
            print("Trying REST API to list tables...")
            for schema in ['public', 'api', 'auth', 'storage']:
                try:
                    print(f"\nTesting access to schema: {schema}")
                    response = supabase.from_(f"{schema}.dummy_test").select("*").limit(1).execute()
                    print(f"  Access to {schema} schema: Success")
                except Exception as schema_e:
                    print(f"  Access to {schema} schema: Failed - {str(schema_e)}")
        except Exception as e2:
            print(f"Error with REST API approach: {str(e2)}")

if __name__ == "__main__":
    list_tables_and_schemas() 