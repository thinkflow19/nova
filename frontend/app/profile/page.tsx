'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiEdit2 } from 'react-icons/fi';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update logic
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-[var(--lavender)] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--gray-dark)]">Profile</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors duration-200"
          >
            <FiEdit2 className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <FiUser className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--gray-dark)]">
                {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--gray-dark)] mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    isEditing ? 'border-[var(--lavender)]' : 'border-transparent'
                  } bg-[var(--off-white)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--gray-dark)] mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent bg-[var(--off-white)]"
                />
              </div>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Email cannot be changed
              </p>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--lavender)] text-[var(--gray-dark)] hover:bg-[var(--off-white)] transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] transition-colors duration-200"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>

          {/* Account Information */}
          <div className="mt-8 pt-6 border-t border-[var(--lavender)]">
            <h3 className="text-lg font-semibold text-[var(--gray-dark)] mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Member Since</p>
                <p className="text-[var(--gray-dark)]">
                  {new Date(user?.created_at || '').toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Last Sign In</p>
                <p className="text-[var(--gray-dark)]">
                  {new Date(user?.last_sign_in_at || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 