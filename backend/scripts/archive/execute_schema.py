#!/usr/bin/env python3
"""
Script to execute the database schema in the correct order.
This helps avoid the "column does not exist" error by separating the schema into parts.
"""

import os
import sys
import subprocess
import argparse


def run_sql_file(file_path, database_url=None):
    """Run a SQL file using psql."""
    if database_url:
        cmd = ["psql", database_url, "-f", file_path]
    else:
        cmd = ["psql", "-f", file_path]

    print(f"Executing: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"Error executing {file_path}:")
        print(result.stderr)
        return False

    print(f"Successfully executed {file_path}")
    print(result.stdout)
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Execute database schema in the correct order"
    )
    parser.add_argument(
        "--database-url",
        type=str,
        help="Database URL (e.g., postgres://user:pass@host:port/dbname)",
    )
    args = parser.parse_args()

    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the SQL files in order
    sql_files = [
        os.path.join(script_dir, "tables.sql"),  # First create tables
        os.path.join(script_dir, "indexes.sql"),  # Then create indexes
        os.path.join(
            script_dir, "policies_triggers.sql"
        ),  # Finally add policies and triggers
    ]

    # Check if files exist
    for file_path in sql_files:
        if not os.path.exists(file_path):
            print(f"Error: File {file_path} does not exist.")
            return False

    # Execute each file in order
    for file_path in sql_files:
        success = run_sql_file(file_path, args.database_url)
        if not success:
            print(f"Failed to execute {file_path}. Stopping.")
            return False

    print("Schema created successfully!")
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
