#!/usr/bin/env python3
"""
Nova Project - Database Setup Script

This script sets up the database structure for the Nova project:
1. Creates tables in Supabase PostgreSQL database
2. Sets up Pinecone index for vector search

Requirements:
- A Supabase project with service role key
- A Pinecone API key and environment
- Environment variables set in .env file

Usage:
python setup_nova_db.py [--supabase-only] [--pinecone-only]
"""

import os
import sys
import time
import argparse
from datetime import datetime
from dotenv import load_dotenv
import requests
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import pinecone  # Newer version

# Load environment variables from .env file
load_dotenv()

# Get credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT", "gcp-starter")

# Constants
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "nova-embeddings")
PINECONE_DIMENSION = int(
    os.getenv("PINECONE_DIMENSION", "1536")
)  # OpenAI embeddings dimension


# Check required environment variables
def check_env_vars(setup_type):
    missing_vars = []

    if setup_type in ["all", "supabase"]:
        if not SUPABASE_URL:
            missing_vars.append("SUPABASE_URL")
        if not SUPABASE_SERVICE_KEY:
            missing_vars.append("SUPABASE_SERVICE_KEY")
        if not SUPABASE_DB_PASSWORD:
            missing_vars.append("SUPABASE_DB_PASSWORD")

    if setup_type in ["all", "pinecone"]:
        if not PINECONE_API_KEY:
            missing_vars.append("PINECONE_API_KEY")

    if missing_vars:
        print(
            f"Error: The following environment variables are missing: {', '.join(missing_vars)}"
        )
        print("Please set these variables in your .env file or environment.")
        sys.exit(1)


# Supabase connection information
def get_supabase_connection_info():
    if not SUPABASE_URL:
        return None, None, None

    # Extract project ref from URL
    # Example: https://project-ref.supabase.co
    project_ref = SUPABASE_URL.split("//")[1].split(".")[0]
    host = f"{project_ref}.supabase.co"
    database = "postgres"
    user = "postgres"
    port = 5432

    return host, database, user


# Function to verify Supabase API access
def verify_supabase_api():
    endpoint = f"{SUPABASE_URL}/rest/v1/"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    }

    try:
        response = requests.get(endpoint, headers=headers)
        if response.status_code == 200:
            print("✅ Successfully connected to Supabase API")
            return True
        else:
            print(
                f"❌ Error connecting to Supabase API: {response.status_code} {response.text}"
            )
            return False
    except Exception as e:
        print(f"❌ Exception while connecting to Supabase: {e}")
        return False


