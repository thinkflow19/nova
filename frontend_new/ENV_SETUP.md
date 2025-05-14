# Environment Variable Setup Guide

## Required Environment Variables

Create a `.env.local` file in the `frontend_new` directory with the following variables:

```
# API and Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration - Required for authentication
# Get these from your Supabase project dashboard: https://app.supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Feature Flags
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# App Configuration
NEXT_PUBLIC_APP_NAME=Nova AI
NEXT_PUBLIC_APP_DESCRIPTION=Your AI assistant powered by your knowledge
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Use This File

1. Create a new file named `.env.local` in the `frontend_new` directory
2. Copy the contents above into that file
3. Replace the placeholder values with your actual credentials
4. Restart your Next.js development server

## Getting Supabase Credentials

1. Go to your [Supabase dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to Settings > API
4. Copy the URL and anon key from the "Project API keys" section
5. Paste them into your `.env.local` file

## Troubleshooting

If you see authentication errors related to Supabase, check that:

1. You've created the `.env.local` file in the correct location
2. You've entered the correct Supabase URL and anon key
3. You've restarted your Next.js server after creating/modifying the file

For more detailed instructions, see the [Supabase Setup Guide](SUPABASE_SETUP.md). 