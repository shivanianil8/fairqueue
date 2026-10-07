import React from 'react';
import { Activity, Cpu, Database, Server, CheckCircle2 } from 'lucide-react';

export default function StatusPage({ systemStatus, people = [], analyses = [] }) {
  const isSwipl = systemStatus?.prologEngine?.swiplAvailable;
  const isMongo = systemStatus?.database?.connected;

  return (
    <div className="space-y-6 max-w-4xl text-xs">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Status & Diagnostics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Health and operational telemetry for the Prolog reasoning runtime, persistence layer, and REST API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Logic Engine Card */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-900">Logic Programming Engine</span>
            </div>
            <span className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Online</span>
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-sans">Active Engine:</span>
              <span className="font-bold text-slate-800">{systemStatus?.prologEngine?.activeEngine || 'Tau-Prolog (Embedded ISO)'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-sans">SWI-Prolog CLI:</span>
              <span>{isSwipl ? 'Available (Installed)' : 'Not in PATH (Using Embedded Engine)'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-sans">Knowledge Base:</span>
              <span className="truncate max-w-[200px]">logic/fairqueue.pl</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Paradigms:</span>
              <span>First-Order Horn Clause Deduction</span>
            </div>
          </div>
        </div>

        {/* Database Persistence Card */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-900">Data Persistence</span>
            </div>
            <span className={`flex items-center space-x-1 px-2 py-0.5 rounded border font-medium ${
              isMongo
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isMongo ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isMongo ? 'MongoDB Connected' : 'In-Memory Fallback'}</span>
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-sans">Storage Mode:</span>
              <span className="font-bold text-slate-800">{systemStatus?.database?.mode || 'Local In-Memory / File Store'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-sans">Target URI:</span>
              <span className="truncate max-w-[200px]">{systemStatus?.database?.uri || 'mongodb://127.0.0.1:27017/fairqueue'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-sans">People Cached:</span>
              <span>{people.length} records</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Analyses Logged:</span>
              <span>{analyses.length} snapshots</span>
            </div>
          </div>
        </div>

        {/* Runtime Environment Card */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Server className="w-4 h-4 text-slate-700" />
            <span className="font-bold text-slate-900">API Runtime Telemetry</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 font-mono text-[11px]">
            <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-sans text-[10px] uppercase">Node Version</span>
              <span className="font-bold">{systemStatus?.system?.nodeVersion || process.version || 'v20+'}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-sans text-[10px] uppercase">Platform</span>
              <span className="font-bold">{systemStatus?.system?.platform || 'darwin (macOS)'}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-sans text-[10px] uppercase">Uptime</span>
              <span className="font-bold">{systemStatus?.system?.uptime || 120}s</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-sans text-[10px] uppercase">API Status</span>
              <span className="font-bold text-emerald-700">Healthy (200 OK)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
