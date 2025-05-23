import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { User, Session } from '@supabase/supabase-js';
import { createSupabaseClient } from './supabase';

interface AuthResult {
  user: User | null;
  session: Session | null;
}

interface AuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
}

/**
 * Login user with email and password using Supabase
 * @param email - User email
 * @param password - User password
 * @returns User data and session
 */
export const login = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('Attempting login with Supabase');
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase login error:', error);
      throw new Error(error.message || 'Login failed');
    }
    
    console.log('Login successful');
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Sign up a new user using Supabase
 * @param name - User's name
 * @param email - User's email
 * @param password - User's password
 * @returns User data and session
 */
export const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
  try {
    const supabase = createSupabaseClient();
    // Register the user with Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    
    if (authError) {
      console.error('Signup error:', authError);
      throw new Error(authError.message || 'Signup failed');
    }
    
    return authData;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

/**
 * Logout the current user using Supabase
 */
export const logout = async (): Promise<void> => {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * Get the current user data
 * @returns User data or null if not authenticated
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 * @returns True if authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const supabase = createSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

/**
 * React hook to protect routes
 * @param options - Configuration options
 * @param options.redirectTo - Where to redirect if not authenticated
 * @param options.redirectIfFound - Redirect away if authenticated
 * @returns { user, loading, error }
 */
export const useAuth = (options: AuthOptions = {}) => {
  const { redirectTo = '/login', redirectIfFound = false } = options;
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const redirectPage = async () => {
      try {
        // Get the current session
        const supabase = createSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (
          // If redirectTo is set, redirectIfFound is false, and session doesn't exist
          (redirectTo && !redirectIfFound && !session) ||
          // Or if redirectIfFound is true and session exists
          (redirectIfFound && session)
        ) {
          // Push user to redirectTo page
          router.push(redirectTo);
        }
        
        if (session) {
          const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        } else {
            setUser(null);
          }
      } catch (error) {
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
          setLoading(false);
        }
    };

    if (!loading) return;

    redirectPage();
  }, [redirectTo, redirectIfFound, router, loading]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    
    // Set up an auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const { data: { user } } = await supabase.auth.getUser();
          setUser(user);
          setLoading(false);
          
          if (redirectIfFound) {
              router.push(redirectTo);
            }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          
          if (!redirectIfFound) {
            router.push(redirectTo);
          }
        }
      }
    );
    
    // Clean up the subscription
    return () => {
      subscription?.unsubscribe();
    };
  }, [redirectIfFound, redirectTo, router]);

  return { user, loading, error };
}; 