'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { createSupabaseClient } from '../utils/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: Error }>;
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ error?: Error }>;
}

// Create context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the auth state - simplified version
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get session and user in one call if session exists
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError);
          return;
        }
        
        setSession(currentSession);
        
        // If session exists, user is already in the session object
        if (currentSession?.user) {
          setUser(currentSession.user);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize authentication'));
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, [supabase]);
    
  // Subscribe to auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      
      setSession(newSession);
      
      if (event === 'SIGNED_IN' && newSession) {
        // User is already in the session object
        setUser(newSession.user);
        
        // Redirect to dashboard if on login or signup page
        const path = router.pathname;
        if (path === '/login' || path === '/signup') {
          router.push('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
    
        // Redirect to login unless on public pages
        const publicPages = ['/', '/login', '/signup', '/forgot-password'];
        if (!publicPages.includes(router.pathname)) {
          router.push('/login');
        }
      } else if (event === 'USER_UPDATED' && newSession) {
        // User data is in the session
        setUser(newSession.user);
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);
      
  // Sign in method
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return {};
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: err instanceof Error ? err : new Error('Failed to sign in') };
    }
  };

  // Sign up method
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name }
        }
      });
      if (error) throw error;
      return {};
    } catch (err) {
      console.error('Sign up error:', err);
      return { error: err instanceof Error ? err : new Error('Failed to sign up') };
    }
  };

  // Sign out method
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
      throw err;
    }
  };

  // Reset password method
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return {};
    } catch (err) {
      console.error('Reset password error:', err);
      return { error: err instanceof Error ? err : new Error('Failed to reset password') };
    }
  };

  // Update profile method
  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    try {
      const { error } = await supabase.auth.updateUser({ data });
      if (error) throw error;
      return {};
    } catch (err) {
      console.error('Update profile error:', err);
      return { error: err instanceof Error ? err : new Error('Failed to update profile') };
    }
  };

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 