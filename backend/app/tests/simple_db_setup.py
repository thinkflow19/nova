"""
THIS IS A SQL SCRIPT TO RUN IN THE SUPABASE DASHBOARD

Follow these steps:
1. Log in to your Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Paste the SQL below
5. Run the query
6. Re-run the integration tests
"""

CREATE_PROJECTS_TABLE_SQL = """
-- Create projects table in the api schema
CREATE TABLE IF NOT EXISTS api.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    user_id UUID,
    is_public BOOLEAN DEFAULT false
);

-- Add comments to the table
COMMENT ON TABLE api.projects IS 'User projects for document storage and analysis';

-- Grant permissions (since we're in api schema)
GRANT ALL ON api.projects TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON api.projects TO authenticated;
"""

if __name__ == "__main__":
    print("=" * 80)
    print("SUPABASE SQL SETUP")
    print("=" * 80)
    print("\nPlease run this SQL in your Supabase Dashboard's SQL Editor:\n")
    print(CREATE_PROJECTS_TABLE_SQL)
    print("\nAfter running the SQL, re-run the integration tests.")
    print("=" * 80) 