'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Button, Card, Input, Loading } from '@/components/ui';

const SettingsPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  // Form states
  const [profileData, setProfileData] = useState({
    display_name: user?.display_name || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  
  const [preferences, setPreferences] = useState({
    theme: 'dark',
    notifications: true,
    emailUpdates: false,
    language: 'en',
    defaultModel: 'gpt-4',
    autoSave: true,
    soundEffects: true,
    compactMode: false,
    showTooltips: true,
    animationsEnabled: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    messageNotifications: true,
    projectUpdates: true,
    systemAlerts: true,
    emailDigest: false,
    pushNotifications: true,
    soundEnabled: true,
    vibrationEnabled: false
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
  }, [authLoading, isAuthenticated, router]);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setPreferences(prev => ({ ...prev, theme: savedTheme }));
  }, []);

  // Theme switching logic
  const handleThemeChange = (newTheme: string) => {
    setPreferences(prev => ({ ...prev, theme: newTheme }));
    
    if (newTheme === 'auto') {
      // Use system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeToApply = systemPrefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', themeToApply);
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    
    localStorage.setItem('theme', newTheme);
  };

  // Don't render while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loading size="lg" text="Checking authentication..." variant="neural" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loading size="lg" text="Redirecting to login..." variant="neural" />
      </div>
    );
  }

  const handleProfileUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Preferences updated successfully!');
    } catch (err) {
      setError('Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Notification settings updated successfully!');
    } catch (err) {
      setError('Failed to update notification settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Account deletion request submitted. You will receive an email confirmation.');
    } catch (err) {
      setError('Failed to process account deletion. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'advanced', label: 'Advanced', icon: '🛠️' }
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Settings</h1>
          <p className="text-[var(--text-secondary)]">
            Manage your account, preferences, and application settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card variant="glass" className="p-4">
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200
                      ${activeTab === tab.id
                        ? 'bg-[var(--accent-electric)]/10 text-[var(--accent-electric)] border border-[var(--accent-electric)]/20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)]'
                      }
                    `}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Success/Error Messages */}
            {(success || error) && (
              <div className={`mb-6 p-4 rounded-lg ${
                success 
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                <p className="text-sm">{success || error}</p>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card variant="glass" className="p-6">
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
                  Profile Information
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[var(--accent-electric)] to-[var(--accent-purple)] flex items-center justify-center text-2xl font-bold text-white">
                      {(profileData.display_name || profileData.email).charAt(0).toUpperCase()}
                    </div>
                    <Button variant="secondary" size="sm">
                      Change Avatar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Display Name"
                      value={profileData.display_name}
                      onChange={(value) => setProfileData(prev => ({ ...prev, display_name: value }))}
                      placeholder="Your display name"
                    />
                    
                    <Input
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(value) => setProfileData(prev => ({ ...prev, email: value }))}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleProfileUpdate}
                    loading={loading}
                    disabled={loading}
                  >
                    Save Profile
                  </Button>
                </div>
              </Card>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <Card variant="glass" className="p-6">
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
                  Appearance & Theme
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', icon: '☀️', description: 'Clean and bright interface' },
                        { value: 'dark', label: 'Dark', icon: '🌙', description: 'Easy on the eyes' },
                        { value: 'auto', label: 'Auto', icon: '🔄', description: 'Matches your system' }
                      ].map(theme => (
                        <button
                          key={theme.value}
                          onClick={() => handleThemeChange(theme.value)}
                          className={`
                            p-4 rounded-lg border-2 transition-all duration-200 text-left
                            ${preferences.theme === theme.value
                              ? 'border-[var(--accent-electric)] bg-[var(--accent-electric)]/10'
                              : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-electric)]/50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{theme.icon}</span>
                            <span className="font-medium text-[var(--text-primary)]">{theme.label}</span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)]">{theme.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.compactMode}
                        onChange={(e) => setPreferences(prev => ({ ...prev, compactMode: e.target.checked }))}
                        className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                      />
                      <div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">Compact Mode</span>
                        <p className="text-xs text-[var(--text-secondary)]">Reduce spacing for more content</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={preferences.animationsEnabled}
                        onChange={(e) => setPreferences(prev => ({ ...prev, animationsEnabled: e.target.checked }))}
                        className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                      />
                      <div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">Animations</span>
                        <p className="text-xs text-[var(--text-secondary)]">Enable smooth animations</p>
                      </div>
                    </label>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handlePreferencesUpdate}
                    loading={loading}
                    disabled={loading}
                  >
                    Save Appearance Settings
                  </Button>
                </div>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card variant="glass" className="p-6">
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
                  Notification Preferences
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Push Notifications
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Message Notifications</span>
                          <p className="text-xs text-[var(--text-secondary)]">Get notified when you receive new messages</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.messageNotifications}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, messageNotifications: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Project Updates</span>
                          <p className="text-xs text-[var(--text-secondary)]">Notifications about your projects and collaborations</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.projectUpdates}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, projectUpdates: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">System Alerts</span>
                          <p className="text-xs text-[var(--text-secondary)]">Important system updates and maintenance notices</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.systemAlerts}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Email Notifications
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Weekly Digest</span>
                          <p className="text-xs text-[var(--text-secondary)]">Summary of your weekly activity</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.emailDigest}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailDigest: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Sound & Vibration
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Sound Effects</span>
                          <p className="text-xs text-[var(--text-secondary)]">Play sounds for notifications</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.soundEnabled}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Vibration</span>
                          <p className="text-xs text-[var(--text-secondary)]">Vibrate on mobile devices</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={notificationSettings.vibrationEnabled}
                          onChange={(e) => setNotificationSettings(prev => ({ ...prev, vibrationEnabled: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleNotificationUpdate}
                    loading={loading}
                    disabled={loading}
                  >
                    Save Notification Settings
                  </Button>
                </div>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <Card variant="glass" className="p-6">
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
                  General Preferences
                </h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        Default AI Model
                      </label>
                      <select
                        value={preferences.defaultModel}
                        onChange={(e) => setPreferences(prev => ({ ...prev, defaultModel: e.target.value }))}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-electric)]"
                      >
                        <option value="gpt-4">GPT-4 (Recommended)</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        <option value="claude-3">Claude 3 Opus</option>
                        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                        <option value="claude-3-haiku">Claude 3 Haiku</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Behavior Settings
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Auto-save drafts</span>
                          <p className="text-xs text-[var(--text-secondary)]">Automatically save message drafts as you type</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.autoSave}
                          onChange={(e) => setPreferences(prev => ({ ...prev, autoSave: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Show tooltips</span>
                          <p className="text-xs text-[var(--text-secondary)]">Display helpful tooltips throughout the interface</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.showTooltips}
                          onChange={(e) => setPreferences(prev => ({ ...prev, showTooltips: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-[var(--text-primary)]">Sound effects</span>
                          <p className="text-xs text-[var(--text-secondary)]">Play sounds for UI interactions</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.soundEffects}
                          onChange={(e) => setPreferences(prev => ({ ...prev, soundEffects: e.target.checked }))}
                          className="w-4 h-4 rounded border-[var(--border-secondary)] bg-[var(--bg-secondary)] text-[var(--accent-electric)] focus:ring-[var(--accent-electric)]"
                        />
                      </label>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handlePreferencesUpdate}
                    loading={loading}
                    disabled={loading}
                  >
                    Save Preferences
                  </Button>
                </div>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <Card variant="glass" className="p-6">
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
                  Security Settings
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Change Password
                    </h3>
                    <div className="space-y-4">
                      <Input
                        label="Current Password"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                        placeholder="Enter current password"
                      />
                      
                      <Input
                        label="New Password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                        placeholder="Enter new password"
                      />
                      
                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button
                      variant="primary"
                      onClick={handlePasswordChange}
                      loading={loading}
                      disabled={loading}
                      className="mt-4"
                    >
                      Update Password
                    </Button>
                  </div>

                  <div className="pt-6 border-t border-[var(--border-secondary)]">
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Two-Factor Authentication
                    </h3>
                    <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          2FA Status: <span className="text-red-400">Disabled</span>
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Button variant="secondary">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--border-secondary)]">
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Active Sessions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Current Session</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Chrome on macOS • Last seen just now
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                          Active
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" className="mt-3">
                      View All Sessions
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <Card variant="glass" className="p-6">
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
                  Billing & Subscription
                </h2>
                
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-[var(--accent-electric)]/10 to-[var(--accent-purple)]/10 rounded-lg border border-[var(--accent-electric)]/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Free Plan</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Perfect for getting started</p>
                      </div>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">Active</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--text-muted)]">Monthly Messages</span>
                        <p className="text-[var(--text-primary)] font-medium">1,000 / 1,000</p>
                        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 mt-1">
                          <div className="bg-[var(--accent-electric)] h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Projects</span>
                        <p className="text-[var(--text-primary)] font-medium">3 / 5</p>
                        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 mt-1">
                          <div className="bg-[var(--accent-purple)] h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Storage</span>
                        <p className="text-[var(--text-primary)] font-medium">2.1GB / 5GB</p>
                        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 mt-1">
                          <div className="bg-[var(--accent-plasma)] h-2 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[var(--text-muted)]">Models</span>
                        <p className="text-[var(--text-primary)] font-medium">Basic</p>
                        <p className="text-xs text-[var(--text-secondary)]">GPT-3.5</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card variant="glass" className="p-6 border-2 border-[var(--accent-electric)]/30">
                      <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Pro Plan</h4>
                      <p className="text-2xl font-bold text-[var(--accent-electric)] mb-2">$19<span className="text-sm font-normal">/month</span></p>
                      <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-4">
                        <li>✅ 10,000 messages/month</li>
                        <li>✅ Unlimited projects</li>
                        <li>✅ 50GB storage</li>
                        <li>✅ GPT-4 access</li>
                        <li>✅ Priority support</li>
                      </ul>
                      <Button variant="primary" className="w-full">
                        Upgrade to Pro
                      </Button>
                    </Card>

                    <Card variant="glass" className="p-6 border-2 border-[var(--accent-purple)]/30">
                      <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Enterprise</h4>
                      <p className="text-2xl font-bold text-[var(--accent-purple)] mb-2">Custom</p>
                      <ul className="space-y-2 text-sm text-[var(--text-secondary)] mb-4">
                        <li>✅ Unlimited everything</li>
                        <li>✅ Custom models</li>
                        <li>✅ Team collaboration</li>
                        <li>✅ API access</li>
                        <li>✅ Dedicated support</li>
                      </ul>
                      <Button variant="secondary" className="w-full">
                        Contact Sales
                      </Button>
                    </Card>
                  </div>

                  <div className="pt-6 border-t border-[var(--border-secondary)]">
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Usage Analytics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                        <p className="text-sm text-[var(--text-secondary)]">This Month</p>
                        <p className="text-2xl font-semibold text-[var(--text-primary)]">847</p>
                        <p className="text-xs text-[var(--text-secondary)]">Messages sent</p>
                      </div>
                      <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                        <p className="text-sm text-[var(--text-secondary)]">Average Daily</p>
                        <p className="text-2xl font-semibold text-[var(--text-primary)]">28</p>
                        <p className="text-xs text-[var(--text-secondary)]">Messages</p>
                      </div>
                      <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                        <p className="text-sm text-[var(--text-secondary)]">Most Used</p>
                        <p className="text-2xl font-semibold text-[var(--text-primary)]">GPT-4</p>
                        <p className="text-xs text-[var(--text-secondary)]">AI Model</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <Card variant="glass" className="p-6">
                <h2 className="text-heading-xl text-[var(--text-primary)] mb-6">
                  Advanced Settings
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Data Management
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Export Your Data</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Download a copy of your projects, conversations, and settings
                          </p>
                        </div>
                        <Button variant="secondary">
                          Export Data
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Clear Cache</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Clear stored data to free up space and refresh the app
                          </p>
                        </div>
                        <Button variant="ghost">
                          Clear Cache
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--border-secondary)]">
                    <h3 className="text-heading-lg text-[var(--text-primary)] mb-4">
                      Developer Tools
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">API Access</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Generate API keys for programmatic access
                          </p>
                        </div>
                        <Button variant="secondary">
                          Manage API Keys
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-secondary)]">
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">Webhooks</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Configure webhooks for real-time notifications
                          </p>
                        </div>
                        <Button variant="secondary">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-red-500/20">
                    <h3 className="text-heading-lg text-red-400 mb-4">
                      Danger Zone
                    </h3>
                    <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-400">Delete Account</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Permanently delete your account and all associated data
                          </p>
                        </div>
                        <Button
                          variant="danger"
                          onClick={handleDeleteAccount}
                          loading={loading}
                          disabled={loading}
                        >
                          Delete Account
                        </Button>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-3">
                        ⚠️ This action cannot be undone. All your projects, conversations, and settings will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage; 