#!/usr/bin/env python3
"""
Debug script to verify environment variables and database connections
"""

import os
import sys
import json
import logging
from dotenv import load_dotenv
import requests

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_env_variables():
    """Check environment variables for Supabase configuration"""
    logger.info("===== Environment Variables Check =====")
    
    # Load environment variables from different possible locations
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
    
    # List critical environment variables to check
    critical_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "SUPABASE_JWT_SECRET"
    ]
    
    all_present = True
    
    for var in critical_vars:
        value = os.getenv(var)
        if value:
            # Mask most of the key/secret/token for security
            if len(value) > 15 and ("KEY" in var or "SECRET" in var or "TOKEN" in var):
                masked_value = value[:6] + "..." + value[-6:]
                logger.info(f"✅ {var} is set: {masked_value}")
            else:
                logger.info(f"✅ {var} is set: {value}")
        else:
            logger.error(f"❌ {var} is not set")
            all_present = False
    
    return all_present

def check_supabase_connection():
    """Check connection to Supabase with service role key"""
    logger.info("\n===== Supabase Connection Check =====")
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_role_key:
        logger.error("Missing Supabase URL or Service Role Key")
        return False
    
    # Create basic headers for Supabase
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "X-Client-Info": "service_role"  # Important for bypassing RLS
    }
    
    # Try to verify connection to Supabase
    try:
        logger.info("Testing connection to Supabase...")
        response = requests.get(f"{supabase_url}/rest/v1/", headers=headers)
        
        logger.info(f"Connection status code: {response.status_code}")
        logger.info(f"Connection response: {response.text}")
        
        if response.status_code == 200:
            logger.info("✅ Successfully connected to Supabase")
            return True
        else:
            logger.error(f"❌ Failed to connect to Supabase: {response.status_code}")
            return False
    
    except Exception as e:
        logger.error(f"❌ Error connecting to Supabase: {str(e)}")
        return False

def check_tables():
    """Check if tables exist in Supabase"""
    logger.info("\n===== Supabase Tables Check =====")
    
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not supabase_url or not service_role_key:
        logger.error("Missing Supabase URL or Service Role Key")
        return False
    
    # Create basic headers for Supabase
    headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Content-Type": "application/json",
        "X-Client-Info": "service_role"
    }
    
    # Tables to check in both public and without schema
    required_tables = [
        "user_profiles", 
        "projects", 
        "documents", 
        "chat_sessions", 
        "chat_messages"
    ]
    
    table_exists = False
    
    # Try both with and without public/ prefix
    for prefix in ["public/", ""]:
        for table in required_tables:
            table_path = f"{prefix}{table}"
            try:
                url = f"{supabase_url}/rest/v1/{table_path}"
                logger.info(f"Checking table: {url}")
                
                # Use HEAD to check if table exists
                response = requests.head(url, headers=headers)
                
                if response.status_code == 200:
                    logger.info(f"✅ Table {table_path} exists")
                    table_exists = True
                else:
                    logger.warning(f"❌ Table {table_path} not found ({response.status_code})")
                    
                    # Try GET for more details
                    get_response = requests.get(url, headers=headers, params={"limit": 1})
                    logger.warning(f"GET response: {get_response.status_code} - {get_response.text[:100]}")
            
            except Exception as e:
                logger.error(f"Error checking table {table_path}: {str(e)}")
    
    # Try making POST request to create a project
    logger.info("\nTesting project creation...")
    try:
        payload = {
            "name": "Debug Test Project",
            "user_id": "00000000-0000-0000-0000-000000000000",  # Debug test ID
            "description": "Created by debug script",
            "is_public": False,
        }
        
        for prefix in ["public/", ""]:
            url = f"{supabase_url}/rest/v1/{prefix}projects"
            logger.info(f"Trying to create project at: {url}")
            
            response = requests.post(url, headers=headers, json=payload)
            logger.info(f"Creation response: {response.status_code} - {response.text[:100]}")
            
            if response.status_code == 201 or response.status_code == 200:
                logger.info("✅ Successfully created test project")
                break
    
    except Exception as e:
        logger.error(f"Error creating test project: {str(e)}")
    
    return table_exists

def import_and_check_settings():
    """Import the settings module and check its values"""
    logger.info("\n===== App Settings Check =====")
    
    try:
        # Import settings directly
        from backend.app.config.settings import settings
        
        # Check critical settings
        logger.info(f"SUPABASE_URL: {settings.SUPABASE_URL}")
        logger.info(f"SUPABASE_SERVICE_ROLE_KEY: {settings.SUPABASE_SERVICE_ROLE_KEY[:5]}...{settings.SUPABASE_SERVICE_ROLE_KEY[-5:] if settings.SUPABASE_SERVICE_ROLE_KEY else 'None'}")
        logger.info(f"SUPABASE_ANON_KEY: {settings.SUPABASE_ANON_KEY[:5]}...{settings.SUPABASE_ANON_KEY[-5:] if settings.SUPABASE_ANON_KEY else 'None'}")
        
        # Check database service
        from backend.app.services.database_service import DatabaseService
        db_service = DatabaseService()
        
        # Try to get schema info
        logger.info("Initialized database service instance")
        logger.info(f"Database URL: {db_service.rest_url}")
        logger.info(f"Database schema: {db_service.schema}")
        logger.info(f"Headers: {json.dumps({k: v[:5]+'...' if k in ['apikey', 'Authorization'] and v else v for k, v in db_service.headers.items()})}")
        
        logger.info("✅ Successfully imported app settings")
        return True
        
    except ImportError as e:
        logger.error(f"Failed to import settings: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Error checking settings: {str(e)}")
        return False

if __name__ == "__main__":
    logger.info("Starting configuration debug...")
    
    env_ok = check_env_variables()
    connection_ok = check_supabase_connection()
    tables_ok = check_tables()
    settings_ok = import_and_check_settings()
    
    # Print summary
    logger.info("\n===== DEBUG SUMMARY =====")
    logger.info(f"Environment Variables: {'✅ OK' if env_ok else '❌ MISSING'}")
    logger.info(f"Supabase Connection: {'✅ OK' if connection_ok else '❌ FAILED'}")
    logger.info(f"Required Tables: {'✅ OK' if tables_ok else '❌ MISSING'}")
    logger.info(f"App Settings: {'✅ OK' if settings_ok else '❌ FAILED'}")
    
    # Exit with appropriate code
    if env_ok and connection_ok and tables_ok and settings_ok:
        logger.info("✅ All checks passed!")
        sys.exit(0)
    else:
        logger.error("❌ Some checks failed. See log for details.")
        sys.exit(1) 