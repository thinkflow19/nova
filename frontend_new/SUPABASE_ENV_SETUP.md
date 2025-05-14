# Supabase Environment Setup

## Error
You're seeing the error: "Supabase URL and anon key are required. Check your environment variables" because the application can't find the necessary Supabase credentials.

## Solution
Create or update your `.env.local` file in the `frontend_new` directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Replace the placeholder values with your actual Supabase URL and anon key.

## Where to get these values
1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Navigate to Settings > API
4. Copy the URL and anon key from the "Project API keys" section

## Additional Environment Variables
For complete functionality, consider adding these variables too:

```
# API and Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_AUTH=true
NEXT_PUBLIC_ENABLE_ANALYTICS=false

# App Configuration
NEXT_PUBLIC_APP_NAME=Nova AI
NEXT_PUBLIC_APP_DESCRIPTION=Your AI assistant powered by your knowledge
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

After adding these variables, restart your Next.js development server. 