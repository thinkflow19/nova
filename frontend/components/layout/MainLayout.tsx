'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  Cog6ToothIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
    { name: 'Workflows', href: '/workflows', icon: PuzzlePieceIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl font-display font-bold text-blue-500">Nova</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-500'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-200">
            <button
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen ${isSidebarOpen ? 'ml-64' : ''}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-full px-4">
            <div className="flex items-center">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 mr-2 rounded-lg hover:bg-gray-100"
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-lg font-semibold">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <BellIcon className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100">
                <UserCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Chat Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out ${
          isChatOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Chat Assistant</h2>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 p-4">
            {/* Chat content will go here */}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-blue-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default MainLayout; 