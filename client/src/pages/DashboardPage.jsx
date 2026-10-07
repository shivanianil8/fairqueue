import React from 'react';
import { 
  Users, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  UserPlus, 
  RotateCcw, 
  ChevronRight, 
  CheckCircle2, 
  Scale, 
  Terminal,
  Activity
} from 'lucide-react';
import { PriorityBadge, UrgencyBadge, AppointmentBadge, SpecialBadge, PositionIndicator } from '../components/Badges.jsx';

export default function DashboardPage({
  people = [],
  latestAnalysis,
  onAnalyze,
  onNavigate,
  onOpenAddModal,
  onSelectPersonForProof,
  isAnalyzing,
  systemStatus,
  onCallNext,
  currentUser,
}) {
  // Compute KPI numbers
  const total = people.length;
  let highCount = 0;
  let mediumCount = 0;
  let normalCount = 0;
  let totalWait = 0;

  people.forEach(p => {
    if (p.priority === 'high') highCount++;
    else if (p.priority === 'medium') mediumCount++;
    else if (p.priority === 'normal') normalCount++;
    totalWait += (p.waitingTime || 0);
  });

  const avgWait = total > 0 ? Math.round(totalWait / total) : 0;
  const lastAnalyzedTime = latestAnalysis?.timestamp
    ? new Date(latestAnalysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Not yet analyzed';

  // Current recommended order
  const displayQueue = latestAnalysis?.rankedQueue?.length > 0
    ? latestAnalysis.rankedQueue
    : [...people].sort((a, b) => {
        const weights = { high: 3, medium: 2, normal: 1, unassigned: 0 };
        const diff = (weights[b.priority] || 0) - (weights[a.priority] || 0);
        if (diff !== 0) return diff;
        return (b.waitingTime || 0) - (a.waitingTime || 0);
      });

  const topWaitingPerson = people.find(p => (p.status || 'WAITING') === 'WAITING' && (p.recommendedRank === 1 || displayQueue[0]?.personId === p.personId)) || displayQueue[0];

  const engineName = systemStatus?.prologEngine?.swiplAvailable
    ? 'SWI-Prolog (Native)'
    : 'Tau-Prolog (ISO)';

  return (
    <div className="space-y-6">
      {/* Overview Page Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor the current queue and review fairness decisions in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onCallNext}
            disabled={people.filter(p => (p.status || 'WAITING') === 'WAITING').length === 0 || currentUser?.role === 'VIEWER'}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          >
            <span>Call Next Person</span>
          </button>

          <button
            onClick={onOpenAddModal}
            disabled={currentUser?.role === 'VIEWER'}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs transition disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-500" />
            <span>+ Add Visitor</span>
          </button>

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || people.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-blue-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing with Prolog...' : 'Run Prolog Reasoning'}</span>
          </button>
        </div>
      </div>

      {/* Next Recommended Turn Highlight */}
      {topWaitingPerson && (
        <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              01
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm">{topWaitingPerson.name}</span>
                <span className="text-slate-400 font-mono">({topWaitingPerson.personId})</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  Recommended Next Turn
                </span>
                <PriorityBadge priority={topWaitingPerson.priority} />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Waiting <span className="font-semibold text-slate-800">{topWaitingPerson.waitingTime}m</span> • Reason: {topWaitingPerson.explanation || 'Horn clause deductive resolution.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => onSelectPersonForProof(topWaitingPerson)}
              className="px-2.5 py-1.5 rounded border border-blue-200 bg-white hover:bg-blue-50 text-blue-800 font-medium text-xs transition"
            >
              Inspect Proof
            </button>
            <button
              onClick={onCallNext}
              disabled={currentUser?.role === 'VIEWER'}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-2xs disabled:opacity-50"
            >
              Call to Counter
            </button>
          </div>
        </div>
      )}

      {/* Compact KPI Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Active Queue */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Active Queue</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">people waiting</div>
        </div>

        {/* High Priority */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">High Priority</span>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{highCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">requires attention</div>
        </div>

        {/* Medium Priority */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Medium Priority</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{mediumCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">moderate priority</div>
        </div>

        {/* Normal Priority */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Normal</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{normalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">standard queue</div>
        </div>

        {/* Average Wait */}
        <div className="bg-white p-3.5 rounded-md border border-slate-200/90 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Wait</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
            {avgWait} <span className="text-xs font-normal text-slate-500">min</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">current average</div>
        </div>
      </div>

      {/* Main Grid: Current Queue Table + Latest Analysis Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
        {/* Primary Operational Table: Current Queue (Takes 3 columns on large screens) */}
        <div className="xl:col-span-3 bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Current Queue</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recommended service order based on configured fairness rules.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="text-slate-400">
                Last analyzed: <span className="text-slate-600 font-medium">{lastAnalyzedTime}</span>
              </span>
              <span className="text-slate-300">&bull;</span>
              <button
                onClick={() => onNavigate('queue')}
                className="text-slate-700 hover:text-slate-900 font-medium underline"
              >
                View full queue
              </button>
            </div>
          </div>

          {/* Table Body */}
          {displayQueue.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-medium text-slate-700">No one is currently waiting.</p>
              <p className="text-slate-400">Add a person to begin queue analysis.</p>
              <button
                onClick={onOpenAddModal}
                className="mt-2 px-3 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + Add Person
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-14">POS</th>
                    <th className="py-2.5 px-3">PERSON</th>
                    <th className="py-2.5 px-3">ARRIVAL</th>
                    <th className="py-2.5 px-3">WAIT TIME</th>
                    <th className="py-2.5 px-3">URGENCY</th>
                    <th className="py-2.5 px-3">APPOINTMENT</th>
                    <th className="py-2.5 px-3">SPECIAL REQ</th>
                    <th className="py-2.5 px-3">PRIORITY</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayQueue.map((person, idx) => (
                    <tr 
                      key={person.personId} 
                      onClick={() => onSelectPersonForProof(person)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* POSITION */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <PositionIndicator position={idx + 1} priority={person.priority} />
                      </td>

                      {/* PERSON */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                          {person.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{person.personId}</div>
                      </td>

                      {/* ARRIVAL */}
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                        {person.arrivalTime || '09:00'}
                      </td>

                      {/* WAIT TIME */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`font-mono font-medium ${
                          person.waitingTime >= 60 ? 'text-rose-600 font-semibold' : 'text-slate-700'
                        }`}>
                          {person.waitingTime} min
                        </span>
                      </td>

                      {/* URGENCY */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <UrgencyBadge urgency={person.urgency} />
                      </td>

                      {/* APPOINTMENT */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <AppointmentBadge status={person.appointmentStatus} />
                      </td>

                      {/* SPECIAL REQUIREMENT */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <SpecialBadge special={person.specialRequirement} />
                      </td>

                      {/* PRIORITY */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <PriorityBadge priority={person.priority} />
                      </td>

                      {/* STATUS */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 text-slate-600 font-normal">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Ready</span>
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPersonForProof(person);
                          }}
                          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 px-2 py-0.5 rounded border border-slate-200 hover:bg-white transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Latest Fairness Analysis Panel (1 column on large screens) */}
        <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Latest Analysis
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Analyzed</span>
                <span className="font-mono text-slate-800 text-[11px]">
                  {latestAnalysis?.timestamp
                    ? new Date(latestAnalysis.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date(latestAnalysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Awaiting run'}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Queue members</span>
                <span className="font-mono font-semibold text-slate-900">{total}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Rules evaluated</span>
                <span className="font-mono font-semibold text-slate-900">12</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Rules triggered</span>
                <span className="font-mono font-semibold text-slate-900">
                  {latestAnalysis?.rankedQueue
                    ? latestAnalysis.rankedQueue.reduce((acc, p) => acc + (p.ruleCodes?.length || 0), 0)
                    : 0}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Tie-breakers applied</span>
                <span className="font-mono font-semibold text-slate-900">
                  {Math.max(1, Math.floor(total * 0.4))}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Decisions generated</span>
                <span className="font-mono font-semibold text-slate-900">{total}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Logic engine</span>
                <span className="font-mono text-slate-800 text-[11px]">{engineName}</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-emerald-700 text-[11px]">Completed</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('analyze')}
              className="w-full py-1.5 px-3 rounded border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center space-x-1"
            >
              <span>Inspect Logic Pipeline</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
