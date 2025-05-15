-- Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Create Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, 
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

ALTER TABLE chat_messages 
ADD CONSTRAINT IF NOT EXISTS fk_chat_messages_project_id 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Setup RLS Policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_select_policy ON chat_messages;
CREATE POLICY chat_messages_select_policy ON chat_messages 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  project_id IN (SELECT id FROM projects WHERE is_public = true)
  OR
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS chat_messages_insert_policy ON chat_messages;
CREATE POLICY chat_messages_insert_policy ON chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_messages_update_policy ON chat_messages;
CREATE POLICY chat_messages_update_policy ON chat_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS chat_messages_delete_policy ON chat_messages;
CREATE POLICY chat_messages_delete_policy ON chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select_policy ON projects;
CREATE POLICY projects_select_policy ON projects 
FOR SELECT 
USING (is_public OR auth.uid() = user_id);

DROP POLICY IF EXISTS projects_insert_policy ON projects;
CREATE POLICY projects_insert_policy ON projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS projects_update_policy ON projects;
CREATE POLICY projects_update_policy ON projects 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS projects_delete_policy ON projects;
CREATE POLICY projects_delete_policy ON projects 
FOR DELETE 
USING (auth.uid() = user_id); 