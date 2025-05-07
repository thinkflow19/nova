'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '../Sidebar';
import { motion } from 'framer-motion';

interface ClientLayoutProps {
  children: ReactNode;
}

const ClientLayout = ({ children }: ClientLayoutProps) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Sidebar />
      <main className="pl-64">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="container mx-auto px-6 py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default ClientLayout; 