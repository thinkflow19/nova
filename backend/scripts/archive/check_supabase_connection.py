#!/usr/bin/env python3
"""
Test script to check Supabase connection and create the chat_messages table if needed
"""

import os
import logging
import sys
from supabase import create_client, Client
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


def main():
    try:
        # Initialize the Supabase client
        logger.info(f"Initializing Supabase client with URL: {SUPABASE_URL}")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        # Check if the chat_messages table exists
        logger.info("Checking if chat_messages table exists")
        result = (
            supabase.table("chat_messages")
            .select("count", count="exact")
            .limit(1)
            .execute()
        )

        if hasattr(result, "count") and result.count is not None:
            logger.info(f"chat_messages table exists with {result.count} records")
        else:
            logger.warning("chat_messages table does not exist or is empty")
            logger.info(
                "You will need to create the chat_messages table manually in the Supabase dashboard"
            )
            logger.info("Table schema:")
            logger.info(
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

-- Add indexes for performance
CREATE INDEX idx_chat_messages_project_id ON public.chat_messages(project_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Add RLS policies for security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy allowing users to see their own messages or messages in public projects
CREATE POLICY chat_messages_select_policy ON public.chat_messages 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  project_id IN (SELECT id FROM public.projects WHERE is_public = true)
  OR
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);

-- Policy allowing users to insert their own messages
CREATE POLICY chat_messages_insert_policy ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
            """
            )

        # Test creating a project
        logger.info("Testing project creation/existence")
        project_result = supabase.table("projects").select("*").limit(1).execute()

        if hasattr(project_result, "data") and project_result.data:
            logger.info(f"Found existing project: {project_result.data[0]['id']}")
            project_id = project_result.data[0]["id"]
        else:
            logger.warning("No projects found")
            logger.info("Create a project first to test the chat functionality")
            sys.exit(1)

        logger.info("Connection test completed successfully")
        return 0

    except Exception as e:
        logger.error(f"Error during test: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
