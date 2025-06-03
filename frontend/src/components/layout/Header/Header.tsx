'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './Header.module.css';

export interface HeaderProps {
  className?: string;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showThemeToggle?: boolean;
  showNotifications?: boolean;
  onSearch?: (query: string) => void;
  onThemeToggle?: () => void;
  onNotificationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  className = '',
  title = 'Nova AI',
  subtitle,
  showSearch = true,
  showThemeToggle = true,
  showNotifications = true,
  onSearch,
  onThemeToggle,
  onNotificationClick,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyboardShortcut = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`${styles.header} ${className}`}>
      {/* Neural mesh background */}
      <div className={styles.neuralMesh} />
      
      {/* Left section */}
      <div className={styles.leftSection}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && (
            <span className={styles.subtitle}>{subtitle}</span>
          )}
        </div>
      </div>

      {/* Center section - Search */}
      {showSearch && (
        <div className={styles.centerSection}>
          <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
            <div className={`${styles.searchContainer} ${isSearchFocused ? styles.searchFocused : ''}`}>
              <div className={styles.searchIcon}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conversations, projects..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={styles.searchInput}
              />
              
              <div className={styles.searchShortcut}>
                <span>⌘K</span>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Right section */}
      <div className={styles.rightSection}>
        {/* Theme toggle */}
        {showThemeToggle && (
          <button
            className={styles.actionButton}
            onClick={() => {
              toggleTheme();
              onThemeToggle?.();
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg
                className={`${styles.themeIcon}`}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                className={`${styles.themeIcon} ${styles.rotate}`}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        {/* Notifications */}
        {showNotifications && (
          <button
            className={styles.actionButton}
            onClick={onNotificationClick}
            aria-label="Notifications"
          >
            <div className={styles.notificationContainer}>
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {notificationCount > 0 && (
                <span className={styles.notificationBadge}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </div>
          </button>
        )}

        {/* User menu */}
        <div className={styles.userMenu} ref={userMenuRef}>
          <button
            className={styles.userButton}
            onClick={toggleUserMenu}
            aria-label="User menu"
          >
            <div className={styles.userAvatar}>
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
                className={`${styles.avatarImage} ${styles.defaultAvatar} ${user?.avatar_url ? 'hidden' : ''}`}
                style={{
                  backgroundColor: 'var(--accent-electric)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                {(user?.display_name || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className={styles.statusIndicator} />
            </div>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <div className={styles.userDropdown}>
              <div className={styles.userInfo}>
                <div className={styles.userDetails}>
                  <span className={styles.userName}>John Doe</span>
                  <span className={styles.userEmail}>john@example.com</span>
                </div>
              </div>
              
              <div className={styles.menuDivider} />
              
              <nav className={styles.menuNav}>
                <a href="/profile" className={styles.menuItem}>
                  <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Profile
                </a>
                
                <a href="/settings" className={styles.menuItem}>
                  <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none">
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
                  Settings
                </a>
                
                <a href="/help" className={styles.menuItem}>
                  <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Help & Support
                </a>
              </nav>
              
              <div className={styles.menuDivider} />
              
              <button className={`${styles.menuItem} ${styles.signOutButton}`}>
                <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 