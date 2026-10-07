import React from 'react';
import { User, LogOut, ShieldCheck, Clock, Key } from 'lucide-react';
import { api } from '../services/api.js';
import { navigate } from '../services/router.js';

export default function AccountSettingsPage({ currentUser, onLogout }) {
  async function handleSignOut() {
    await api.logout();
    if (onLogout) onLogout();
    navigate('/login');
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900 tracking-tight">Account & Session</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage authentication sessions and credentials</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Active Session Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Authenticated Identity</div>
            <div className="font-semibold text-slate-900 mt-1">{currentUser?.name}</div>
            <div className="font-mono text-slate-600 text-[11px] mt-0.5">{currentUser?.email}</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Role</div>
            <div className="font-mono font-semibold text-slate-900 mt-1">{currentUser?.role || 'ORGANIZATION_ADMIN'}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">Scoped to current organization database partition</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Session Token Type</div>
            <div className="font-mono font-semibold text-slate-900 mt-1">HTTP-Only Cookie + Bearer Fallback</div>
            <div className="text-slate-500 text-[11px] mt-0.5">SHA-256 HMAC cryptographic token</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Password Encryption</div>
            <div className="font-mono font-semibold text-slate-900 mt-1">PBKDF2-SHA512</div>
            <div className="text-slate-500 text-[11px] mt-0.5">10,000 rounds with 16-byte random salt</div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-900">Terminate Active Session</div>
            <div className="text-[11px] text-slate-500">Signs out and clears authentication cookie and token</div>
          </div>

          <button
            onClick={handleSignOut}
            className="px-4 py-2 border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md text-xs font-medium transition flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
