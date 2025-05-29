'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginForm, SignupForm } from '@/types';
import { authApi, TokenManager } from '@/lib/api';
import { useToastContext } from '@/contexts/ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginForm) => Promise<void>;
  signup: (userData: SignupForm) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { success, error: showError, info } = useToastContext();

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Check if user is stored locally
      const storedUser = TokenManager.getUser();
      const token = TokenManager.getAccessToken();
      
      if (storedUser && token) {
        setUser(storedUser);
        
        // Verify token is still valid by fetching current user
        try {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
          TokenManager.setUser(currentUser);
        } catch (error) {
          // Token is invalid, clear auth state
          console.error('Token validation failed:', error);
          await handleLogout(false);
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await handleLogout(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      const tokens = await authApi.login(credentials);
      
      // Get user profile
      const user = await authApi.getCurrentUser();
      setUser(user);
      
      success('Welcome back!', { title: 'Login Successful' });
      
      // Redirect to dashboard
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Login failed:', error);
      showError(
        error instanceof Error ? error.message : 'Login failed. Please try again.',
        { title: 'Login Failed' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (userData: SignupForm) => {
    try {
      setLoading(true);
      const response = await authApi.signup(userData);
      
      info(response.message || 'Account created successfully!', { 
        title: 'Registration Successful',
        duration: 8000 
      });
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
    } catch (error) {
      console.error('Signup failed:', error);
      showError(
        error instanceof Error ? error.message : 'Registration failed. Please try again.',
        { title: 'Registration Failed' }
      );
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (showMessage = true) => {
    try {
      setLoading(true);
      await authApi.logout();
      
      if (showMessage) {
        info('You have been logged out successfully', { title: 'Logged Out' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setLoading(false);
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
      TokenManager.setUser(updatedUser);
      
      success('Profile updated successfully!', { title: 'Profile Updated' });
    } catch (error) {
      console.error('Profile update failed:', error);
      showError(
        error instanceof Error ? error.message : 'Failed to update profile',
        { title: 'Update Failed' }
      );
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      TokenManager.setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await handleLogout(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user && authApi.isAuthenticated(),
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