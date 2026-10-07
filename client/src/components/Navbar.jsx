import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Sparkles, 
  FileText, 
  Sliders, 
  History, 
  GraduationCap,
  Database,
  Cpu
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, systemStatus }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Queue', icon: Sparkles, highlight: true },
    { id: 'queue', label: 'Queue', icon: Users },
    { id: 'add', label: 'Add Person', icon: UserPlus },
    { id: 'decision', label: 'Decision Details', icon: FileText },
    { id: 'rules', label: 'Rules & Logic', icon: Sliders },
    { id: 'history', label: 'History', icon: History },
    { id: 'viva', label: 'Viva Guide', icon: GraduationCap },
  ];

  const engineLabel = systemStatus?.prologEngine?.swiplAvailable
    ? 'SWI-Prolog (Native)'
    : 'Tau-Prolog (Embedded ISO)';

  const dbLabel = systemStatus?.database?.connected
    ? 'MongoDB Connected'
    : 'Local In-Memory Store';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">FAIRQUEUE</span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60">
                  Logic Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Intelligent Queue Fairness Analyzer</p>
            </div>
          </div>

          {/* Engine & DB System Status Badges */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200" title="Active Prolog Logic Engine">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span>{engineLabel}</span>
            </div>
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
              systemStatus?.database?.connected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`} title="Database Persistence State">
              <Database className="w-3.5 h-3.5" />
              <span>{dbLabel}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto py-2 -mb-px border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? item.highlight
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-900 shadow-sm'
                    : item.highlight
                    ? 'text-blue-600 hover:bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive && item.highlight ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
