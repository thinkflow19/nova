#!/usr/bin/env python3
"""
Vendor-agnostic database setup script.
Supports PostgreSQL, MySQL, and SQLite through configurable adapters.
"""

import os
import sys
import logging
import argparse
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from dotenv import load_dotenv
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


# Database adapter abstract base class
class DatabaseAdapter(ABC):
    """Abstract base class for database adapters"""

    @abstractmethod
    def connect(self) -> Any:
        """Connect to the database"""
        pass

    @abstractmethod
    def execute_statement(self, statement: str) -> bool:
        """Execute a SQL statement"""
        pass

    @abstractmethod
    def close(self) -> None:
        """Close the database connection"""
        pass

    @abstractmethod
    def apply_security_policies(self) -> bool:
        """Apply security policies specific to the database"""
        pass

    def execute_script(self, script_path: str) -> bool:
        """Execute a SQL script file"""
        try:
            with open(script_path, "r") as f:
                statements = self._split_sql_script(f.read())

            success_count = 0
            total_statements = len([s for s in statements if s.strip()])
            for statement in statements:
                if statement.strip():
                    # Make sure all CREATE TABLE statements use IF NOT EXISTS
                    if (
                        statement.strip().upper().startswith("CREATE TABLE")
                        and "IF NOT EXISTS" not in statement.upper()
                    ):
                        statement = statement.replace(
                            "CREATE TABLE", "CREATE TABLE IF NOT EXISTS", 1
                        )
                        logger.info(
                            "Added IF NOT EXISTS to CREATE TABLE statement for data safety"
                        )

                    if self.execute_statement(statement):
                        success_count += 1

            if success_count == total_statements:
                logger.info(f"Successfully executed all {success_count} SQL statements")
            else:
                logger.warning(
                    f"Executed {success_count} out of {total_statements} SQL statements"
                )

            return (
                success_count > 0
            )  # Consider success if at least one statement worked
        except Exception as e:
            logger.error(f"Error executing script: {str(e)}")
            return False

    def _split_sql_script(self, script: str) -> List[str]:
        """Split a SQL script into individual statements"""
        # Basic splitting by semicolon - may need refinement for complex scripts
        return [s.strip() for s in script.split(";") if s.strip()]


