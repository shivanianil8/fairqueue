import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Building2, 
  User, 
  ChevronDown, 
  LogOut, 
  Users, 
  Settings, 
  ShieldCheck 
} from 'lucide-react';
import { api } from '../services/api.js';
import { navigate } from '../services/router.js';

export default function TopHeader({
  title,
  subtitle,
  onGlobalSearch,
  activeTab,
  queues = [],
  selectedQueueId,
  onSelectQueue,
  currentUser = null,
  activeOrganization = null,
  onNavigateTab,
  onLogout,
}) {
  const [currentTime, setCurrentTime] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const formatted = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setCurrentTime(formatted);
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  const role = currentUser?.role || 'ORGANIZATION_ADMIN';
  const userInitials = currentUser?.name
    ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US';

  const roleBadgeStyle = {
    ORGANIZATION_ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
    QUEUE_MANAGER: 'bg-blue-50 text-blue-700 border-blue-200',
    OPERATOR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    VIEWER: 'bg-slate-100 text-slate-700 border-slate-200',
  }[role] || 'bg-slate-100 text-slate-700 border-slate-200';

  async function handleSignOut() {
    await api.logout();
    if (onLogout) onLogout();
    navigate('/login');
  }

  function handleSelectMenu(tab) {
    setIsUserMenuOpen(false);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  }

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Page Title & Organization Context */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-sm font-semibold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>{title}</span>
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-400 font-normal leading-none mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Real Active Organization Badge */}
        {activeOrganization && (
          <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-medium tracking-tight">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-800">{activeOrganization.name}</span>
            <span className="text-slate-400 text-[10px]">({activeOrganization.type || 'Standard'})</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Active Queue Switcher */}
        {queues.length > 0 && (
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Desk:</span>
            <select
              value={selectedQueueId || ''}
              onChange={(e) => onSelectQueue && onSelectQueue(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {queues.map((q) => (
                <option key={q.queueId} value={q.queueId}>
                  [{q.prefix}] {q.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quick Search */}
        <div className="relative hidden md:block">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search tickets, names..."
            onChange={(e) => onGlobalSearch && onGlobalSearch(e.target.value)}
            className="pl-8 pr-3 py-1 rounded-md text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 w-44 transition text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Live Date / Time */}
        <div className="hidden lg:flex items-center text-xs text-slate-500 font-mono">
          <span>{currentTime}</span>
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-4 w-px bg-slate-200" />

        {/* Authenticated User Account Menu (NO FAKE ROLE SWITCHER) */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2 p-1 rounded hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shadow-2xs">
              {userInitials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[11px] font-semibold text-slate-800 leading-none">
                {currentUser?.name || 'Authenticated User'}
              </div>
              <div className="flex items-center space-x-1 mt-0.5">
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded border leading-none ${roleBadgeStyle}`}>
                  {role}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* User Profile & Workspace Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-slate-200 shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser?.name}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate">
                  {currentUser?.email}
                </div>
                <div className="mt-1">
                  <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded border ${roleBadgeStyle}`}>
                    Role: {role}
                  </span>
                </div>
              </div>

              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => handleSelectMenu('profile')}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => handleSelectMenu('team')}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Team & Permissions</span>
                </button>

                <button
                  onClick={() => handleSelectMenu('organization')}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Organization Settings</span>
                </button>

                <button
                  onClick={() => handleSelectMenu('account')}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account & Security</span>
                </button>
              </div>

              <div className="pt-1 mt-1 border-t border-slate-100 p-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-left text-rose-700 hover:bg-rose-50 transition font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
