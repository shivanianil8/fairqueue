import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Scale, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Users
} from 'lucide-react';
import { PriorityBadge, UrgencyBadge, AppointmentBadge, SpecialBadge } from '../components/Badges.jsx';

export default function DecisionDetailsPage({ 
  people = [], 
  latestAnalysis, 
  initialPersonId,
  onComparePair,
  onNavigate 
}) {
  const rankedQueue = latestAnalysis?.rankedQueue || [];
  
  // Active selected person for inspection
  const [selectedId, setSelectedId] = useState(initialPersonId || (rankedQueue[0]?.personId || people[0]?.personId || ''));

  // Update selectedId if initialPersonId changes
  useEffect(() => {
    if (initialPersonId) {
      setSelectedId(initialPersonId);
    }
  }, [initialPersonId]);

  // Pairwise Comparison State
  const [compareIdA, setCompareIdA] = useState(rankedQueue[0]?.personId || people[0]?.personId || '');
  const [compareIdB, setCompareIdB] = useState(rankedQueue[1]?.personId || people[1]?.personId || '');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Find evaluated person details from rankedQueue or fallback to people list
  const currentAnalyzed = rankedQueue.find(p => p.personId === selectedId);
  const rawPerson = people.find(p => p.personId === selectedId);

  async function handleRunComparison() {
    if (!compareIdA || !compareIdB) return;
    if (compareIdA === compareIdB) {
      alert('Please select two distinct people to compare.');
      return;
    }

    setIsComparing(true);
    try {
      const res = await onComparePair(compareIdA, compareIdB);
      setComparisonResult(res.data);
    } catch (err) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <span>Decision Explainability & Logic Trace</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Detailed transparency for every queue placement. Inspect the specific Horn clauses, facts, and tie-breakers that determined priority.
        </p>
      </div>

      {people.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No queue data available</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Please add people or load sample demo data to view decision proofs.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Person Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 h-fit">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Queue Member to Inspect
            </label>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {people.map((p) => {
                const isSelected = p.personId === selectedId;
                const evaluated = rankedQueue.find(r => r.personId === p.personId);
                return (
                  <button
                    key={p.personId}
                    onClick={() => setSelectedId(p.personId)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{p.name}</span>
                      <span className="font-mono text-xs text-slate-400">{p.personId}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">{p.waitingTime}m wait</span>
                      <PriorityBadge priority={evaluated?.priority || p.priority} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center/Right Column: Detailed Proof */}
          <div className="lg:col-span-2 space-y-6">
            {rawPerson ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                {/* Person Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-2xl font-black text-slate-900">{rawPerson.name}</h2>
                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                        {rawPerson.personId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Arrival: <strong className="text-slate-600">{rawPerson.arrivalTime || '09:00'}</strong> &bull; Waited: <strong className="text-slate-600">{rawPerson.waitingTime} min</strong>
                    </p>
                  </div>

                  <div>
                    <PriorityBadge priority={currentAnalyzed?.priority || rawPerson.priority} size="lg" />
                  </div>
                </div>

                {/* Facts Summary */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Asserted Fact Attributes (person/7)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Waiting Time</span>
                      <span className="font-bold text-slate-800 text-sm">{rawPerson.waitingTime} min</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Urgency</span>
                      <UrgencyBadge urgency={rawPerson.urgency} />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Appointment</span>
                      <AppointmentBadge status={rawPerson.appointmentStatus} />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block mb-1">Special Req</span>
                      <SpecialBadge special={rawPerson.specialRequirement} />
                    </div>
                  </div>
                </div>

                {/* Synthesis Explanation */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Deductive Synthesis Explanation</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed italic">
                    "{currentAnalyzed?.explanation || rawPerson.lastExplanation || 'Run Prolog analysis to generate formal synthesis explanation.'}"
                  </p>
                </div>

                {/* Fired Rules Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                    <span>Fired Logical Rules ({currentAnalyzed?.rules?.length || 0})</span>
                    <span className="text-[11px] font-mono lowercase text-blue-600">rule_applies/5</span>
                  </h3>

                  {currentAnalyzed?.rules && currentAnalyzed.rules.length > 0 ? (
                    <div className="space-y-2.5">
                      {currentAnalyzed.rules.map((rule, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                              {rule.code}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              rule.tier === 'high' ? 'bg-rose-100 text-rose-800' : rule.tier === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              Tier: {rule.tier}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-800">{rule.summary}</div>
                          <p className="text-xs text-slate-500 leading-normal">{rule.explanation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No rule details recorded yet. Click <strong className="text-slate-600">Analyze Queue</strong> to evaluate rules.
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* PAIRWISE COMPARISON TOOL ("Why Person A before Person B?") */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Scale className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pairwise Comparison Tool</h3>
                  <p className="text-xs text-slate-500">
                    Query Prolog predicate: <code className="font-mono text-slate-700">compare_pair(IdA, IdB, Winner, Loser, Reason)</code>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Person A Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Person (A)</label>
                  <select
                    value={compareIdA}
                    onChange={e => setCompareIdA(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {people.map(p => (
                      <option key={p.personId} value={p.personId}>
                        {p.name} ({p.personId}) — {p.priority}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Person B Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Second Person (B)</label>
                  <select
                    value={compareIdB}
                    onChange={e => setCompareIdB(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-100 bg-white"
                  >
                    {people.map(p => (
                      <option key={p.personId} value={p.personId}>
                        {p.name} ({p.personId}) — {p.priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunComparison}
                disabled={isComparing || compareIdA === compareIdB}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Scale className="w-4 h-4" />
                <span>{isComparing ? 'Evaluating Precedence...' : 'Explain Precedence (Why A before B?)'}</span>
              </button>

              {comparisonResult && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 animate-fadeIn space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span>Precedence Deduction Result</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      Winner: {comparisonResult.winnerId}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-semibold leading-relaxed">
                    "{comparisonResult.reason}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