# PostgreSQL adapter
class PostgresAdapter(DatabaseAdapter):
    """PostgreSQL database adapter"""

    def __init__(self, connection_string: Optional[str] = None):
        """Initialize with connection parameters"""
        self.connection_string = connection_string
        self.conn = None
        self.cursor = None

        if not connection_string:
            # Try to construct connection string from individual parameters
            db_host = os.getenv("DB_HOST") or os.getenv("POSTGRES_HOST")
            db_port = os.getenv("DB_PORT") or os.getenv("POSTGRES_PORT", "5432")
            db_name = os.getenv("DB_NAME") or os.getenv("POSTGRES_DB", "postgres")
            db_user = os.getenv("DB_USER") or os.getenv("POSTGRES_USER", "postgres")
            db_password = (
                os.getenv("DB_PASSWORD")
                or os.getenv("POSTGRES_PASSWORD")
                or os.getenv("SUPABASE_POSTGRES_PASSWORD")
            )

            if db_host and db_password:
                self.connection_string = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
            else:
                # Check for Supabase-specific connection
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_password = os.getenv("SUPABASE_DB_PASSWORD") or os.getenv(
                    "SUPABASE_POSTGRES_PASSWORD"
                )

                if supabase_url and supabase_password:
                    # Extract host from Supabase URL
                    # https://xxxxx.supabase.co -> db.xxxxx.supabase.co
                    if supabase_url.startswith("https://"):
                        host = supabase_url[8:].split(".")[0]
                        self.connection_string = (
                            f"postgresql://postgres:{supabase_password}"
                            f"@db.{host}.supabase.co:5432/postgres"
                        )

    def connect(self) -> Any:
        """Connect to PostgreSQL database"""
        try:
            import psycopg2

            if not self.connection_string:
                raise ValueError("PostgreSQL connection string not configured")

            logger.info(
                f"Connecting to PostgreSQL at {self.connection_string.split('@')[1]}"
            )
            self.conn = psycopg2.connect(self.connection_string)
            self.conn.autocommit = True
            self.cursor = self.conn.cursor()
            return self.conn
        except ImportError:
            logger.error(
                "psycopg2 module not found. Please install it with: pip install psycopg2-binary"
            )
            sys.exit(1)
        except Exception as e:
            logger.error(f"PostgreSQL connection error: {str(e)}")
            raise

    def execute_statement(self, statement: str) -> bool:
        """Execute a SQL statement"""
        try:
            if not self.cursor:
                self.connect()

            self.cursor.execute(statement)
            return True
        except Exception as e:
            # Skip certain errors that are expected during table creation
            error_text = str(e).lower()
            if "duplicate" in error_text or "already exists" in error_text:
                logger.warning(f"Object already exists, continuing: {error_text}")
                return True
            logger.error(f"Error executing statement: {str(e)}")
            logger.error(f"Statement: {statement}")
            return False

    def close(self) -> None:
        """Close the database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("PostgreSQL connection closed")

    def apply_security_policies(self) -> bool:
        """Apply PostgreSQL/Supabase-specific security policies"""
        policies = [
            """
            ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
            """,
            """
            CREATE POLICY IF NOT EXISTS chat_messages_select_policy ON chat_messages 
            FOR SELECT 
            USING (
              auth.uid() = user_id 
              OR 
              project_id IN (SELECT id FROM projects WHERE is_public = true)
              OR
              project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
            );
            """,
            """
            CREATE POLICY IF NOT EXISTS chat_messages_insert_policy ON chat_messages 
            FOR INSERT 
            WITH CHECK (auth.uid() = user_id);
            """,
            """
            GRANT SELECT, INSERT ON chat_messages TO authenticated;
            """,
            """
            ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
            """,
            """
            CREATE POLICY IF NOT EXISTS projects_select_policy ON projects
            FOR SELECT 
            USING (is_public OR user_id = auth.uid());
            """,
            """
            CREATE POLICY IF NOT EXISTS projects_insert_policy ON projects
            FOR INSERT 
            WITH CHECK (user_id = auth.uid());
            """,
            """
            GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
            """,
        ]

        success_count = 0
        for policy in policies:
            if self.execute_statement(policy):
                success_count += 1

        return success_count == len(policies)


# SQLite adapter
class SQLiteAdapter(DatabaseAdapter):
    """SQLite database adapter"""

    def __init__(self, db_path: Optional[str] = None):
        """Initialize with database path"""
        self.db_path = db_path or os.getenv("SQLITE_PATH", "app.db")
        self.conn = None
        self.cursor = None

    def connect(self) -> Any:
        """Connect to SQLite database"""
        try:
            import sqlite3

            logger.info(f"Connecting to SQLite database: {self.db_path}")
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()

            # Enable foreign keys
            self.cursor.execute("PRAGMA foreign_keys = ON;")

            return self.conn
        except ImportError:
            logger.error(
                "sqlite3 module not found. This should be included in standard Python."
            )
            sys.exit(1)
        except Exception as e:
            logger.error(f"SQLite connection error: {str(e)}")
            raise

    def execute_statement(self, statement: str) -> bool:
        """Execute a SQL statement"""
        try:
            if not self.cursor:
                self.connect()

            # Adjust statement for SQLite compatibility
            adjusted_statement = self._adjust_for_sqlite(statement)

            self.cursor.execute(adjusted_statement)
            self.conn.commit()
            return True
        except Exception as e:
            # Skip certain errors that are expected during table creation
            error_text = str(e).lower()
            if "already exists" in error_text:
                logger.warning(f"Object already exists, continuing: {error_text}")
                return True
            logger.error(f"Error executing statement: {str(e)}")
            logger.error(f"Statement: {statement}")
            return False

    def _adjust_for_sqlite(self, statement: str) -> str:
        """Adjust PostgreSQL syntax for SQLite compatibility"""
        # Replace PostgreSQL-specific syntax
        statement = statement.replace("UUID", "TEXT")
        statement = statement.replace("TIMESTAMP WITH TIME ZONE", "TIMESTAMP")

        # Remove IF NOT EXISTS from INDEX creation (SQLite doesn't support it)
        if "CREATE INDEX IF NOT EXISTS" in statement:
            statement = statement.replace("IF NOT EXISTS", "")

        # Remove unsupported features
        if "ENABLE ROW LEVEL SECURITY" in statement:
            return ""  # Skip this statement
        if "CREATE POLICY" in statement:
            return ""  # Skip this statement
        if "GRANT" in statement:
            return ""  # Skip this statement

        return statement

    def close(self) -> None:
        """Close the database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("SQLite connection closed")

    def apply_security_policies(self) -> bool:
        """SQLite doesn't support row-level security"""
        logger.info("SQLite doesn't support security policies - skipping")
        return True


