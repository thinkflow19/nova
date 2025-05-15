-- Nova Project Database Schema - Part 3: RLS Policies and Triggers

-- Enable RLS for all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinecone_indexes ENABLE ROW LEVEL SECURITY;

-- Projects RLS policies
DROP POLICY IF EXISTS projects_select_policy ON projects;
CREATE POLICY projects_select_policy ON projects 
FOR SELECT 
USING (is_public OR auth.uid() = user_id OR auth.uid() IN (
    SELECT shared_with FROM shared_objects 
    WHERE object_type = 'project' AND object_id = projects.id
));

DROP POLICY IF EXISTS projects_insert_policy ON projects;
CREATE POLICY projects_insert_policy ON projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS projects_update_policy ON projects;
CREATE POLICY projects_update_policy ON projects 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT shared_with FROM shared_objects 
    WHERE object_type = 'project' AND object_id = projects.id AND permission_level IN ('write', 'admin')
));

DROP POLICY IF EXISTS projects_delete_policy ON projects;
CREATE POLICY projects_delete_policy ON projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Documents RLS policies
DROP POLICY IF EXISTS documents_select_policy ON documents;
CREATE POLICY documents_select_policy ON documents 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (SELECT id FROM projects WHERE is_public = true)
    OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR
    auth.uid() IN (
        SELECT shared_with FROM shared_objects 
        WHERE (object_type = 'document' AND object_id = documents.id)
        OR (object_type = 'project' AND object_id = documents.project_id)
    )
);

DROP POLICY IF EXISTS documents_insert_policy ON documents;
CREATE POLICY documents_insert_policy ON documents 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    OR 
    project_id IN (
        SELECT object_id FROM shared_objects 
        WHERE object_type = 'project' 
        AND shared_with = auth.uid() 
        AND permission_level IN ('write', 'admin')
    )
);

DROP POLICY IF EXISTS documents_update_policy ON documents;
CREATE POLICY documents_update_policy ON documents 
FOR UPDATE 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (
        SELECT object_id FROM shared_objects 
        WHERE object_type = 'project' 
        AND shared_with = auth.uid() 
        AND permission_level IN ('write', 'admin')
    )
);

DROP POLICY IF EXISTS documents_delete_policy ON documents;
CREATE POLICY documents_delete_policy ON documents 
FOR DELETE 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (
        SELECT object_id FROM shared_objects 
        WHERE object_type = 'project' 
        AND shared_with = auth.uid() 
        AND permission_level = 'admin'
    )
);

-- Chat Messages RLS policies
DROP POLICY IF EXISTS chat_messages_select_policy ON chat_messages;
CREATE POLICY chat_messages_select_policy ON chat_messages 
FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    project_id IN (SELECT id FROM projects WHERE is_public = true)
    OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR
    auth.uid() IN (
        SELECT shared_with FROM shared_objects 
        WHERE (object_type = 'session' AND object_id = chat_messages.session_id)
        OR (object_type = 'project' AND object_id = chat_messages.project_id)
    )
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

-- Basic policies for other tables
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_profiles_insert ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY user_profiles_delete ON user_profiles FOR DELETE USING (auth.uid() = id);

-- Storage triggers for document cleanup
CREATE OR REPLACE FUNCTION delete_document_data()
RETURNS TRIGGER AS $$
BEGIN
    -- When a document is deleted, schedule a task to clean up Pinecone vectors
    INSERT INTO scheduled_tasks (task_type, params)
    VALUES ('delete_from_pinecone', jsonb_build_object(
        'namespace', OLD.pinecone_namespace,
        'document_id', OLD.id,
        'storage_bucket', OLD.storage_bucket, 
        'storage_path', OLD.storage_path
    ));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_document_delete
BEFORE DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION delete_document_data();

-- Function to handle document status updates
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'indexed' AND OLD.status = 'processing' THEN
        -- Notify when a document has been successfully indexed
        INSERT INTO scheduled_tasks (task_type, params, status)
        VALUES ('notify_document_ready', jsonb_build_object('document_id', NEW.id, 'user_id', NEW.user_id), 'pending');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_document_status_change
AFTER UPDATE OF status ON documents
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_document_status(); 