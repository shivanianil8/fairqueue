import React, { useState } from 'react';
import { History, X, Users, Clock, Eye, Sparkles } from 'lucide-react';
import { PriorityBadge, PositionIndicator } from '../components/Badges.jsx';

export default function HistoryPage({ analyses = [], onNavigate }) {
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analysis History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit log of all historical Prolog queue evaluations and generated priority decisions.
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        {analyses.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <History className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-800">No historical analyses recorded</p>
            <p className="text-slate-400">Run an analysis from the Overview or Analyze page to record snapshots.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">ANALYSIS ID</th>
                <th className="py-2.5 px-3">DATE & TIME</th>
                <th className="py-2.5 px-3">PEOPLE</th>
                <th className="py-2.5 px-3">RULES EVALUATED</th>
                <th className="py-2.5 px-3">DECISIONS</th>
                <th className="py-2.5 px-3">LOGIC ENGINE</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analyses.map((item, idx) => {
                const formattedId = item.analysisId.startsWith('ANL-') 
                  ? `Analysis #A-${item.analysisId.slice(4, 9)}`
                  : `Analysis #${item.analysisId}`;

                return (
                  <tr
                    key={item.analysisId}
                    onClick={() => setSelectedSnapshot(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {formattedId}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {new Date(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700">
                      {item.totalPeople} people
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700">
                      12 rules
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700">
                      {item.totalPeople} decisions
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {item.engineUsed || 'SWI-Prolog'}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Completed</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSnapshot(item);
                        }}
                        className="px-2 py-0.5 rounded border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-white"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Snapshot Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-[1px]"
            onClick={() => setSelectedSnapshot(null)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-lg border border-slate-200 shadow-2xl p-6 z-10 space-y-4 text-xs animate-fade-in max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-[11px] text-slate-400 font-semibold">{selectedSnapshot.analysisId}</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">Historical Snapshot Details</h3>
                <p className="text-xs text-slate-500">{new Date(selectedSnapshot.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-4 gap-2 border border-slate-200 rounded p-3 text-center">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Evaluated</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{selectedSnapshot.totalPeople}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-rose-500 block">High</span>
                <span className="font-mono font-bold text-rose-700 text-sm">{selectedSnapshot.highPriorityCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-amber-500 block">Medium</span>
                <span className="font-mono font-bold text-amber-700 text-sm">{selectedSnapshot.mediumPriorityCount}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-emerald-500 block">Normal</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">{selectedSnapshot.normalPriorityCount}</span>
              </div>
            </div>

            {/* Recommended Queue Order in Snapshot */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                Prioritized Order in this Snapshot
              </span>
              <div className="border border-slate-200 rounded divide-y divide-slate-100 overflow-hidden">
                {selectedSnapshot.rankedQueue && selectedSnapshot.rankedQueue.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-3">
                      <PositionIndicator position={idx + 1} priority={item.priority} />
                      <div>
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        <span className="text-slate-400 font-mono ml-1.5 text-[11px]">({item.personId})</span>
                        <div className="text-[11px] text-slate-500 truncate max-w-sm">
                          {item.explanation}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-500">{item.waitingTime}m wait</span>
                      <PriorityBadge priority={item.priority} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-3.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
