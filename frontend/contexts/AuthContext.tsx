'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import API from '../utils/api';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  token: string | null;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null; success: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; success: boolean }>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        // Check for existing session from Supabase Auth
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          console.log("Found existing Supabase session");
          setSession(sessionData.session);
          setUser(sessionData.session.user);
          setToken(sessionData.session.access_token);
          
          // Also store token in localStorage for API calls
          localStorage.setItem('authToken', sessionData.session.access_token);
          console.log("Token saved to localStorage from session:", sessionData.session.access_token.substring(0, 10) + "...");
        } else {
          // If no Supabase session, check localStorage as fallback
          const storedToken = localStorage.getItem('authToken');
          
          if (storedToken) {
            console.log("Using stored token from localStorage:", storedToken.substring(0, 10) + "...");
            setToken(storedToken);
          }
        }
      } catch (err) {
        console.error("Session initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change detected:", event, session ? "session exists" : "no session");
      
      setSession(session);
      setUser(session?.user || null);
      
      if (session?.access_token) {
        console.log("Setting token from auth state change:", session.access_token.substring(0, 10) + "...");
        setToken(session.access_token);
        localStorage.setItem('authToken', session.access_token);
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out, clearing token");
        setToken(null);
        localStorage.removeItem('authToken');
      }
      
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Signing up with Supabase Auth:", email);
      
      // Use Supabase Auth for signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase Auth signup failed:", error);
        return { error, success: false };
      }
      
      if (data?.session) {
        // Set the token and session
        setToken(data.session.access_token);
        setSession(data.session);
        setUser(data.session.user);
        localStorage.setItem('authToken', data.session.access_token);
      }
      
      return { error: null, success: true };
    } catch (error) {
      return { 
        error: { message: error instanceof Error ? error.message : 'Signup failed' } as AuthError, 
        success: false 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    console.log("Starting login process for:", email);
    
    // Support default admin credentials
    if (email === 'admin' && password === 'password') {
      console.log("Using admin credentials");
      
      // Create a mock user and session for the admin
      const mockUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        user_metadata: { name: 'Admin User' },
        app_metadata: { role: 'admin' },
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as unknown as User;
      
      const mockToken = 'mock-token-for-admin-auth';
      const mockSession = { 
        user: mockUser, 
        access_token: mockToken,
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600000 // 1 hour from now
      } as unknown as Session;
      
      // Set the mock user and session
      setUser(mockUser);
      setSession(mockSession);
      setToken(mockToken);
      
      // Store mock token for API calls
      localStorage.setItem('authToken', mockToken);
      console.log("Admin login successful, token saved to localStorage:", mockToken);
      
      setIsLoading(false);
      
      return { error: null, success: true };
    }
    
    try {
      // Use Supabase Auth for login
      console.log("Logging in with Supabase Auth");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase Auth login failed:", error);
        return { error, success: false };
      }
      
      if (data?.session) {
        console.log("Login successful, setting session and token");
        
        // Set session, user and token
        setSession(data.session);
        setUser(data.session.user);
        setToken(data.session.access_token);
        
        // Store token for API calls
        localStorage.setItem('authToken', data.session.access_token);
        console.log("Token saved to localStorage:", data.session.access_token.substring(0, 10) + "...");
        
        setIsLoading(false);
        return { error: null, success: true };
      }
      
      return { error: { message: 'Unknown login error' } as AuthError, success: false };
    } catch (error) {
      console.error("Login error:", error);
      return { 
        error: { message: error instanceof Error ? error.message : 'Login failed' } as AuthError, 
        success: false 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    
    // Clear the stored token
    localStorage.removeItem('authToken');
    
    // Sign out with Supabase Auth
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
    
    // Clear state
    setToken(null);
    setUser(null);
    setSession(null);
    
    setIsLoading(false);
  };

  const value = {
    user,
    session,
    isLoading,
    token,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 