import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  LayoutDashboard, Bot, MessageSquare, Settings, LogOut, BarChart3, BookOpen, Loader2, PanelLeftOpen, PanelLeftClose, Menu as MenuIcon, X as XIcon
} from 'lucide-react';
import config from '../../utils/config';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isSidebarExpanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive, isSidebarExpanded }) => {
  return (
    <Link 
      href={href}
      title={isSidebarExpanded ? undefined : label}
      className={cn(
        "flex items-center gap-3 py-3 transition-all duration-200 rounded-lg",
        isSidebarExpanded ? "px-4" : "px-3 justify-center",
        isActive
          ? 'bg-primary/10 text-primary fill-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      )}
    >
      {icon}
      {isSidebarExpanded && <span className="font-medium text-sm">{label}</span>}
    </Link>
  );
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const currentPath = router.pathname;
  const { user, loading, signOut } = useAuth();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

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
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
    { 
      href: '/dashboard/agents', 
      icon: <Bot size={20} />,
      label: 'Agents',
      show: config.features.enableAgents 
    },
    { 
      href: '/dashboard/chats', 
      icon: <MessageSquare size={20} />,
      label: 'Chats',
      show: config.features.enableChat
    },
    { 
      href: '/dashboard/knowledge', 
      icon: <BookOpen size={20} />,
      label: 'Knowledge',
      show: config.features.enableKnowledge 
    },
    { 
      href: '/dashboard/insights', 
      icon: <BarChart3 size={20} />,
      label: 'Insights',
      show: config.features.enableInsights 
    },
    { href: '/dashboard/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  const filteredNavItems = navItems.filter(item => item.show !== false);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex flex-col items-center">
          <Loader2 size={40} className="text-primary animate-spin mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col py-4 px-2 bg-card border-r border-border shadow-sm">
      <div className={cn(
        "flex items-center mb-6 transition-all duration-200",
        isSidebarExpanded ? "justify-between px-2" : "justify-center"
      )}>
        {isSidebarExpanded && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">N</div>
            <span className="text-xl font-semibold text-foreground">Nova</span>
          </Link>
        )}
        <Button
          variant="ghost"
          onClick={toggleSidebar}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 hidden lg:flex rounded-md"
          aria-label={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isSidebarExpanded ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </Button>
      </div>

      <nav className="flex-1 space-y-1.5">
        {filteredNavItems.map((item) => {
          const isActive = item.href === '/dashboard/agents'
            ? currentPath === item.href || currentPath.startsWith(item.href + '/') || currentPath.startsWith('/dashboard/bot/')
            : currentPath === item.href || currentPath.startsWith(`${item.href}/`);
          return (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive}
              isSidebarExpanded={isSidebarExpanded}
            />
          );
        })}
      </nav>

      <div className={cn(
        "border-t border-border pt-4 mt-4 transition-all duration-200",
        isSidebarExpanded ? "px-2" : "px-0"
      )}>
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0",
            !isSidebarExpanded && "mx-auto"
          )}>
            {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          {isSidebarExpanded && (
            <div className="overflow-hidden flex-grow">
              <p className="font-medium text-sm text-foreground truncate" title={user.user_metadata?.full_name || user.email || 'User'}>
                {user.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate" title={user.email}>{user.email}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 rounded-md",
            isSidebarExpanded ? "px-3 py-2.5" : "p-2.5 justify-center"
          )}
          title={isSidebarExpanded ? undefined : "Logout"}
        >
          <LogOut size={18} />
          {isSidebarExpanded && <span className="font-medium text-sm">Logout</span>}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col transition-all duration-300 ease-in-out fixed lg:relative z-50 h-full",
        isSidebarExpanded ? "w-64" : "w-[72px]"
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Off-canvas) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
          {/* Sidebar Content */}
          <aside className="absolute left-0 top-0 h-full w-64 bg-card border-r border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">N</div>
                <span className="text-xl font-semibold text-foreground">Nova</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-muted-foreground hover:text-foreground">
                <XIcon size={20}/>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <SidebarContent /> {/* Re-use sidebar content, ensure isSidebarExpanded is true for mobile view */} 
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b border-border bg-background/80 backdrop-blur-md">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">N</div>
            <span className="text-xl font-semibold text-foreground">Nova</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className="text-muted-foreground hover:text-foreground">
            <MenuIcon size={24}/>
          </Button>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-0 md:p-0 lg:p-0">
          {/* The children (e.g., ChatsPage) should now correctly fill this area */}
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout; 