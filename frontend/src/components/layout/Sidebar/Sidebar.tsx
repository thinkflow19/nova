import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Sidebar.module.css';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string | number;
  isActive?: boolean;
}

export interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  items?: SidebarItem[];
}

const defaultItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    href: '/dashboard',
  },
  {
    id: 'chat',
    label: 'AI Chat',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    href: '/chat',
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    href: '/projects',
  },
  {
    id: 'agents',
    label: 'AI Agents',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M9.663 17h4.673M12 3v1m6.364-.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    href: '/agents',
    badge: 'NEW',
  },
  {
    id: 'documents',
    label: 'Knowledge Base',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    href: '/documents',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    href: '/analytics',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
        <path
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    href: '/settings',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  isCollapsed = false,
  onToggleCollapse,
  items = defaultItems,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('Sidebar render:', {
      pathname,
      itemsCount: items.length,
      isCollapsed,
      user: user?.email
    });
  }, [pathname, items.length, isCollapsed, user]);

  const handleItemClick = (item: SidebarItem) => {
    console.log('Sidebar item clicked:', item.label, item.href);
    router.push(item.href);
  };

  const handleToggleCollapse = () => {
    onToggleCollapse?.();
  };

  return (
    <aside
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${className}`}
    >
      {/* Neural mesh background */}
      <div className={styles.neuralMesh} />
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                fill="url(#neural-gradient)"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-electric)" />
                  <stop offset="50%" stopColor="var(--accent-purple)" />
                  <stop offset="100%" stopColor="var(--accent-plasma)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!isCollapsed && (
            <span className={styles.logoText}>Nova</span>
          )}
        </div>
        
        <button
          className={styles.collapseButton}
          onClick={handleToggleCollapse}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`${styles.collapseIcon} ${isCollapsed ? styles.rotated : ''}`}
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        <ul className={styles.navList}>
          {items.map((item, index) => {
            // Enhanced active state detection
            let isActive = false;
            if (item.id === 'dashboard') {
              isActive = pathname === '/dashboard' || pathname.startsWith('/dashboard');
            } else if (item.id === 'chat') {
              isActive = pathname === '/chat' || pathname.startsWith('/chat');
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            }
            
            return (
              <li key={item.id} className={`${styles.navItem} stagger-${index + 1}`}>
                <button
                  className={`${styles.navButton} ${isActive ? styles.active : ''}`}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-label={item.label}
                >
                  <span className={styles.navIcon}>
                    {item.icon}
                  </span>
                  
                  {!isCollapsed && (
                    <>
                      <span className={styles.navLabel}>{item.label}</span>
                      {item.badge && (
                        <span className={styles.navBadge}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  
                  {/* Neural glow effect */}
                  <div className={`${styles.neuralGlow} ${isActive || hoveredItem === item.id ? styles.glowActive : ''}`} />
                </button>
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className={`${styles.tooltip} ${hoveredItem === item.id ? styles.tooltipVisible : ''}`}>
                    {item.label}
                    {item.badge && (
                      <span className={styles.tooltipBadge}>{item.badge}</span>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            <div className={styles.avatarGlow} />
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name || user.email || 'User avatar'}
                className={styles.avatarImage}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div 
              className={`${styles.avatarImage} ${user?.avatar_url ? 'hidden' : ''}`}
              style={{
                backgroundColor: 'var(--accent-electric)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: 'white',
                borderRadius: 'inherit',
              }}
            >
              {(user?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
          
          {!isCollapsed && (
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.display_name || user?.email || 'User'}</span>
              <span className={styles.userStatus}>Online</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar; 