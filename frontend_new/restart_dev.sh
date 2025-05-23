#!/bin/bash

echo "🔄 Restarting Nova AI Development Server..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Kill any running Next.js processes on port 3000
echo "🛑 Stopping any running Next.js processes..."
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null || echo "No process running on port 3000"

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
npm run clean

# Install or update dependencies if needed
echo "📦 Checking dependencies..."
npm install

# Create a basic .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
  echo "📝 Creating a basic .env.local file..."
  cat > .env.local << EOL
# API and Backend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags - All enabled by default
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
EOL
  echo "⚠️ WARNING: You need to add your Supabase credentials to .env.local"
  echo "🔗 See SUPABASE_SETUP.md for instructions"
fi

# Start the development server
echo "🚀 Starting development server..."
npm run dev 