# Troubleshooting Nova AI

This guide provides solutions to common issues that might occur when running the Nova AI application.

## Development Server Issues

### Issue: Login page is not loading

If you're experiencing issues with the login page not loading or other frontend pages, try these steps:

1. **Make sure you're running commands from the correct directory**

   ```bash
   # Go to the frontend_new directory first
   cd frontend_new
   
   # Then run the development server
   npm run dev
   ```

   > ⚠️ Running `npm run dev` from the root `nova` directory will fail because there's no package.json in the root directory.

2. **Use the restart script**

   ```bash
   # From the frontend_new directory
   ./restart_dev.sh
   ```

   This script will:
   - Kill any running Next.js processes
   - Clear the Next.js cache
   - Install dependencies
   - Create a basic .env.local file if needed
   - Start the development server

3. **Check if .env.local file exists with correct credentials**

   Make sure the `.env.local` file contains proper Supabase credentials:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Clear browser cache**

   Sometimes browser caching can cause issues. Try:
   - Hard refreshing with Ctrl+F5 or Cmd+Shift+R
   - Opening the app in an incognito/private window
   - Clearing your browser cache

### Issue: TypeScript/Linter errors

If you're seeing TypeScript errors but the application seems to work:

1. **Ignore build errors temporarily during development**

   Edit `next.config.js` and set:
   ```js
   typescript: {
     ignoreBuildErrors: true, // Only during development
   }
   ```

2. **Fix type definitions**

   If you see errors about missing properties in type definitions, check `src/types/index.ts` and make sure all the types include the properties used in the components.

## Authentication Issues

### Issue: Authentication not working

1. **Check Supabase credentials**

   - Verify your `.env.local` has correct Supabase URL and anon key
   - Make sure your Supabase project exists and is running

2. **Check browser console for errors**

   - Look for error messages related to Supabase or authentication
   - Check for CORS errors which might indicate a misconfiguration

3. **Test with demo credentials**

   You can try logging in with:
   ```
   Email: demo@example.com
   Password: password123
   ```

## API Connection Issues

If the frontend can't connect to the backend:

1. **Ensure backend is running**

   The backend should be running on port 8000. Check with:
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check API URL configuration**

   Make sure `NEXT_PUBLIC_API_URL` in `.env.local` points to the correct backend URL.

## Getting Additional Help

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Look at the terminal running the Next.js server for server-side errors
3. Search existing issues in the GitHub repository
4. Create a new issue with detailed steps to reproduce the problem 