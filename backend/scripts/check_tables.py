#!/usr/bin/env python3
"""
This script checks what tables exist in the Supabase database.
"""

import os
import sys
import logging
from dotenv import load_dotenv
import requests
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv("../.env")  # Look for .env in the project root

# Get Supabase URL and service role key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error(
        "Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    )
    sys.exit(1)

logger.info(f"Using Supabase URL: {SUPABASE_URL}")

def check_tables():
    """Check which tables exist in the Supabase database."""
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }
    
    # Try to fetch the list of tables from the Postgres information_schema using SQL API
    try:
        # Use Supabase's SQL API to execute a query directly
        sql_query = """
        SELECT 
            table_schema,
            table_name
        FROM 
            information_schema.tables 
        WHERE 
            table_schema IN ('public', 'api') 
            AND table_type = 'BASE TABLE'
        ORDER BY
            table_schema, table_name;
        """
        
        logger.info("Executing SQL query to get all tables...")
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/pgrest",
            headers=headers,
            json={"query": sql_query},
        )
        
        if response.status_code == 200:
            tables = response.json()
            logger.info(f"Found tables via SQL query: {json.dumps(tables, indent=2)}")
        else:
            logger.error(f"SQL query failed: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Error executing SQL query: {str(e)}")
    
    # Check required tables specifically
    required_tables = [
        "user_profiles",
        "projects",
        "documents",
        "chat_sessions",
        "chat_messages",
    ]
    
    logger.info("Checking required tables...")
    for table in required_tables:
        try:
            # Try two variations - with and without public schema
            for url in [
                f"{SUPABASE_URL}/rest/v1/{table}",
                f"{SUPABASE_URL}/rest/v1/public/{table}"
            ]:
                response = requests.head(url, headers=headers)
                logger.info(f"Table {url}: {'EXISTS' if response.status_code == 200 else 'NOT FOUND'} ({response.status_code})")
        except Exception as e:
            logger.error(f"Error checking table {table}: {str(e)}")
    
    return True

if __name__ == "__main__":
    logger.info("Checking Supabase tables")
    check_tables()
    logger.info("Table check completed") 