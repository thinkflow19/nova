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
  ChevronDown,
  Menu,
  X,
  Plus,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import ThemeToggle from '../ui/ThemeToggle';
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

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if not authenticated
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
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: router.pathname === '/dashboard',
    },
    {
      name: 'My Agents',
      href: '/dashboard/agents',
      icon: Bot,
      active: router.pathname.startsWith('/dashboard/agents') || router.pathname.startsWith('/dashboard/bot'),
    },
    {
      name: 'Insights',
      href: '/dashboard/insights',
      icon: Sparkles,
      active: router.pathname.startsWith('/dashboard/insights'),
    },
    {
      name: 'Knowledge Base',
      href: '/dashboard/knowledge',
      icon: FileText,
      active: router.pathname.startsWith('/dashboard/knowledge'),
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      active: router.pathname.startsWith('/dashboard/settings'),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar (desktop) */}
      <aside
        className={`${
          isSidebarOpen ? 'lg:w-64' : 'lg:w-20'
        } hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 fixed h-full z-20`}
      >
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <span className={`text-xl font-bold ${!isSidebarOpen && 'hidden'}`}>
              <span className="text-accent">Nova</span>
              <span>.ai</span>
            </span>
            {!isSidebarOpen && (
              <span className="text-accent text-2xl font-bold">N</span>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                isSidebarOpen ? 'rotate-90' : '-rotate-90'
              }`}
            />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-card-foreground/5 hover:text-foreground'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link
              href="/dashboard/agents/new"
              className={`flex items-center p-3 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors ${
                !isSidebarOpen && 'justify-center'
              }`}
            >
              <Plus className={`h-5 w-5 ${isSidebarOpen ? 'mr-2' : ''}`} />
              {isSidebarOpen && <span>New Agent</span>}
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          {user && (
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || user.email}&background=6366F1&color=fff`}
                  alt={user.full_name || user.email}
                  className="h-10 w-10 rounded-full"
                />
              </div>
              {isSidebarOpen && (
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ThemeToggle variant="icon" />
                <button
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-card-foreground/5"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-card border-b border-border py-4 px-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold">
              <span className="text-accent">Nova</span>
              <span>.ai</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-10 bg-background pt-20"
        >
          <div className="p-6 space-y-6">
            <ul className="space-y-4">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-accent/10 text-accent'
                        : 'text-muted-foreground hover:bg-card-foreground/5 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard/agents/new"
              className="flex items-center p-3 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors w-full"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>New Agent</span>
            </Link>

            {user && (
              <div className="pt-6 border-t border-border">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <img
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || user.email}&background=6366F1&color=fff`}
                      alt={user.full_name || user.email}
                      className="h-10 w-10 rounded-full"
                    />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-card-foreground/5"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300`}>
        <div className="lg:pt-0 pt-16">
          {children}
        </div>
      </div>
    </div>
  );
} 