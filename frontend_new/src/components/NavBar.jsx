import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Menu, X, ChevronRight, MessageSquare, User, LogIn } from 'lucide-react';
import { isAuthenticated } from '../utils/auth';

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      setIsLoggedIn(authed);
    };
    
    checkAuth();
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Why Us', href: '#why-us' },
    { name: 'Reviews', href: '#testimonials' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-primary/80 backdrop-blur-lg border-b border-border/10 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <nav className="container flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="text-xl font-heading font-bold flex items-center">
            <span className="text-accent">Nova</span>
            <span>.ai</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map(link => (
            <Link
              key={link.name}
              href={link.href}
              className="text-textMain/80 hover:text-textMain transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/chat"
            className="text-accent flex items-center hover:text-accent/80 transition-colors"
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            <span>Chat</span>
          </Link>
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center space-x-3">
          {isLoggedIn ? (
            <Link href="/dashboard" className="flex items-center text-textMain/80 hover:text-textMain transition-colors">
              <User className="mr-1 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="flex items-center text-textMain/80 hover:text-textMain transition-colors">
                <LogIn className="mr-1 h-4 w-4" />
                <span>Login</span>
              </Link>
              <Link href="/signup" className="btn btn-primary">
                <span>Get Started</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 md:hidden text-textMain focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="md:hidden bg-primary/95 backdrop-blur-lg border-b border-border py-4"
        >
          <div className="container flex flex-col space-y-4">
            {navLinks.map(link => (
              <Link
                key={link.name}
                href={link.href}
                className="text-textMain/80 hover:text-textMain transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/chat"
              className="text-accent flex items-center hover:text-accent/80 transition-colors py-2"
              onClick={() => setIsOpen(false)}
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              <span>Chat</span>
            </Link>
            
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className="flex items-center text-textMain/80 hover:text-textMain transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                <User className="mr-1 h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="flex items-center text-textMain/80 hover:text-textMain transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  <LogIn className="mr-1 h-4 w-4" />
                  <span>Login</span>
                </Link>
                <Link 
                  href="/signup" 
                  className="btn btn-primary w-full"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
} 