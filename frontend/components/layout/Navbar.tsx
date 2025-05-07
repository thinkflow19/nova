'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Navbar() {
  return (
    <motion.header 
      className="px-8 py-6 flex justify-between items-center max-w-screen-xl mx-auto"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Link href="/" className="flex items-center">
        <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          Nova
        </span>
      </Link>
      
      <nav className="space-x-8 text-sm font-medium">
        <a href="#features" className="hover:text-primary transition">Features</a>
        <a href="#pricing" className="hover:text-primary transition">Pricing</a>
        <a href="#contact" className="hover:text-primary transition">Contact</a>
        <Link 
          href="/login"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          Sign In
        </Link>
      </nav>
    </motion.header>
  );
} 