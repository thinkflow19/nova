# Nova AI Feature Setup Guide

This guide will help you enable all features in the Nova AI platform including insights, knowledge management, document upload, agents, and chat functionality.

## Environment Variables Setup

All features in Nova AI are controlled through environment variables. To enable all features, follow these steps:

1. Create a `.env.local` file in the `frontend_new` directory with the following content:

```
# API and Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration - Required for authentication
# Replace with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Feature Flags - Enable all features
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_INSIGHTS=true
NEXT_PUBLIC_ENABLE_KNOWLEDGE=true
NEXT_PUBLIC_ENABLE_DOC_UPLOAD=true
NEXT_PUBLIC_ENABLE_AGENTS=true
NEXT_PUBLIC_ENABLE_CHAT=true

# App Configuration
NEXT_PUBLIC_APP_NAME=Nova AI
NEXT_PUBLIC_APP_DESCRIPTION=Your AI assistant powered by your knowledge
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. Replace the Supabase URL and anon key with your actual credentials (see [Supabase Setup Guide](SUPABASE_SETUP.md)).

3. Save the file and restart your Next.js development server:

```bash
# First kill any existing Next.js processes
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Then start the development server
npm run dev
```

## Feature Overview

Once enabled, you'll have access to these features:

### 1. Chat
The core AI chat interface for conversing with your AI assistant. Access it from the dashboard or directly at `/chat`.

### 2. Agents
Create specialized AI agents with different personalities, knowledge bases, and capabilities. Access from the dashboard navigation.

### 3. Knowledge Management
Upload documents, create knowledge bases, and manage the information your AI can access. Your agents can use this knowledge to provide more accurate responses.

### 4. Document Upload
Upload various document types (PDF, DOCX, TXT) to build your knowledge base. This feature is part of the Knowledge Management section.

### 5. Insights
Get analytics and insights about your AI usage, popular topics, and user interactions.

## Troubleshooting

If you encounter issues:

1. **Features not appearing**: Ensure all environment variables are properly set in `.env.local`
2. **Authentication problems**: Verify your Supabase credentials
3. **API connection issues**: Confirm the backend is running on the specified URL
4. **Clear cache**: If changes don't take effect, try clearing your browser cache or running:
   ```bash
   npm run clean
   npm run dev
   ```

5. **Check for errors**: Look for errors in your browser console or the terminal running Next.js

## Need More Help?

If you're still experiencing issues, refer to the README.md file or the UI_DEVELOPMENT_GUIDE.md for more detailed information. 