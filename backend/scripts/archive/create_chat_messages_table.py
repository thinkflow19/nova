#!/usr/bin/env python3
"""
Script to create the chat_messages table directly in Supabase using an SQL query
"""

import os
import sys
import logging
import requests
from dotenv import load_dotenv

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


def create_chat_messages_table():
    """Create the chat_messages table in Supabase"""

    # SQL statements to create the table
    tables = [
        """
        CREATE TABLE IF NOT EXISTS public.chat_messages (
            id UUID PRIMARY KEY,
            project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL, 
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            metadata JSONB
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON public.chat_messages(project_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
        """,
        """
        ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
        """,
        """
        CREATE POLICY chat_messages_select_policy ON public.chat_messages 
        FOR SELECT 
        USING (
          auth.uid() = user_id 
          OR 
          project_id IN (SELECT id FROM public.projects WHERE is_public = true)
          OR
          project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
        );
        """,
        """
        CREATE POLICY chat_messages_insert_policy ON public.chat_messages 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
        """,
        """
        GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
        """,
    ]

    # Headers for the API request
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }

    success_count = 0
    total_statements = len(tables)

    for i, sql in enumerate(tables):
        try:
            logger.info(f"Executing SQL statement {i+1} of {total_statements}")

            # Make the API request
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/sql", headers=headers, json={"query": sql}
            )

            # Check if the request was successful
            if response.status_code < 400:
                logger.info(f"Statement {i+1} executed successfully")
                success_count += 1
            else:
                logger.error(f"Error executing statement {i+1}: {response.text}")

                # If the error is because the table already exists, continue
                if "already exists" in response.text:
                    logger.warning("Table or index already exists, continuing...")
                    success_count += 1
        except Exception as e:
            logger.error(f"Exception executing statement {i+1}: {str(e)}")

    logger.info(
        f"Table creation complete. Successful statements: {success_count}/{total_statements}"
    )

    if success_count < total_statements:
        return False
    else:
        return True


def main():
    """Run the table creation script"""
    logger.info("Creating chat_messages table in Supabase...")

    if create_chat_messages_table():
        logger.info("Table creation successful!")
        return 0
    else:
        logger.error("Table creation had errors. Check the logs.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
