import React, { useState, useEffect } from 'react';
import { Sidebar, Header } from '@/components/layout';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
  showSidebar?: boolean;
  showHeader?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  headerTitle?: string;
  headerSubtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  className = '',
  showSidebar = true,
  showHeader = true,
  sidebarCollapsed: controlledCollapsed,
  onSidebarToggle,
  headerTitle = 'Nova AI',
  headerSubtitle,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use controlled or internal state for sidebar collapse
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-collapse on mobile
      if (mobile && !isCollapsed) {
        setInternalCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isCollapsed]);

  const handleSidebarToggle = () => {
    if (onSidebarToggle) {
      onSidebarToggle();
    } else {
      setInternalCollapsed(!internalCollapsed);
    }
  };

  const handleThemeToggle = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleSearch = (query: string) => {
    console.log('Search query:', query);
    // TODO: Implement search functionality
  };

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
    // TODO: Implement notifications
  };

  return (
    <div className={`${styles.appLayout} ${className}`} data-mobile={isMobile}>
      {/* Neural gradient mesh background */}
      <div className={styles.neuralMesh} />
      
      {/* Sidebar */}
      {showSidebar && (
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleSidebarToggle}
          className={styles.sidebar}
        />
      )}

      {/* Main content area */}
      <div 
        className={`
          ${styles.mainContent} 
          ${showSidebar ? (isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded) : styles.noSidebar}
        `}
      >
        {/* Header */}
        {showHeader && (
          <Header
            title={headerTitle}
            subtitle={headerSubtitle}
            onThemeToggle={handleThemeToggle}
            onSearch={handleSearch}
            onNotificationClick={handleNotificationClick}
            className={styles.header}
          />
        )}

        {/* Content */}
        <main 
          className={`
            ${styles.content} 
            ${showHeader ? styles.withHeader : styles.noHeader}
          `}
        >
          {children}
        </main>
      </div>

      {/* Mobile overlay for sidebar */}
      {isMobile && showSidebar && !isCollapsed && (
        <div 
          className={styles.mobileOverlay}
          onClick={handleSidebarToggle}
        />
      )}
    </div>
  );
};

export default AppLayout; 