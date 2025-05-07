'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../Sidebar';
import { motion } from 'framer-motion';
import Navbar from './Navbar';

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const pathname = usePathname();
  
  // Check if this is the landing page, login, or signup page
  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/signup';

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {pathname === '/' && <Navbar />}
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <main className="pl-64 min-h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default ClientLayout; 