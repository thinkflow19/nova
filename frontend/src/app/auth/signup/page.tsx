'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Loading } from '@/components/ui';
import { SignupForm } from '@/types';

export default function SignupPage() {
  const { signup, loading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<SignupForm>({
    email: '',
    password: '',
    display_name: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<SignupForm & { confirmPassword: string }>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  const validateForm = (): boolean => {
    const errors: Partial<SignupForm & { confirmPassword: string }> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.display_name) {
      errors.display_name = 'Display name is required';
    } else if (formData.display_name.length < 2) {
      errors.display_name = 'Display name must be at least 2 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await signup(formData);
      // Redirect is handled in the auth context
    } catch (error) {
      // Error is handled in the auth context
      console.error('Signup error:', error);
    }
  };

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    
    // Clear error when user starts typing
    if (formErrors.confirmPassword) {
      setFormErrors(prev => ({ ...prev, confirmPassword: undefined }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]" data-theme="dark">
      {/* Neural gradient mesh background */}
      <div className="neural-mesh" />
      
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="bg-[var(--bg-glass)] backdrop-blur-[24px] rounded-2xl border border-[var(--glass-border)] p-8 shadow-[var(--shadow-2xl)]">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent-electric)] via-[var(--accent-purple)] to-[var(--accent-plasma)] bg-clip-text text-transparent mb-2">
              Join Nova AI
            </h1>
            <p className="text-[var(--text-secondary)]">
              Create your account and start building with AI
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="text"
                label="Display Name"
                placeholder="Enter your display name"
                value={formData.display_name || ''}
                onChange={(value) => handleInputChange('display_name', value)}
                error={formErrors.display_name}
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="email"
                label="Email Address"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                error={formErrors.email}
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(value) => handleInputChange('password', value)}
                error={formErrors.password}
                disabled={loading}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={formErrors.confirmPassword}
                disabled={loading}
              />
            </div>

            <div className="text-xs text-[var(--text-muted)] space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>At least 8 characters long</li>
                <li>Contains uppercase and lowercase letters</li>
                <li>Contains at least one number</li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-[var(--glass-border)]"></div>
            <span className="px-4 text-sm text-[var(--text-muted)]">or</span>
            <div className="flex-1 border-t border-[var(--glass-border)]"></div>
          </div>

          {/* Social Login */}
          <Button
            variant="secondary"
            className="w-full flex items-center justify-center gap-3"
            disabled={loading}
            onClick={() => {
              // TODO: Implement Google OAuth
              console.log('Google OAuth not implemented yet');
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          {/* Terms and Privacy */}
          <p className="mt-6 text-xs text-center text-[var(--text-muted)]">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-[var(--accent-electric)] hover:text-[var(--accent-purple)] transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-[var(--accent-electric)] hover:text-[var(--accent-purple)] transition-colors">
              Privacy Policy
            </Link>
          </p>

          {/* Sign In Link */}
          <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-[var(--accent-electric)] hover:text-[var(--accent-purple)] font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20">
            <Loading variant="neural" size="lg" text="Creating your account..." />
          </div>
        )}
      </div>
    </div>
  );
} 