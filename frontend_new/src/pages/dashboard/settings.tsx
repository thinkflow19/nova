import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, User as UserIcon, Lock, Bell, Shield, Trash, AlertCircle, MonitorPlay, Moon, Sun, Palette } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, SelectItem } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Loader } from '../../components/ui/Loader';
import { useTheme } from 'next-themes';
import { cn } from '@/utils/cn';

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
  profilePictureUrl?: string;
}

type TabType = 'profile' | 'security' | 'notifications' | 'appearance' | 'danger';

const appThemes = [
  { id: 'system', name: 'System Default', icon: MonitorPlay },
  { id: 'light', name: 'Light Mode', icon: Sun },
  { id: 'dark', name: 'Dark Mode', icon: Moon },
];

const timezones = Intl.supportedValuesOf('timeZone');

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
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
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    profilePictureUrl: undefined,
  });
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: (user as any).user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        profilePictureUrl: (user as any).user_metadata?.avatar_url || undefined,
      }));
    }
  }, [user]);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name.startsWith('notifications.')) {
      const notificationKey = name.split('.')[1] as 'email' | 'app';
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationKey]: checked,
        },
      }));
    } else if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };
  
  const handleNotificationSwitch = (key: 'email' | 'app', isSelected: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: isSelected,
      },
    }));
  };
  
  const handleTimezoneChange = (value: string) => {
    setFormData(prev => ({ ...prev, timezone: value }));
  };

  const handleProfilePictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, profilePictureUrl: event.target?.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
      setSuccess('Profile picture selected. Click Save Changes to apply.');
    }
  };
  
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      console.log('Updating profile with:', { name: formData.name, email: formData.email, avatar_url: formData.profilePictureUrl });
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Password changed successfully');
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      try {
        await deleteUserAccount();
        setSuccess('Account deleted successfully');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete account');
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  if (authLoading || !mounted) {
    return <DashboardLayout><div className="flex h-full items-center justify-center"><Loader size="lg" /></div></DashboardLayout>;
  }
    
  const currentAppTheme = theme || 'system';

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'danger', label: 'Danger Zone', icon: AlertCircle },
  ];
  
  return (
    <DashboardLayout>
      <Head>
        <title>Settings | Nova AI</title>
        <meta name="description" content="Manage your Nova AI account settings" />
      </Head>
      
      <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your profile, security, and app preferences.</p>
        </motion.div>
        
        {error && (
          <Card className="mb-6 bg-red-500/10 border border-red-600 text-red-700 dark:text-red-400 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </Card>
        )}
        {success && (
          <Card className="mb-6 bg-green-500/10 border border-green-600 text-green-700 dark:text-green-400 p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{success}</p>
          </Card>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <nav className="space-y-1 sticky top-20">
              {tabs.map(tab => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    "w-full justify-start px-3 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.id 
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-4 h-4 mr-3 shrink-0" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          </aside>
          
          <main className="flex-1 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {activeTab === 'profile' && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Profile Information</CardTitle>
                    <CardDescription>Update your personal details and profile picture.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleSaveProfile}>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col items-center space-y-3">
                        <img 
                          src={formData.profilePictureUrl || `https://avatar.vercel.sh/${formData.email || 'user'}.png?size=120`}
                          alt="Profile" 
                          className="w-28 h-28 rounded-full object-cover shadow-md ring-2 ring-primary/20"
                        />
                        <input 
                          type="file" 
                          id="profilePictureInput" 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleProfilePictureChange}
                        />
                        <label htmlFor="profilePictureInput">
                          <Button type="button" className="text-sm px-4 py-1.5">Change Picture</Button>
                        </label>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="name" className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Your full name" className="w-full" />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email Address</label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" className="w-full" disabled />
                        <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                      <Button type="submit" className="ml-auto min-w-[120px]" disabled={isSaving}>
                        {isSaving ? <Loader size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Changes
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}
              
              {activeTab === 'security' && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Security Settings</CardTitle>
                    <CardDescription>Manage your password and account security.</CardDescription>
                  </CardHeader>
                  <form onSubmit={handleChangePassword}>
                    <CardContent className="space-y-6">
                      <div className="space-y-1.5">
                        <label htmlFor="currentPassword" className="text-sm font-medium text-muted-foreground">Current Password</label>
                        <Input id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} placeholder="Enter your current password" className="w-full" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">New Password</label>
                          <Input id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} placeholder="Enter new password" className="w-full" />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                          <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm new password" className="w-full" />
                        </div>
                      </div>
                      {/* Add password strength indicator here if desired */}
                    </CardContent>
                    <CardFooter className="border-t pt-6">
                      <Button type="submit" className="ml-auto min-w-[160px]" disabled={isSaving || !formData.currentPassword || !formData.newPassword || formData.newPassword !== formData.confirmPassword}>
                        {isSaving ? <Loader size="sm" className="mr-2" /> : <Lock className="w-4 h-4 mr-2" />} Change Password
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}
              
              {activeTab === 'notifications' && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Notification Settings</CardTitle>
                    <CardDescription>Choose how you receive notifications from us.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8 pt-6">
                    <div className="space-y-4">
                      <h3 className="text-base font-semibold text-foreground">Channels</h3>
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                        <div>
                          <label htmlFor="emailNotifications" className="font-medium text-foreground block">Email Notifications</label>
                          <p className="text-xs text-muted-foreground">Receive important updates and summaries via email.</p>
                        </div>
                        <Switch 
                          id="emailNotifications" 
                          checked={formData.notifications.email} 
                          onCheckedChange={(checked: boolean) => handleNotificationSwitch('email', checked)} 
                          aria-label="Email notifications toggle"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                        <div>
                          <label htmlFor="appNotifications" className="font-medium text-foreground block">In-App Notifications</label>
                          <p className="text-xs text-muted-foreground">Get real-time alerts within the application.</p>
                        </div>
                        <Switch 
                          id="appNotifications" 
                          checked={formData.notifications.app} 
                          onCheckedChange={(checked: boolean) => handleNotificationSwitch('app', checked)} 
                          aria-label="In-app notifications toggle"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="timezone" className="text-sm font-medium text-muted-foreground">Timezone</label>
                      <Select
                        value={formData.timezone}
                        onValueChange={handleTimezoneChange}
                      >
                        {timezones.map(tz => (
                          <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ' )}</SelectItem>
                        ))}
                      </Select>
                      <p className="text-xs text-muted-foreground">Set your local timezone for accurate scheduling and timestamps.</p>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6">
                     <Button type="button" onClick={handleSaveProfile} className="ml-auto min-w-[120px]" disabled={isSaving}> 
                        {isSaving ? <Loader size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Preferences
                     </Button>
                  </CardFooter>
                </Card>
              )}
              
              {activeTab === 'appearance' && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">Theme</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {appThemes.map((themeOption) => (
                          <Button
                            key={themeOption.id}
                            onClick={() => setTheme(themeOption.id)}
                            variant={currentAppTheme === themeOption.id ? 'default' : 'outline'}
                            className={cn(
                              "w-full h-auto py-3 px-4 flex flex-col items-center justify-center space-y-2 rounded-lg transition-all",
                              currentAppTheme === themeOption.id 
                                ? "bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                                : "bg-card hover:bg-muted/80 border-border text-foreground"
                            )}
                          >
                            <themeOption.icon size={24} className={cn("mb-1", currentAppTheme === themeOption.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                            <span className="text-sm font-medium">{themeOption.name}</span>
                          </Button>
                        ))}
                      </div>
                      {currentAppTheme === 'system' && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Nova will automatically switch between light and dark themes based on your system settings. Currently: <span className="font-semibold capitalize">{resolvedTheme}</span> mode.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {activeTab === 'danger' && (
                <Card className="shadow-lg border-red-500/50 dark:border-red-400/40">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                      <CardTitle className="text-xl text-red-500 dark:text-red-400">Danger Zone</CardTitle>
                    </div>
                    <CardDescription className="text-red-600/90 dark:text-red-400/80">Manage critical account actions. These actions are irreversible.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="p-4 border border-red-500/30 dark:border-red-400/30 rounded-lg bg-red-500/5 dark:bg-red-400/10">
                      <h3 className="font-semibold text-red-700 dark:text-red-300">Delete Account</h3>
                      <p className="text-sm text-red-600 dark:text-red-400/90 mt-1 mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        className="min-w-[150px]"
                        disabled={isSaving}
                      >
                        {isSaving && activeTab === 'danger' ? <Loader size="sm" className="mr-2" /> : <Trash className="w-4 h-4 mr-2" />} Delete My Account
                      </Button>
                    </div>
                    {/* Other dangerous actions could be listed here */}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

// Helper function for delete account (could be moved to a service)
async function deleteUserAccount() {
  // Replace with actual API call to delete user
  console.warn('Attempting to delete user account (mock)');
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate success or failure
      const success = Math.random() > 0.2; // 80% success rate for mock
      if (success) {
        console.log('User account deleted successfully (mock)');
        resolve({ message: 'Account deleted successfully' });
      } else {
        console.error('Failed to delete user account (mock)');
        reject(new Error('Mock server error: Could not delete account.'));
      }
    }, 1500);
  });
} 