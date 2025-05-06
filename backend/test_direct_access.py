#!/usr/bin/env python3
"""
Test direct SQL access to Supabase tables using the service role
"""

import os
import sys
import logging
import psycopg2
from dotenv import load_dotenv
import requests

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_environment():
    """Load environment variables"""
    env_files = [
        ".env",
        "../.env",
        "backend/.env",
    ]
    
    for env_file in env_files:
        if os.path.exists(env_file):
            logger.info(f"Loading environment variables from {env_file}")
            load_dotenv(env_file)
            break
    
    # Check essential variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_role = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not supabase_service_role:
        logger.error("Missing required environment variables")
        sys.exit(1)
    
    return supabase_url, supabase_service_role

def test_rest_api_access(supabase_url, service_role_key):
    """Test access to Supabase using REST API with service role"""
    logger.info("\n===== REST API Access Check =====")
    
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "X-Client-Info": "service_role"
    }
    
    # Check connection to base endpoint
    try:
        response = requests.get(f"{supabase_url}/rest/v1/", headers=headers)
        logger.info(f"Base endpoint response: {response.status_code}")
        logger.info(f"Response headers: {response.headers}")
        logger.info(f"Response text: {response.text[:200]}")
    except Exception as e:
        logger.error(f"Error connecting to base endpoint: {str(e)}")
    
    # Try direct access to tables with different formats
    tables = ["user_profiles", "projects"]
    prefixes = ["", "public."]
    
    for table in tables:
        for prefix in prefixes:
            full_table = f"{prefix}{table}"
            url = f"{supabase_url}/rest/v1/{full_table}"
            
            try:
                logger.info(f"\nTrying to access {url}")
                response = requests.get(url, headers=headers, params={"limit": 1})
                
                logger.info(f"Status code: {response.status_code}")
                logger.info(f"Response: {response.text[:200]}")
                
                if response.status_code == 200:
                    logger.info(f"✅ Successfully accessed {full_table}")
                else:
                    logger.warning(f"❌ Failed to access {full_table}")
                    
            except Exception as e:
                logger.error(f"Error accessing {full_table}: {str(e)}")

def test_direct_sql_access():
    """Test direct SQL access to Supabase database"""
    logger.info("\n===== Direct SQL Access Check =====")
    
    # Extract connection info from Supabase URL
    supabase_url = os.getenv("SUPABASE_URL")
    db_password = os.getenv("SUPABASE_DB_PASSWORD") or os.getenv("POSTGRES_PASSWORD")
    
    if not supabase_url or not db_password:
        logger.error("Missing database connection information")
        return
    
    # Parse host from URL: https://xxx.supabase.co -> db.xxx.supabase.co
    if supabase_url.startswith("https://"):
        host_part = supabase_url[8:].split(".")[0]
        db_host = f"db.{host_part}.supabase.co"
        logger.info(f"Extracted database host: {db_host}")
    else:
        logger.error(f"Invalid Supabase URL format: {supabase_url}")
        return
    
    try:
        # Connect to the database
        connection = psycopg2.connect(
            user="postgres",
            password=db_password,
            host=db_host,
            port="5432",
            dbname="postgres"
        )
        
        logger.info("✅ Successfully connected to Postgres database")
        
        # Create a cursor
        cursor = connection.cursor()
        
        # Check table existence
        cursor.execute("""
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_schema, table_name;
        """)
        
        tables = cursor.fetchall()
        logger.info("Tables in public schema:")
        for table in tables:
            logger.info(f"  - {table[0]}.{table[1]}")
        
        # Try to select from user_profiles
        try:
            cursor.execute("SELECT COUNT(*) FROM public.user_profiles;")
            count = cursor.fetchone()[0]
            logger.info(f"✅ public.user_profiles has {count} rows")
        except Exception as e:
            logger.error(f"Error querying user_profiles: {str(e)}")
        
        # Try to select from projects
        try:
            cursor.execute("SELECT COUNT(*) FROM public.projects;")
            count = cursor.fetchone()[0]
            logger.info(f"✅ public.projects has {count} rows")
        except Exception as e:
            logger.error(f"Error querying projects: {str(e)}")
        
        # Close connection
        cursor.close()
        connection.close()
        logger.info("Database connection closed")
        
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")

if __name__ == "__main__":
    logger.info("Starting direct access tests...")
    
    # Load environment variables
    supabase_url, service_role_key = load_environment()
    
    # Test REST API access
    test_rest_api_access(supabase_url, service_role_key)
    
    # Test direct SQL access
    test_direct_sql_access()
    
    logger.info("Tests completed") 