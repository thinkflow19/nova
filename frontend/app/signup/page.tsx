'use client';

import SignUpForm from '../../components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Your Nova Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Turn your documents into an AI assistant
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
} 