# Create Supabase PostgreSQL connection
def create_supabase_db_connection():
    host, database, user = get_supabase_connection_info()

    try:
        # Verify API connection first
        if not verify_supabase_api():
            print("Could not verify Supabase API connection. Exiting.")
            return None

        # Connect to PostgreSQL
        conn = psycopg2.connect(
            host=host,
            database=database,
            user=user,
            password=SUPABASE_DB_PASSWORD,
            port=5432,
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        print("✅ Successfully connected to Supabase PostgreSQL database")
        return conn
    except Exception as e:
        print(f"❌ Error connecting to Supabase database: {e}")
        return None


# Execute SQL commands
def execute_sql_commands(conn, commands, command_type):
    cursor = conn.cursor()
    success_count = 0
    error_count = 0

    print(f"\n=== Executing {command_type} Commands ===")
    for i, command in enumerate(commands):
        try:
            print(f"Running {command_type} command {i+1}/{len(commands)}...")
            cursor.execute(command)
            success_count += 1
        except Exception as e:
            print(f"❌ Error executing command: {e}")
            print(f"Command was: {command[:150]}...")
            error_count += 1

            # Continue with other commands even if some fail
            continue

    cursor.close()
    print(
        f"Completed {command_type} commands: {success_count} successful, {error_count} failed"
    )
    return success_count, error_count


# Setup Supabase Database
def setup_supabase():
    print("\n🔷 SETTING UP SUPABASE DATABASE")
    print(f"URL: {SUPABASE_URL}")

    # Connect to the database
    conn = create_supabase_db_connection()
    if not conn:
        print("Failed to connect to the database. Exiting.")
        return False

    try:
        # Read SQL from file
        sql_file_path = os.path.join(
            os.path.dirname(__file__), "optimized_rag_schema.sql"
        )

        if not os.path.exists(sql_file_path):
            print(f"❌ SQL file not found: {sql_file_path}")
            return False

        with open(sql_file_path, "r") as file:
            sql_content = file.read()

        # Split SQL content into commands
        # Simple split by semicolon won't work for complex SQL with functions
        # This is a basic approach - for production, use a proper SQL parser
        sql_commands = []
        current_command = ""

        for line in sql_content.split("\n"):
            line = line.strip()

            # Skip comments
            if line.startswith("--") or not line:
                continue

            current_command += line + " "

            # Function definitions or blocks need special handling
            if (
                "CREATE OR REPLACE FUNCTION" in current_command
                and not "LANGUAGE plpgsql;" in current_command
            ):
                continue

            if "BEGIN" in current_command and not "END;" in current_command:
                continue

            if line.endswith(";"):
                sql_commands.append(current_command.strip())
                current_command = ""

        # Execute all SQL commands
        start_time = time.time()
        success_count, error_count = execute_sql_commands(conn, sql_commands, "SQL")
        end_time = time.time()

        # Summary
        print("\n=== Supabase Setup Summary ===")
        print(f"Commands: {success_count} successful, {error_count} failed")
        print(f"Total execution time: {(end_time - start_time):.2f} seconds")

        if error_count == 0:
            print("🎉 Supabase database setup completed successfully!")
            return True
        else:
            print("⚠️ Supabase database setup completed with some errors.")
            return False

    except Exception as e:
        print(f"❌ Error during Supabase setup: {e}")
        return False
    finally:
        # Close the connection
        if conn:
            conn.close()
            print("Database connection closed")


# Setup Pinecone
def setup_pinecone():
    print("\n🔷 SETTING UP PINECONE VECTOR DATABASE")
    print(f"Index Name: {PINECONE_INDEX_NAME}")
    print(f"Environment: {PINECONE_ENVIRONMENT}")
    print(f"Dimension: {PINECONE_DIMENSION}")

    try:
        # Initialize Pinecone client (v6.x.x API)
        pinecone.init(api_key=PINECONE_API_KEY, environment=PINECONE_ENVIRONMENT)

        # Check if index already exists
        indexes = pinecone.list_indexes()

        if PINECONE_INDEX_NAME in indexes:
            print(f"✅ Pinecone index '{PINECONE_INDEX_NAME}' already exists")
            # Get index stats
            index = pinecone.Index(PINECONE_INDEX_NAME)
            stats = index.describe_index_stats()
            print(f"Index stats: {stats}")
            return True
        else:
            print(f"Creating new Pinecone index '{PINECONE_INDEX_NAME}'...")

            # Create a new index with the OpenAI embedding dimension
            pinecone.create_index(
                name=PINECONE_INDEX_NAME, dimension=PINECONE_DIMENSION, metric="cosine"
            )

            # Wait for index to be created (this can take a minute or two)
            print("Waiting for index to be initialized...")
            attempts = 0
            while attempts < 10:
                try:
                    # Try to connect to the index
                    index = pinecone.Index(PINECONE_INDEX_NAME)
                    stats = index.describe_index_stats()
                    print(
                        f"✅ Pinecone index '{PINECONE_INDEX_NAME}' created successfully!"
                    )
                    print(f"Index stats: {stats}")
                    return True
                except Exception:
                    attempts += 1
                    print(f"Waiting for index to be ready (attempt {attempts}/10)...")
                    time.sleep(10)

            print(
                f"⚠️ Index '{PINECONE_INDEX_NAME}' created but not confirmed ready after waiting"
            )
            return True

    except Exception as e:
        print(f"❌ Error setting up Pinecone: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Set up Nova databases in Supabase and/or Pinecone"
    )
    parser.add_argument(
        "--supabase-only", action="store_true", help="Only set up Supabase database"
    )
    parser.add_argument(
        "--pinecone-only", action="store_true", help="Only set up Pinecone index"
    )
    args = parser.parse_args()

    print(
        f"Nova Project Database Setup - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    # Determine what to set up
    setup_type = "all"
    if args.supabase_only:
        setup_type = "supabase"
    elif args.pinecone_only:
        setup_type = "pinecone"

    # Check environment variables
    check_env_vars(setup_type)

    # Setup Supabase
    supabase_success = True
    if setup_type in ["all", "supabase"]:
        supabase_success = setup_supabase()

    # Setup Pinecone
    pinecone_success = True
    if setup_type in ["all", "pinecone"]:
        pinecone_success = setup_pinecone()

    # Final summary
    print("\n=== 🏁 Setup Complete ===")
    if setup_type in ["all", "supabase"]:
        print(f"Supabase Database: {'✅ SUCCESS' if supabase_success else '❌ FAILED'}")
    if setup_type in ["all", "pinecone"]:
        print(
            f"Pinecone Vector DB: {'✅ SUCCESS' if pinecone_success else '❌ FAILED'}"
        )

    if not (supabase_success and pinecone_success):
        sys.exit(1)


if __name__ == "__main__":
    main()
