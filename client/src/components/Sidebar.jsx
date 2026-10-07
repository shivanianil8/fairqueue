import React from 'react';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Sparkles, 
  Users, 
  Scale, 
  History, 
  Activity, 
  GraduationCap, 
  Settings2,
  BarChart3,
  ShieldCheck,
  Building2,
  UserCheck,
  User
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, systemStatus, currentUser }) {
  const operationsNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'queue', label: 'Queue Management', icon: ListOrdered },
    { id: 'analyze', label: 'Decision Support', icon: Sparkles },
    { id: 'people', label: 'Visitor Directory', icon: Users },
  ];

  const governanceNav = [
    { id: 'reports', label: 'Operational Reports', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
  ];

  const policyNav = [
    { id: 'rules', label: 'Rules & Logic', icon: Scale },
    { id: 'history', label: 'Analysis History', icon: History },
  ];

  const adminNav = [
    { id: 'team', label: 'Team & RBAC', icon: UserCheck },
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const systemNav = [
    { id: 'status', label: 'System Status', icon: Activity },
    { id: 'viva', label: 'Viva Guide', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings2 },
  ];

  const isSwipl = systemStatus?.prologEngine?.swiplAvailable;
  const engineName = isSwipl ? 'SWI-Prolog' : 'Tau-Prolog (ISO)';

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between flex-shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Top Header / Brand Logo */}
      <div className="overflow-y-auto">
        <div className="h-14 px-4 flex items-center border-b border-slate-100">
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            {/* Geometric minimal logo mark */}
            <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-slate-800 transition">
              <span className="font-mono text-xs font-bold tracking-tight">FQ</span>
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 tracking-tight leading-none">FAIRQUEUE</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">Decision-Support Platform</div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="p-3 space-y-5">
          {/* Operations */}
          <div className="space-y-0.5">
            <div className="px-2.5 pb-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Operations
            </div>
            {operationsNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Governance & Compliance */}
          <div className="space-y-0.5 pt-1.5 border-t border-slate-100">
            <div className="px-2.5 pb-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Governance & Metrics
            </div>
            {governanceNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Policy & Rules */}
          <div className="space-y-0.5 pt-1.5 border-t border-slate-100">
            <div className="px-2.5 pb-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Rules & Policy
            </div>
            {policyNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Administration & Workspace */}
          <div className="space-y-0.5 pt-1.5 border-t border-slate-100">
            <div className="px-2.5 pb-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Administration
            </div>
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* System Telemetry */}
          <div className="space-y-0.5 pt-1.5 border-t border-slate-100">
            <div className="px-2.5 pb-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              System
            </div>
            {systemNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition duration-150 ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Logic Engine Health Indicator */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="p-2.5 rounded-md border border-slate-200/80 bg-white space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700">Prolog Engine</span>
            <div className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-700 font-medium">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100 font-mono">
            <span>{engineName}</span>
            <span className="text-slate-400">Pure Horn Clauses</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
