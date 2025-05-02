# Nova Supabase Database Setup Guide

## Overview
This guide will help you set up the Supabase database for Nova with all the necessary tables, indexes, and security policies. Instead of using mock data, this will create a proper production-ready database setup.

## Prerequisites
- A Supabase account
- A Supabase project created for Nova
- Admin access to your Supabase project

## Step 1: Access SQL Editor in Supabase
1. Log in to your Supabase account at [https://supabase.com](https://supabase.com)
2. Select your project from the dashboard
3. In the left sidebar, click on **SQL Editor**
4. Click **New Query** to create a new SQL script

## Step 2: Paste and Run the SQL Script
1. Copy the entire contents of the `supabase_setup.sql` file
2. Paste it into the SQL Editor
3. Click **Run** or press Ctrl+Enter (Cmd+Enter on Mac) to execute the script

This script will:
- Create all required tables (users, projects, documents, chat_history)
- Set up Row Level Security (RLS) policies
- Create necessary indexes for performance
- Grant appropriate permissions
- Create a test user (optional)

## Step 3: Verify the Setup
After running the script, you should be able to see the newly created tables in the **Table Editor** section of Supabase.

Check for the following tables:
- users
- projects
- documents
- chat_history

## Step 4: Update Your .env File

Ensure your `.env` file has these correct Supabase credentials:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these values in your Supabase project settings:
1. Go to **Project Settings** > **API**
2. Copy the **Project URL** value to `SUPABASE_URL`
3. Copy the **service_role secret** value to `SUPABASE_SERVICE_ROLE_KEY`

## Step 5: Restart Your Nova Application

After completing these steps, restart your Nova application:

```bash
bash relaunch.sh
```

## Test User (Optional)

If you included the test user in your SQL script, you can log in with:
- Email: test@example.com
- Password: test123

## Troubleshooting

### Tables Not Created
- Check the SQL Editor console for any error messages
- Ensure you have the necessary permissions in your Supabase project

### Connection Issues
- Verify your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` values
- Check that your Supabase project is active and not in maintenance mode

### Authentication Problems
- If Supabase Auth doesn't work, ensure the Auth settings are configured properly in your Supabase dashboard
- Check that the JWT secret is correct in your Nova application 