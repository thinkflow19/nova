'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../ui';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const router = useRouter();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        // Redirect to dashboard on successful login
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Log in to Nova</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-700">
            Email / Username
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border border-gray-300"
            placeholder="email@example.com or admin"
            required
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border border-gray-300"
            placeholder="••••••••"
            required
          />
          <div className="mt-2 flex justify-between items-center">
            <span className="text-xs text-gray-500">Try admin/password</span>
            <Link href="/forgot-password" className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          fullWidth
        >
          Log In
        </Button>
      </form>
      
      <p className="mt-6 text-center text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-[var(--primary)] font-medium hover:text-[var(--primary-dark)] transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
} 