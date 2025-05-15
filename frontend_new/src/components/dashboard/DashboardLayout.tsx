import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  Home,
  Bot,
  MessageSquare,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Plus,
  BarChart3,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../../types.d';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  active: boolean;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark'); 

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    const initialTheme = storedTheme && (storedTheme === 'dark' || storedTheme === 'light') ? storedTheme : 'dark';
    setCurrentTheme(initialTheme);
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove(initialTheme === 'dark' ? 'light' : 'dark');
      document.documentElement.classList.add(initialTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(newTheme);
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove(currentTheme);
      document.documentElement.classList.add(newTheme);
    }
    localStorage.setItem('theme', newTheme);
  };
  
  if (!mounted) return <div className="w-9 h-9" />; // Placeholder for SSR

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-colors duration-200 
                  bg-hover-glass hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 
                  text-text-muted hover:text-text-main`}
      title="Toggle theme"
    >
      {currentTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, active: router.pathname === '/dashboard' },
    { name: 'My Agents', href: '/dashboard/agents', icon: Bot, active: router.pathname.startsWith('/dashboard/agents') || router.pathname.startsWith('/dashboard/bot') },
    { name: 'Insights', href: '/dashboard/insights', icon: Sparkles, active: router.pathname.startsWith('/dashboard/insights') },
    { name: 'Chat History', href: '/dashboard/chats', icon: MessageSquare, active: router.pathname.startsWith('/dashboard/chats') },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, active: router.pathname.startsWith('/dashboard/settings') },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex antialiased">
      {/* Sidebar (desktop) */}
      <aside
        className={`
          hidden lg:flex flex-col fixed h-full z-30 
          bg-bg-panel/80 backdrop-blur-xl border-r border-border-color shadow-2xl 
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className={`flex items-center justify-between p-4 h-20 border-b border-border-color`}>
          <Link href="/dashboard" className={`flex items-center gap-2 overflow-hidden ${!isSidebarOpen ? 'w-full justify-center' : ''}`}>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary-foreground"/>
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-bold whitespace-nowrap text-text-main"
                >
                  <span className="text-primary">Nova</span>.ai
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-text-muted hover:text-text-main hover:bg-hover-glass transition-colors"
            >
             <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {!isSidebarOpen && (
             <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-text-muted hover:text-text-main hover:bg-hover-glass transition-colors lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 lg:translate-x-1/2 lg:bg-bg-panel lg:border lg:border-border-color lg:shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          <ul className="space-y-1.5">
            {navigation.map((item) => (
              <li key={item.name} className="list-none">
                <Link
                  href={item.href}
                  title={isSidebarOpen ? undefined : item.name} // Show full name on hover when collapsed
                  className={`
                    flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out group 
                    ${isSidebarOpen ? 'justify-start' : 'justify-center'}
                    ${item.active
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-main hover:bg-hover-glass'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-primary' : 'group-hover:text-text-main'}`} />
                  <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }} 
                      animate={{ opacity: 1, width: 'auto'}} 
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                      className="ml-3 whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                  </AnimatePresence>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto p-3">
          <Link
            href="/dashboard/agents/new"
            className={`
              flex items-center p-3 rounded-xl transition-colors duration-200 btn-primary 
              ${isSidebarOpen ? 'justify-start' : 'justify-center'}
            `}
          >
            <Plus className={`w-5 h-5 flex-shrink-0 ${isSidebarOpen ? 'mr-2' : ''}`} />
            <AnimatePresence>
            {isSidebarOpen && (
              <motion.span 
                initial={{ opacity: 0, width: 0 }} 
                animate={{ opacity: 1, width: 'auto'}} 
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="whitespace-nowrap"
              >
                New Agent
              </motion.span>
            )}
            </AnimatePresence>
          </Link>
        </div>
      
        <div className="p-4 border-t border-border-color">
          <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'flex-col gap-3 items-center'}`}>
              <div className={`flex items-center ${!isSidebarOpen ? 'flex-col text-center' : ''}`}>
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'U')}&background=00bfa6&color=fff&rounded=true&bold=true&size=40`}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full shadow-md mb-0.5"
                />
                <AnimatePresence>
                {isSidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="ml-3 min-w-0 flex-1"
                  >
                    <p className="text-sm font-medium text-text-main truncate">{user.full_name || user.email}</p>
                    {user.full_name && user.email && <p className="text-xs text-text-muted truncate">{user.email}</p>}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            <div className={`flex items-center ${isSidebarOpen ? 'gap-1' : 'flex-col gap-2 mt-1'}`}>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-text-muted hover:text-error-color hover:bg-error-color/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

    {/* Mobile Header & Menu */}
    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-bg-panel/80 backdrop-blur-xl border-b border-border-color shadow-md">
      <div className="flex items-center justify-between h-16 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground"/>
          </div>
          <span className="text-xl font-bold text-text-main"><span className="text-primary">Nova</span>.ai</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg text-text-muted hover:text-text-main hover:bg-hover-glass transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>

    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, x: '-100%' }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: '-100%' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="lg:hidden fixed inset-0 z-20 bg-bg-panel shadow-2xl pt-16 flex flex-col"
        >
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
            <ul className="space-y-1.5">
              {navigation.map((item) => (
                <li key={item.name} className="list-none">
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center p-3 rounded-lg transition-all duration-200 ease-in-out group justify-start
                      ${item.active ? 'bg-primary/10 text-primary shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-hover-glass'}
                    `}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-primary' : 'group-hover:text-text-main'}`} />
                    <span className="ml-3 whitespace-nowrap">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto p-3">
            <Link
              href="/dashboard/agents/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center p-3 rounded-xl transition-colors duration-200 btn-primary justify-center w-full"
            >
              <Plus className="w-5 h-5 flex-shrink-0 mr-2" />
              <span className="whitespace-nowrap">New Agent</span>
            </Link>
          </div>
          <div className="p-4 border-t border-border-color">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img
                     src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.email || 'U')}&background=00bfa6&color=fff&rounded=true&bold=true&size=40`}
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full shadow-md"
                  />
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-main truncate">{user.full_name || user.email}</p>
                    {user.full_name && user.email && <p className="text-xs text-text-muted truncate">{user.email}</p>}
                  </div>
                </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-text-muted hover:text-error-color hover:bg-error-color/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Main content area */}
    <main 
      className={`flex-1 transition-all duration-300 ease-in-out lg:pt-0 pt-16 
                 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} `}
    >
      <div className="max-w-full mx-auto">
        {children}
      </div>
    </main>
  </div>
  );
} 