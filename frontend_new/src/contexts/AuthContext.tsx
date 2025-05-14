'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { User, Session } from '@supabase/supabase-js';
import { createSupabaseClient } from '../utils/supabase';

// Extend the User type to include the properties we're using
interface ExtendedUser extends User {
  name?: string;
  full_name?: string;
  avatar_url?: string;
  email_verified?: boolean;
}

interface AuthContextType {
  user: ExtendedUser | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, metadata: { name: string }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
  updateProfile: (data: { name?: string }) => Promise<{ error: any }>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session expiry buffer - refresh token 5 minutes before it expires
const SESSION_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in milliseconds

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseClient();
  
  // Use refs to avoid stale closures in timers and cleanup functions
  const sessionExpiryTimer = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);

  // Handle secure token storage
  const setAuthToken = useCallback((token?: string | null) => {
    if (token) {
      try {
        localStorage.setItem('authToken', token);
      } catch (e) {
        console.error('Failed to store auth token:', e);
      }
    } else {
      try {
        localStorage.removeItem('authToken');
      } catch (e) {
        console.error('Failed to remove auth token:', e);
      }
    }
  }, []);

  // Clear the expiry timer
  const clearExpiryTimer = useCallback(() => {
    if (sessionExpiryTimer.current) {
      clearTimeout(sessionExpiryTimer.current);
      sessionExpiryTimer.current = null;
    }
  }, []);

  // Schedule token refresh
  const scheduleTokenRefresh = useCallback((expiresAt: number) => {
    // Clear any existing timer
    clearExpiryTimer();
    
    // Calculate time until refresh (5 minutes before expiry)
    const timeUntilRefresh = expiresAt - Date.now() - SESSION_EXPIRY_BUFFER;
    
    if (timeUntilRefresh <= 0) {
      // Token is already expired or about to expire, refresh immediately
      refreshSession();
      return;
    }
    
    // Schedule refresh
    sessionExpiryTimer.current = setTimeout(() => {
      if (!isUnmounted.current) {
        refreshSession();
      }
    }, timeUntilRefresh);
    
    console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
  }, []);

  // Attempt to refresh the session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }
      
      if (data.session) {
        // Update session and token
        setSession(data.session);
        setUser(data.user as ExtendedUser);
        setAuthToken(data.session.access_token);
        
        // Schedule next refresh
        if (data.session.expires_at) {
          const expiryTime = data.session.expires_at * 1000; // Convert seconds to milliseconds
          scheduleTokenRefresh(expiryTime);
        }
        
        return true;
      }
    } catch (err) {
      console.error('Error during session refresh:', err);
    }
    
    return false;
  }, [supabase.auth, scheduleTokenRefresh, setAuthToken]);

  // Handle session updates
  const handleSessionUpdate = useCallback((currentSession: Session | null) => {
    setSession(currentSession);
    setUser(currentSession?.user as ExtendedUser ?? null);
    
    // Update auth token in localStorage
    setAuthToken(currentSession?.access_token);
    
    // Schedule token refresh if session exists and has expiry
    if (currentSession?.expires_at) {
      const expiryTime = currentSession.expires_at * 1000; // Convert seconds to milliseconds
      scheduleTokenRefresh(expiryTime);
    } else {
      // Clear refresh timer if no session
      clearExpiryTimer();
    }
    
    setLoading(false);
  }, [scheduleTokenRefresh, setAuthToken, clearExpiryTimer]);

  // Initialize authentication
  useEffect(() => {
    let mounted = true;
    isUnmounted.current = false;
    
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          handleSessionUpdate(initialSession);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };
    
    initAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      if (mounted) {
        handleSessionUpdate(updatedSession);
      }
    });
    
    // Cleanup function
    return () => {
      mounted = false;
      isUnmounted.current = true;
      subscription.unsubscribe();
      clearExpiryTimer();
    };
  }, [supabase.auth, handleSessionUpdate, clearExpiryTimer]);

  // Redirect if not authenticated
  useEffect(() => {
    // Only check protection when loading is false and we have a definite auth state
    if (!loading) {
      const pathname = router.pathname;
      
      // Protected routes that require authentication
      const protectedRoutes = [
        '/dashboard',
        '/profile',
      ];
      
      // Public routes that don't require authentication
      const publicRoutes = [
        '/login',
        '/signup',
        '/',
      ];
      
      // Check if current path starts with any protected route
      const isProtectedRoute = protectedRoutes.some(route => 
        pathname.startsWith(route)
      );
      
      // Check if current path is a public route
      const isPublicRoute = publicRoutes.some(route => 
        pathname === route
      );
      
      if (isProtectedRoute && !user) {
        // Redirect to login if trying to access protected route without auth
        router.push('/login');
      } else if (isPublicRoute && user) {
        // Redirect to dashboard if trying to access public route with auth
        router.push('/dashboard');
      }
    }
  }, [loading, user, router]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        router.push('/dashboard');
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, metadata: { name: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (!error) {
        router.push('/dashboard');
      }
      
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAuthToken(null);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (data: { name?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 