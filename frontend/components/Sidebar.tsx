'use client'; // Mark this as a Client Component

import React from 'react';
import Link from 'next/link';
import { FiGrid, FiBox, FiSettings, FiBookOpen, FiPlusCircle, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from 'next-themes';

const Sidebar: React.FC = () => {
  const { theme, setTheme } = useTheme();

  // Basic placeholder links - functionality needs implementation
  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: FiGrid },
    { name: 'Projects', href: '/projects', icon: FiBox }, // Updated href
    // Add more relevant links here
  ];
  
  const bottomItems = [
    { name: 'Docs', href: '#', icon: FiBookOpen }, // Placeholder link
    // Settings might be a modal or a separate page later
    // { name: 'Settings', href: '/settings', icon: FiSettings }, 
  ];

  return (
    <div className="w-60 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 p-4 h-full flex flex-col shadow-md border-r border-gray-200 dark:border-gray-700/50">
      {/* Header/Logo */}
      <div className="mb-6">
         <Link href="/dashboard" className="flex items-center space-x-2 text-gray-900 dark:text-white hover:opacity-80 transition-opacity">
            {/* Replace with actual Logo component/SVG if available */}
            <span className="text-2xl font-bold">Nova</span>
         </Link>
      </div>

      {/* New Project Button */}
      <Link href="/dashboard/new-bot" 
        className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg mb-6 transition-colors duration-200 shadow hover:shadow-lg text-sm"
      >
        <FiPlusCircle className="mr-2 h-4 w-4" /> New Project
      </Link>

      {/* Navigation Links */}
      <nav className="flex-grow overflow-y-auto space-y-1 mb-4">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.href}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Bottom Links & Theme Toggle */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700/50 pt-4 space-y-1">
        {bottomItems.map((item) => (
           <Link 
            key={item.name} 
            href={item.href}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        ))}
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors duration-150"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'dark' ? 
            <FiSun className="mr-3 h-5 w-5" /> : 
            <FiMoon className="mr-3 h-5 w-5" />
          }
          Toggle Theme
        </button>
         {/* Add User/Logout here later */}
      </div>
    </div>
  );
};

export default Sidebar; 