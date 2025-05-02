'use client';

import LoginForm from '../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-3 text-gray-600">
            Sign in to access your AI assistants
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
} 