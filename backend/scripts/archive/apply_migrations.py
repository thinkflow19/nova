#!/usr/bin/env python3
"""
Database migration script for the Python Chat RAG application
Executes SQL files in the migrations directory against the Supabase database
"""

import os
import sys
import logging
import requests
from dotenv import load_dotenv
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing Supabase URL or Service Role Key in environment variables.")
    sys.exit(1)


def execute_sql_file(file_path):
    """Execute an SQL file against the Supabase database"""
    try:
        with open(file_path, "r") as f:
            sql_content = f.read()

        logger.info(f"Executing SQL file: {file_path}")

        # Prepare the request to Supabase SQL API
        headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
        }

        # Split the SQL into separate statements
        # This is a simple approach and may need refinement for complex SQL files
        statements = [stmt.strip() for stmt in sql_content.split(";") if stmt.strip()]

        success = True
        for i, statement in enumerate(statements):
            if not statement.strip():
                continue

            data = {"query": statement}

            # Execute the SQL directly using the SQL API
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/sql", headers=headers, json=data
            )

            if response.status_code >= 400:
                logger.error(f"Error executing SQL statement {i+1}: {response.text}")
                success = False
            else:
                logger.info(f"Successfully executed SQL statement {i+1}")

        if success:
            logger.info(f"Successfully executed SQL file: {file_path}")
        else:
            logger.error(f"Errors occurred while executing SQL file: {file_path}")

        return success

    except Exception as e:
        logger.error(f"Error processing file {file_path}: {str(e)}")
        return False


def main():
    """Main function to apply database migrations"""
    parser = argparse.ArgumentParser(description="Apply database migrations")
    parser.add_argument("--file", help="Apply a specific migration file")
    parser.add_argument("--all", action="store_true", help="Apply all migration files")

    args = parser.parse_args()

    # Get directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Migration files directory
    migrations_dir = os.path.join(os.path.dirname(script_dir), "migrations")

    if not os.path.exists(migrations_dir):
        logger.error(f"Migrations directory not found: {migrations_dir}")
        sys.exit(1)

    # Apply specific file
    if args.file:
        file_path = os.path.join(migrations_dir, args.file)
        if not os.path.exists(file_path):
            logger.error(f"Migration file not found: {file_path}")
            sys.exit(1)

        if execute_sql_file(file_path):
            logger.info(f"Successfully applied migration: {args.file}")
        else:
            logger.error(f"Failed to apply migration: {args.file}")
            sys.exit(1)

    # Apply all migration files
    elif args.all:
        migration_files = [f for f in os.listdir(migrations_dir) if f.endswith(".sql")]
        migration_files.sort()  # Apply in alphabetical order

        success_count = 0
        fail_count = 0

        for file_name in migration_files:
            file_path = os.path.join(migrations_dir, file_name)
            if execute_sql_file(file_path):
                success_count += 1
            else:
                fail_count += 1

        logger.info(
            f"Migration complete. Success: {success_count}, Failed: {fail_count}"
        )

        if fail_count > 0:
            sys.exit(1)

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
