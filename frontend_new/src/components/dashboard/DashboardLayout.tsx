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
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { mode, toggleMode } = useTheme();
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
      <div className="min-h-screen bg-bg-main text-text-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex">
      {/* Sidebar (desktop) */}
      <aside
        className={`${
          isSidebarOpen ? 'lg:w-64' : 'lg:w-20'
        } hidden lg:flex flex-col bg-bg-panel border-r border-border-color transition-all duration-300 fixed h-full z-20 shadow-xl backdrop-blur-md rounded-r-2xl`}
      >
        <div className="p-6 flex items-center justify-between border-b border-border-color">
          <Link href="/dashboard" className="flex items-center">
            <span className={`text-xl font-bold ${!isSidebarOpen && 'hidden'}`}>
              <span className="text-theme-primary">Nova</span>
              <span className="text-text-primary">.ai</span>
            </span>
            {!isSidebarOpen && (
              <span className="text-theme-primary text-2xl font-bold">N</span>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-text-muted hover:text-text-primary transition-colors"
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
                  className={`flex items-center p-3 rounded-xl transition-colors group ${
                    item.active
                      ? 'bg-theme-primary/20 text-theme-primary font-semibold shadow-sm'
                      : 'text-text-muted hover:bg-hover-glass hover:text-text-primary'
                  } ${isSidebarOpen ? '' : 'justify-center'}`}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 ${isSidebarOpen ? 'mr-3' : 'mx-auto'} ${item.active ? 'text-theme-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 px-1">
            <Link
              href="/dashboard/agents/new"
              className={`flex items-center justify-center p-3 rounded-xl text-white bg-theme-primary hover:bg-theme-accent transition shadow-md hover:ring-1 hover:ring-theme-primary/30 w-full`}
            >
              <Plus className={`h-5 w-5 ${isSidebarOpen ? 'mr-2' : ''}`} />
              {isSidebarOpen && <span>New Agent</span>}
              {!isSidebarOpen && <span className="sr-only">New Agent</span>}
            </Link>
          </div>
        </div>

        <div className="p-4 border-t border-border-color">
          {user && (
            <div className={`flex items-center ${isSidebarOpen ? '' : 'justify-center'}`}>
              <div className="flex-shrink-0">
                <img
                  src={(user as any).avatar_url || `https://ui-avatars.com/api/?name=${((user as any).full_name || user.email)?.split('@')[0]}&background=818cf8&color=fff&font-size=0.5&bold=true`}
                  alt={(user as any).full_name || user.email}
                  className="h-10 w-10 rounded-full border-2 border-border-color shadow-sm"
                />
              </div>
              {isSidebarOpen && (
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{(user as any).full_name || user.email}</p>
                  <p className="text-xs text-text-muted truncate">Role Placeholder</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className={`text-text-muted hover:text-theme-primary transition-colors p-2 rounded-xl hover:bg-hover-glass ${isSidebarOpen ? 'ml-auto' : 'mt-2'}`}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-bg-panel/80 backdrop-blur-md border-b border-border-color shadow-lg">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold">
              <span className="text-theme-primary">Nova</span>
              <span className="text-text-primary">.ai</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMode}
              className="text-text-muted hover:text-theme-primary transition-colors p-2 rounded-xl hover:bg-hover-glass"
              title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
            >
              {mode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-xl hover:bg-hover-glass"
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="lg:hidden fixed inset-0 z-20 bg-bg-main pt-16 overflow-y-auto"
        >
          <div className="p-6 space-y-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center p-3 rounded-xl transition-colors group ${
                      item.active
                        ? 'bg-theme-primary/20 text-theme-primary font-semibold shadow-sm'
                        : 'text-text-muted hover:bg-hover-glass hover:text-text-primary'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 flex-shrink-0 ${item.active ? 'text-theme-primary' : 'text-text-muted group-hover:text-text-primary'}`} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t border-border-color">
              <Link
                href="/dashboard/agents/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center p-3 rounded-xl text-white bg-theme-primary hover:bg-theme-accent transition shadow-md hover:ring-1 hover:ring-theme-primary/30 w-full"
              >
                <Plus className="h-5 w-5 mr-2" />
                <span>New Agent</span>
              </Link>
            </div>
            {user && (
              <div className="pt-6 border-t border-border-color">
                <div className="flex items-center mb-4">
                  <img
                    src={(user as any).avatar_url || `https://ui-avatars.com/api/?name=${((user as any).full_name || user.email)?.split('@')[0]}&background=818cf8&color=fff&font-size=0.5&bold=true`}
                    alt={(user as any).full_name || user.email}
                    className="h-10 w-10 rounded-full border-2 border-border-color shadow-sm"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-text-primary">{(user as any).full_name || user.email}</p>
                    <p className="text-xs text-text-muted">Role Placeholder</p>
                  </div>
                </div>
                <button
                  onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center p-3 rounded-xl text-text-muted hover:text-theme-primary bg-hover-glass hover:bg-theme-primary/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main content area */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } pt-16 lg:pt-0`}
      >
        <div className="p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </main>
    </div>
  );
} 