import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconHome, IconBrain, IconMessage, IconSettings, IconLogout, IconChartBar, IconBook, IconLoader } from '@tabler/icons-react';
import config from '../../utils/config';
import { useAuth } from '../../contexts/AuthContext';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive }) => {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-theme-primary/10 text-theme-primary' 
          : 'text-text-primary hover:bg-hover-glass dark:hover:bg-dark-hover-glass'
        }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const { user, loading, signOut } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation will be handled by AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: '/dashboard', icon: <IconHome size={20} />, label: 'Home' },
    { 
      href: '/dashboard/agents', 
      icon: <IconBrain size={20} />, 
      label: 'Agents',
      show: config.features.enableAgents 
    },
    { 
      href: '/dashboard/chats', 
      icon: <IconMessage size={20} />, 
      label: 'Chats',
      show: config.features.enableChat
    },
    { 
      href: '/dashboard/knowledge', 
      icon: <IconBook size={20} />, 
      label: 'Knowledge',
      show: config.features.enableKnowledge 
    },
    { 
      href: '/dashboard/insights', 
      icon: <IconChartBar size={20} />, 
      label: 'Insights',
      show: config.features.enableInsights 
    },
    { href: '/dashboard/settings', icon: <IconSettings size={20} />, label: 'Settings' },
  ];

  const filteredNavItems = navItems.filter(item => item.show !== false);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-main">
        <div className="flex flex-col items-center">
          <IconLoader size={40} className="text-theme-primary animate-spin mb-4" />
          <p className="text-text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-72 border-r border-border bg-bg-panel px-4 py-6">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-8 w-8 rounded-lg bg-theme-primary"></div>
            <span className="text-2xl font-heading font-semibold text-text-primary">Nova</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {filteredNavItems.map((item) => {
              // Highlight 'Agents' nav for agent list and chat pages
              const isActive = item.href === '/dashboard/agents'
                ? currentPath === item.href || currentPath.startsWith(item.href) || currentPath.startsWith('/dashboard/bot')
                : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive}
                />
              );
            })}
          </nav>

          {/* User profile */}
          <div className="border-t border-border pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-theme-primary/10 flex items-center justify-center">
                {user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-text-primary truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-5 py-3 text-text-primary hover:bg-hover-glass dark:hover:bg-dark-hover-glass transition-all duration-200"
              style={{ justifyContent: 'center' }}
            >
              <IconLogout size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 min-h-screen container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout; 