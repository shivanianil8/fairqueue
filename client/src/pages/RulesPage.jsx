import React, { useState, useEffect } from 'react';
import { Scale, Sliders, Info, Check, RotateCcw, Save } from 'lucide-react';

export default function RulesPage({
  rules = [],
  thresholds = {},
  onUpdateThresholds,
}) {
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' | 'thresholds'
  const [filterTier, setFilterTier] = useState('all');

  const [configForm, setConfigForm] = useState({
    criticalWait: thresholds.criticalWait ?? 60,
    longWait: thresholds.longWait ?? 30,
    vulnerableWait: thresholds.vulnerableWait ?? 20,
    moderateWait: thresholds.moderateWait ?? 15,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setConfigForm({
      criticalWait: thresholds.criticalWait ?? 60,
      longWait: thresholds.longWait ?? 30,
      vulnerableWait: thresholds.vulnerableWait ?? 20,
      moderateWait: thresholds.moderateWait ?? 15,
    });
  }, [thresholds]);

  async function handleSave(e) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateThresholds(configForm);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Error saving thresholds: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  const filteredRules = rules.filter(r => {
    if (filterTier === 'all') return true;
    return r.tier.toLowerCase() === filterTier;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Rules & Logic</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure and inspect the rules used by the fairness reasoning engine.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 border border-slate-200 rounded p-0.5 bg-slate-50 text-xs">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeSubTab === 'catalog' ? 'bg-white shadow-2xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rule Catalog ({rules.length})
          </button>
          <button
            onClick={() => setActiveSubTab('thresholds')}
            className={`px-3 py-1 rounded font-medium transition ${
              activeSubTab === 'thresholds' ? 'bg-white shadow-2xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Threshold Parameters
          </button>
        </div>
      </div>

      {/* Disclaimers & Regulatory Notice */}
      <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex items-start space-x-2">
        <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-0.5">
          <span className="font-semibold text-slate-800">Project-defined rule base &bull; </span>
          <span>
            Rules are configurable and determine the behaviour of the reasoning engine. They represent institutional guidelines rather than universal laws.
          </span>
        </div>
      </div>

      {/* VIEW 1: RULE CATALOG TABLE / CARDS */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-3">
          {/* Tier Filter */}
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-400 mr-2 text-[11px] font-medium">Filter Tier:</span>
            {['all', 'high', 'medium', 'normal'].map(tier => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-2.5 py-1 rounded text-xs uppercase font-medium transition ${
                  filterTier === tier
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>

          {/* Structured Rules Table */}
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-28">RULE ID</th>
                  <th className="py-2.5 px-3 w-48">NAME</th>
                  <th className="py-2.5 px-3">CONDITION (IF)</th>
                  <th className="py-2.5 px-3">CONCLUSION (THEN)</th>
                  <th className="py-2.5 px-3 w-24">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRules.map((rule, idx) => {
                  const formattedId = `RULE-${String(idx + 1).padStart(3, '0')}`;
                  const tierBadge =
                    rule.tier === 'HIGH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    rule.tier === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200';

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap font-mono font-semibold text-slate-700">
                        {formattedId}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{rule.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5">{rule.id}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-700 leading-relaxed max-w-sm">
                        <div className="text-slate-500 font-semibold mb-0.5 text-[10px] uppercase font-sans">IF</div>
                        <span className="bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded block">
                          {rule.condition}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-800 leading-relaxed max-w-xs">
                        <div className="text-slate-500 font-semibold mb-0.5 text-[10px] uppercase font-sans">THEN</div>
                        <span className={`inline-block px-1.5 py-0.5 rounded border text-[11px] font-semibold ${tierBadge}`}>
                          priority(Person, {rule.tier.toLowerCase()})
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 text-emerald-700 text-[11px] font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CONFIGURE THRESHOLDS */}
      {activeSubTab === 'thresholds' && (
        <div className="max-w-xl bg-white rounded-md border border-slate-200 shadow-2xs p-5 space-y-4 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Waiting Time Thresholds</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Parameters asserted dynamically into Prolog as <code className="font-mono text-[11px]">threshold(Name, Minutes)</code>.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Thresholds updated. Next queue analysis will evaluate these parameters.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-3">
              {/* Critical Wait */}
              <div className="p-3 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-800">Critical Wait (Starvation Prevention)</label>
                  <span className="font-mono font-bold text-slate-900">{configForm.criticalWait} min</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Breaching this elevates any person to HIGH priority regardless of baseline urgency.
                </p>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="5"
                  value={configForm.criticalWait}
                  onChange={e => setConfigForm({ ...configForm, criticalWait: Number(e.target.value) })}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              {/* Long Wait */}
              <div className="p-3 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-800">Long Wait (Scheduled SLA Breach)</label>
                  <span className="font-mono font-bold text-slate-900">{configForm.longWait} min</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Breaching this triggers appointment SLA violation escalation.
                </p>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="5"
                  value={configForm.longWait}
                  onChange={e => setConfigForm({ ...configForm, longWait: Number(e.target.value) })}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              {/* Vulnerable Wait */}
              <div className="p-3 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-800">Vulnerable Group Wait</label>
                  <span className="font-mono font-bold text-slate-900">{configForm.vulnerableWait} min</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Elderly or disabled visitors waiting beyond this are elevated to HIGH priority.
                </p>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={configForm.vulnerableWait}
                  onChange={e => setConfigForm({ ...configForm, vulnerableWait: Number(e.target.value) })}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>

              {/* Moderate Wait */}
              <div className="p-3 rounded border border-slate-200 space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-800">Moderate Wait</label>
                  <span className="font-mono font-bold text-slate-900">{configForm.moderateWait} min</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Base threshold qualifying visitors for MEDIUM priority progression.
                </p>
                <input
                  type="range"
                  min="5"
                  max="45"
                  step="5"
                  value={configForm.moderateWait}
                  onChange={e => setConfigForm({ ...configForm, moderateWait: Number(e.target.value) })}
                  className="w-full accent-slate-900 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setConfigForm({ criticalWait: 60, longWait: 30, vulnerableWait: 20, moderateWait: 15 })}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium"
              >
                Reset Defaults
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-2xs transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Parameters'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
