# Supabase Authentication Setup

## Prerequisites
- A Supabase account (create one at [supabase.com](https://supabase.com) if you don't have one)
- A Supabase project

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard
2. In the left sidebar, click on the "Settings" gear icon
3. Click on "API" in the settings menu
4. You'll find your Project URL and anon/public key in the "Project API keys" section

## Setting Up Environment Variables

Create a `.env.local` file in the root of the frontend_new directory with the following content:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# App settings
NEXT_PUBLIC_APP_NAME=Nova AI
NEXT_PUBLIC_APP_DESCRIPTION=Build AI Agents to Automate Your Workflow
```

Replace `https://your-project-id.supabase.co` with your actual Supabase project URL and `your-anon-key-here` with your anon/public key.

## Setting Up Authentication

The authentication system is already configured to use Supabase in the following files:
- `/src/utils/supabase.js` - The Supabase client configuration
- `/src/utils/auth.js` - Authentication utilities using Supabase

## Testing Authentication

For testing purposes, you'll need to create a user in your Supabase project:

1. Go to your Supabase project dashboard
2. In the left sidebar, click on "Authentication"
3. Go to "Users" tab
4. Click "Add User" and create a test user

You can also enable email confirmations, password recovery, and other authentication features in the "Authentication" > "Providers" section of your Supabase dashboard.

## Auth Features Enabled

- Email/password authentication
- Session management
- User profile data
- Auth state change listeners

## Troubleshooting

If you encounter authentication issues:

1. Check the browser console for errors
2. Verify your Supabase credentials in `.env.local`
3. Make sure your Supabase project has Authentication enabled
4. Check if your user exists and is confirmed in the Supabase dashboard 