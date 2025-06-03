'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, LoginForm, SignupForm } from '@/types';
import { authApi, TokenManager } from '@/lib/api';
import { useToastContext } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  signup: (userData: SignupForm) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const { success, error: showError, info } = useToastContext();
  const router = useRouter();
  const initializingRef = useRef(false);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check if we have a stored token
      const token = TokenManager.getAccessToken();
      if (!token) {
        setInitialized(true);
        return;
      }

      // Check if we have a stored user
      const storedUser = TokenManager.getUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
        setInitialized(true);
        
        // Silently refresh user data in background
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          TokenManager.setUser(currentUser);
        } catch (error) {
          // If refresh fails, keep the stored user but log the error
          console.warn('Background user refresh failed:', error);
        }
        return;
      }

      // Try to get current user with token
      try {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        TokenManager.setUser(currentUser);
      } catch (error) {
        console.warn('Auth initialization failed:', error);
        // Clear invalid tokens
        TokenManager.clearTokens();
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      TokenManager.clearTokens();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setInitialized(true);
    }
  };

  const handleLogin = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      
      const tokens = await authApi.login(credentials);
      const user = await authApi.getCurrentUser();
      
      setUser(user);
      setIsAuthenticated(true);
      TokenManager.setUser(user);
      
      success('Successfully signed in!');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      showError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (userData: SignupForm) => {
    try {
      setLoading(true);
      
      await authApi.signup(userData);
      
      success('Account created successfully! Please sign in.');
      
      // Redirect to login
      router.push('/auth/login');
    } catch (error) {
      console.error('Signup failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to create account';
      showError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (showMessage = true) => {
    try {
      await authApi.logout();
      
      if (showMessage) {
        info('Successfully signed out');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of API call success
      setUser(null);
      setIsAuthenticated(false);
      TokenManager.clearTokens();
      
      // Redirect to login
      router.push('/auth/login');
    }
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    try {
      setLoading(true);
      
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
      TokenManager.setUser(updatedUser);
      
      success('Profile updated successfully');
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      showError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authApi.getCurrentUser();
      setUser(user);
      TokenManager.setUser(user);
      return user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  // Don't render anything until auth is initialized
  if (!initialized) {
    return null; // Or a minimal loading spinner
  }

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 