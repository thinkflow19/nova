#!/usr/bin/env python3
"""
Minimal script to create database tables directly using psycopg2.
"""

import os
import sys
import logging
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Read the SQL script content
with open(os.path.join(os.path.dirname(__file__), "create_tables.sql"), "r") as f:
    sql_script = f.read()


def main():
    """Main function to set up database tables."""
    logger.info("Setting up database tables in Supabase PostgreSQL")

    # Get Supabase URL and credentials
    supabase_url = os.getenv("SUPABASE_URL")

    if not supabase_url:
        logger.error("SUPABASE_URL environment variable not found")
        return 1

    # Extract the host part from the Supabase URL
    # https://xxxxx.supabase.co -> db.xxxxx.supabase.co
    if supabase_url.startswith("https://"):
        host_part = supabase_url.split("//")[1].split(".")[0]
        db_host = f"db.{host_part}.supabase.co"
    else:
        logger.error("SUPABASE_URL format is incorrect")
        return 1

    # Get connection parameters
    db_password = input("Enter your Supabase PostgreSQL password: ")

    # Database connection details
    db_params = {
        "host": db_host,
        "database": "postgres",
        "user": "postgres",
        "password": db_password,
        "port": 5432,
    }

    try:
        # Connect to the database
        logger.info(f"Connecting to PostgreSQL at {db_params['host']}...")
        conn = psycopg2.connect(**db_params)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Execute the SQL script
        logger.info("Executing SQL script...")
        cursor.execute(sql_script)

        # Close connection
        cursor.close()
        conn.close()

        logger.info("✅ Database tables created successfully!")
        return 0

    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
