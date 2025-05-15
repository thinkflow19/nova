import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Save, User as UserIcon, Lock, Bell, Shield, Trash, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import { Card as GlassCard } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';

interface FormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  notifications: {
    email: boolean;
    app: boolean;
  };
  timezone: string;
}

type TabType = 'profile' | 'security' | 'notifications' | 'danger';

export default function Settings() {
  const { user, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    notifications: {
      email: true,
      app: true,
    },
    timezone: 'UTC',
  });
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Update form with user data when it loads
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        // Handle user properties safely with type assertion for custom properties
        name: (user as any).name || (user as any).full_name || '',
        email: user.email || '',
      }));
    }
  }, [user]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.startsWith('notifications.')) {
      const notificationKey = name.split('.')[1] as 'email' | 'app';
      setFormData({
        ...formData,
        notifications: {
          ...formData.notifications,
          [notificationKey]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };
  
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update profile logic would go here
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Change password logic would go here
      
      setSuccess('Password changed successfully');
      
      // Reset password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <Head>
        <title>Settings | Nova AI</title>
        <meta name="description" content="Manage your Nova AI account settings" />
      </Head>
      
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold premium-text-gradient mb-6">Account Settings</h1>
        
        {error && (
          <div className="bg-destructive/10 border border-destructive text-foreground rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle className="w-5 h-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-foreground rounded-lg p-4 mb-6 flex items-start">
            <Shield className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64">
            <GlassCard className="p-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-card-foreground/5 hover:text-foreground'
                  }`}
                >
                  <UserIcon className="h-5 w-5 mr-3" />
                  <span>Profile</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeTab === 'security'
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-card-foreground/5 hover:text-foreground'
                  }`}
                >
                  <Lock className="h-5 w-5 mr-3" />
                  <span>Security</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:bg-card-foreground/5 hover:text-foreground'
                  }`}
                >
                  <Bell className="h-5 w-5 mr-3" />
                  <span>Notifications</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('danger')}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                    activeTab === 'danger'
                      ? 'bg-destructive/10 text-destructive'
                      : 'text-muted-foreground hover:bg-destructive/5 hover:text-destructive'
                  }`}
                >
                  <Trash className="h-5 w-5 mr-3" />
                  <span>Danger Zone</span>
                </button>
              </nav>
            </GlassCard>
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <GlassCard className="p-6">
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
                  
                  <form onSubmit={handleSaveProfile}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="input-premium"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="input-premium"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="timezone" className="block text-sm font-medium mb-1">
                          Timezone
                        </label>
                        <select
                          id="timezone"
                          name="timezone"
                          value={formData.timezone}
                          onChange={handleChange}
                          className="select-premium"
                        >
                          <option value="UTC">UTC (Coordinated Universal Time)</option>
                          <option value="EST">EST (Eastern Standard Time)</option>
                          <option value="CST">CST (Central Standard Time)</option>
                          <option value="MST">MST (Mountain Standard Time)</option>
                          <option value="PST">PST (Pacific Standard Time)</option>
                        </select>
                      </div>
                      
                      <div className="pt-4">
                        <Button
                          type="submit"
                          isLoading={isSaving}
                          leftIcon={<Save className="w-4 h-4" />}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
              
              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                  
                  <form onSubmit={handleChangePassword}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          name="currentPassword"
                          value={formData.currentPassword}
                          onChange={handleChange}
                          className="input-premium"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="input-premium"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="input-premium"
                          required
                        />
                      </div>
                      
                      <div className="pt-4">
                        <Button
                          type="submit"
                          isLoading={isSaving}
                        >
                          Change Password
                        </Button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
              
              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifications.email"
                          checked={formData.notifications.email}
                          onChange={handleChange}
                          className="w-4 h-4 text-accent bg-card border-border rounded focus:ring-accent/50"
                        />
                        <span className="ml-2">Email notifications</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Receive email notifications for important updates and activity.
                      </p>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="notifications.app"
                          checked={formData.notifications.app}
                          onChange={handleChange}
                          className="w-4 h-4 text-accent bg-card border-border rounded focus:ring-accent/50"
                        />
                        <span className="ml-2">In-app notifications</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        Receive notifications within the app when you're logged in.
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <Button
                        onClick={handleSaveProfile}
                        isLoading={isSaving}
                      >
                        Save Preferences
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'danger' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-6 text-destructive">Danger Zone</h2>
                  
                  <div className="space-y-6">
                    <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                      <h3 className="text-lg font-medium">Delete Account</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Once you delete your account, there is no going back. All your data will be permanently removed.
                      </p>
                      <Button
                        variant="destructive"
                      >
                        Delete My Account
                      </Button>
                    </div>
                    
                    <div className="p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                      <h3 className="text-lg font-medium">Clear All Data</h3>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        This will delete all your agents, chat history, and uploaded documents.
                      </p>
                      <Button
                        variant="destructive"
                      >
                        Clear All Data
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 