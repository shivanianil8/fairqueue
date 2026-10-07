import React from 'react';
import { Settings2, RotateCcw, Sliders, Database, Server } from 'lucide-react';

export default function SettingsPage({
  thresholds = {},
  onUpdateThresholds,
  onSeedDemo,
  onClearQueue,
  peopleCount,
}) {
  return (
    <div className="space-y-6 max-w-3xl text-xs">
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Operational preferences, database reset tools, and queue parameters.
        </p>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-2xs divide-y divide-slate-100">
        {/* Reset Demo Data */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900">Reload Demo Dataset</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Populates 12 realistic service-centre cases with consistent arrival and wait times.
            </div>
          </div>
          <button
            onClick={onSeedDemo}
            className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium transition"
          >
            Reset 12 Cases
          </button>
        </div>

        {/* Clear Queue */}
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900">Clear Active Queue</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Removes all {peopleCount} entries from the active queue cache.
            </div>
          </div>
          <button
            onClick={() => {
              if (confirm('Clear all entries from active queue?')) {
                onClearQueue();
              }
            }}
            className="px-3 py-1.5 rounded border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium transition"
          >
            Clear All Entries
          </button>
        </div>
      </div>
    </div>
  );
}
