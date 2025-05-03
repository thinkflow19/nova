-- Nova Project Database Schema - Part 2: Create Indexes

-- Gin indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_project_config ON projects USING GIN (model_config);
CREATE INDEX IF NOT EXISTS idx_document_metadata ON documents USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_message_metadata ON chat_messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_agent_skills ON ai_agents USING GIN (skills);

-- Regular indexes for foreign keys and common query fields
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_namespace ON documents(pinecone_namespace);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_indexed ON chat_messages(is_indexed);
CREATE INDEX IF NOT EXISTS idx_shared_objects_object_id ON shared_objects(object_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_user_id ON shared_objects(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_objects_shared_with ON shared_objects(shared_with);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id_date ON user_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_type ON scheduled_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_integrations_user_id ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(integration_type);
CREATE INDEX IF NOT EXISTS idx_pinecone_indexes_name ON pinecone_indexes(index_name); 