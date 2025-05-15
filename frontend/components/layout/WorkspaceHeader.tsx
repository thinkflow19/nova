'use client';

import { useRouter } from 'next/navigation';

export default function WorkspaceHeader() {
  const router = useRouter();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <h1 className="text-xl font-semibold">Nova Workspace</h1>
          <nav className="flex space-x-4">
            <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
              Settings
            </button>
            <button className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-50">
              Profile
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
} 