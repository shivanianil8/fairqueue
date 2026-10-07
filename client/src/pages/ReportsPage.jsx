import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Clock, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Calendar,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import { api } from '../services/api.js';

export default function ReportsPage({ selectedQueueId = 'all' }) {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today');

  useEffect(() => {
    fetchReport();
  }, [selectedQueueId, timeRange]);

  async function fetchReport() {
    setIsLoading(true);
    try {
      const q = selectedQueueId === 'all' ? null : selectedQueueId;
      const res = await api.getOperationalReport(q, timeRange);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to load operational report:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const metrics = reportData?.metrics || {
    totalRegistered: 0,
    totalWaiting: 0,
    totalInService: 0,
    totalCompleted: 0,
    totalOverrides: 0,
    averageWaitMinutes: 0,
    longestWaitMinutes: 0,
    waitBeyondCriticalThreshold: 0,
    averageServiceMinutes: 12,
  };

  const priorityDist = reportData?.priorityDistribution || { high: 0, medium: 0, normal: 0 };
  const totalAnalyzed = (priorityDist.high || 0) + (priorityDist.medium || 0) + (priorityDist.normal || 0);

  const ruleUsage = reportData?.ruleUsageDistribution || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operational Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Throughput telemetry, wait duration distributions, starvation prevention metrics, and rule firing frequencies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded px-2.5 py-1.5 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="today">Today's Shift (Live)</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Queue Intake</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">{metrics.totalRegistered}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1.5">
            <span className="text-amber-600 font-medium">{metrics.totalWaiting} waiting</span>
            <span>•</span>
            <span className="text-blue-600 font-medium">{metrics.totalInService} in service</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Avg Waiting Time</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.averageWaitMinutes} <span className="text-xs font-normal text-slate-500">mins</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Peak wait in queue: <span className="font-semibold text-slate-800">{metrics.longestWaitMinutes}m</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Starvation Prevention</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.waitBeyondCriticalThreshold}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Wait &gt; 60m threshold (clause 3)
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Manual Overrides</span>
            <ShieldAlert className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.totalOverrides}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {metrics.totalRegistered > 0
              ? `${Math.round((metrics.totalOverrides / metrics.totalRegistered) * 100)}% of intake audited`
              : '0% override rate'}
          </div>
        </div>
      </div>

      {/* Two Column Section: Priority Breakdown & Rule Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Priority Assignment Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Prolog Priority Distribution</h2>
              <p className="text-[11px] text-slate-500">Breakdown of deductive priority classifications assigned by logic rules</p>
            </div>
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {[
              { label: 'High Priority', count: priorityDist.high || 0, color: 'bg-rose-500', text: 'text-rose-700', bgLight: 'bg-rose-50' },
              { label: 'Medium Priority', count: priorityDist.medium || 0, color: 'bg-amber-500', text: 'text-amber-700', bgLight: 'bg-amber-50' },
              { label: 'Normal Priority', count: priorityDist.normal || 0, color: 'bg-blue-500', text: 'text-blue-700', bgLight: 'bg-blue-50' },
            ].map((item) => {
              const pct = totalAnalyzed > 0 ? Math.round((item.count / totalAnalyzed) * 100) : 0;
              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-mono text-slate-500">{item.count} visitors ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
            Total active cohort analyzed: <span className="font-mono font-medium text-slate-700">{totalAnalyzed}</span> individuals.
          </div>
        </div>

        {/* Logic Rule Utilization */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">Horn Clause Rule Firing Frequency</h2>
              <p className="text-[11px] text-slate-500">Distribution of which Prolog rules fired during queue evaluations</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {Object.keys(ruleUsage).length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No rule execution data recorded for current cohort.
              </div>
            ) : (
              Object.entries(ruleUsage)
                .sort((a, b) => b[1] - a[1])
                .map(([ruleCode, count]) => (
                  <div key={ruleCode} className="flex items-center justify-between p-2 rounded bg-slate-50/70 border border-slate-100 text-xs">
                    <span className="font-mono text-[11px] text-slate-800">{ruleCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 font-mono">
                      {count} {count === 1 ? 'trigger' : 'triggers'}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Mandatory Real-World Fairness Disclaimer */}
      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/90 flex items-start space-x-3 text-slate-600 text-xs leading-relaxed">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Operational Fairness Disclaimer:</span> {reportData?.disclaimer || 'These metrics describe empirical queue behaviour; they do not constitute a universal mathematical fairness guarantee. Queue fairness in FAIRQUEUE is defined strictly as adherence to the active organization\'s published declarative policy and verified Horn clause evaluation.'}
        </div>
      </div>
    </div>
  );
}