# MySQL adapter
class MySQLAdapter(DatabaseAdapter):
    """MySQL database adapter"""

    def __init__(self, connection_params: Optional[Dict[str, Any]] = None):
        """Initialize with connection parameters"""
        self.connection_params = connection_params or {}
        self.conn = None
        self.cursor = None

        if not connection_params:
            # Try to get connection parameters from environment
            host = os.getenv("MYSQL_HOST") or os.getenv("DB_HOST")
            port = int(os.getenv("MYSQL_PORT") or os.getenv("DB_PORT", "3306"))
            user = os.getenv("MYSQL_USER") or os.getenv("DB_USER", "root")
            password = os.getenv("MYSQL_PASSWORD") or os.getenv("DB_PASSWORD", "")
            database = os.getenv("MYSQL_DATABASE") or os.getenv("DB_NAME", "app")

            if host:
                self.connection_params = {
                    "host": host,
                    "port": port,
                    "user": user,
                    "password": password,
                    "database": database,
                }

    def connect(self) -> Any:
        """Connect to MySQL database"""
        try:
            import mysql.connector

            if not self.connection_params or "host" not in self.connection_params:
                raise ValueError("MySQL connection parameters not configured")

            logger.info(
                f"Connecting to MySQL at {self.connection_params['host']}:{self.connection_params['port']}"
            )
            self.conn = mysql.connector.connect(**self.connection_params)
            self.cursor = self.conn.cursor()
            return self.conn
        except ImportError:
            logger.error(
                "mysql-connector-python module not found. Please install it with: pip install mysql-connector-python"
            )
            sys.exit(1)
        except Exception as e:
            logger.error(f"MySQL connection error: {str(e)}")
            raise

    def execute_statement(self, statement: str) -> bool:
        """Execute a SQL statement"""
        try:
            if not self.cursor:
                self.connect()

            # Adjust statement for MySQL compatibility
            adjusted_statement = self._adjust_for_mysql(statement)

            if not adjusted_statement:
                return True  # Skip empty statements

            self.cursor.execute(adjusted_statement)
            self.conn.commit()
            return True
        except Exception as e:
            # Skip certain errors that are expected during table creation
            error_text = str(e).lower()
            if "already exists" in error_text:
                logger.warning(f"Object already exists, continuing: {error_text}")
                return True
            logger.error(f"Error executing statement: {str(e)}")
            logger.error(f"Statement: {statement}")
            return False

    def _adjust_for_mysql(self, statement: str) -> str:
        """Adjust PostgreSQL syntax for MySQL compatibility"""
        # Replace PostgreSQL-specific syntax
        statement = statement.replace("UUID", "VARCHAR(36)")
        statement = statement.replace("TIMESTAMP WITH TIME ZONE", "TIMESTAMP")
        statement = statement.replace("BOOLEAN", "TINYINT(1)")
        statement = statement.replace("TEXT", "LONGTEXT")
        statement = statement.replace("JSON", "JSON")

        # Skip unsupported features
        if "ENABLE ROW LEVEL SECURITY" in statement:
            return ""  # Skip this statement
        if "CREATE POLICY" in statement:
            return ""  # Skip this statement
        if "auth.uid()" in statement:
            return ""  # Skip this statement

        return statement

    def close(self) -> None:
        """Close the database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        logger.info("MySQL connection closed")

    def apply_security_policies(self) -> bool:
        """MySQL doesn't support row-level security like PostgreSQL"""
        logger.info("MySQL doesn't support Postgres-style security policies - skipping")
        return True


# Factory for creating database adapters
def get_database_adapter(db_type: str) -> DatabaseAdapter:
    """Get the appropriate database adapter based on type"""
    if db_type.lower() == "postgres" or db_type.lower() == "postgresql":
        return PostgresAdapter()
    elif db_type.lower() == "sqlite":
        return SQLiteAdapter()
    elif db_type.lower() == "mysql":
        return MySQLAdapter()
    else:
        raise ValueError(f"Unsupported database type: {db_type}")


def create_database_tables(db_type: str) -> bool:
    """Create database tables using the specified adapter"""

    adapter = get_database_adapter(db_type)

    try:
        # Connect to the database
        adapter.connect()

        # Get the path to the schema file
        script_dir = os.path.dirname(os.path.abspath(__file__))
        schema_path = os.path.join(script_dir, "schema.sql")

        # Execute the schema script
        logger.info(f"Executing schema script: {schema_path}")
        result = adapter.execute_script(schema_path)

        if result:
            logger.info("Schema created successfully")
        else:
            logger.warning("Schema creation had some issues")

        # Apply security policies if supported
        logger.info("Applying security policies")
        policy_result = adapter.apply_security_policies()

        if policy_result:
            logger.info("Security policies applied successfully")
        else:
            logger.warning("Security policy application had some issues")

        # Close the connection
        adapter.close()

        return result and policy_result

    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        return False


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Create database tables")
    parser.add_argument(
        "--db-type",
        choices=["postgres", "postgresql", "sqlite", "mysql"],
        default=os.getenv("DB_TYPE", "postgres"),
        help="Database type (postgres, sqlite, mysql)",
    )

    args = parser.parse_args()

    logger.info(f"Creating database tables using {args.db_type} adapter")

    if create_database_tables(args.db_type):
        logger.info("✅ Database setup completed successfully")
        return 0
    else:
        logger.error("❌ Database setup failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
