import React, { useState } from 'react';
import { User, Mail, Lock, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';

export default function ProfilePage({ currentUser, onProfileUpdated }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [statusMessage, setStatusMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setStatusMessage(null);

    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setStatusMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      const payload = { name: name.trim() };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmPassword = confirmPassword;
      }

      const res = await api.updateProfile(payload);
      setStatusMessage({ type: 'success', text: 'Profile successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (onProfileUpdated && res.data) {
        onProfileUpdated(res.data);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">Account Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your credentials, name, and security settings</p>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-md text-xs flex items-center space-x-2 border ${
          statusMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Role & Identification Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
              <span>{currentUser?.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                {currentUser?.role || 'ORGANIZATION_ADMIN'}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">{currentUser?.email}</div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Personal Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700">Full Name</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Email Address (Read-only)</label>
                <div className="mt-1">
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Change Password</h3>
            <p className="text-[11px] text-slate-500 leading-none">Leave blank if you do not wish to change your password.</p>

            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-medium text-slate-700">Current Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">New Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">Confirm New Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition"
            >
              {isLoading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
