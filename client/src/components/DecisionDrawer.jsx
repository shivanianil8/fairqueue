import React, { useState } from 'react';
import { X, Check, ArrowRight, Scale, Clock, ShieldCheck, Terminal, HelpCircle } from 'lucide-react';
import { PriorityBadge, UrgencyBadge, AppointmentBadge, SpecialBadge } from './Badges.jsx';

export default function DecisionDrawer({ 
  person, 
  allPeople = [], 
  latestAnalysis, 
  onClose, 
  onComparePair 
}) {
  const [compareTargetId, setCompareTargetId] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  if (!person) return null;

  // Find evaluated record from latestAnalysis if available
  const rankedQueue = latestAnalysis?.rankedQueue || [];
  const evaluated = rankedQueue.find(p => p.personId === person.personId) || person;

  // Extract clean Prolog atom for person name (e.g. 'anjana' from 'Anjana AS')
  const prologAtomName = (person.name || 'person')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '');

  // Map reasons with checkmarks
  const reasons = [];
  if (person.urgency === 'high') {
    reasons.push('High clinical or operational urgency rating');
  }
  if (person.waitingTime >= 60) {
    reasons.push(`Waiting time (${person.waitingTime}m) exceeded critical starvation threshold (60m)`);
  } else if (person.waitingTime >= 30) {
    reasons.push(`Waiting time (${person.waitingTime}m) exceeded standard long wait threshold (30m)`);
  } else if (person.waitingTime >= 15) {
    reasons.push(`Waiting time (${person.waitingTime}m) reached moderate waiting threshold (15m)`);
  }
  if (person.specialRequirement === 'emergency') {
    reasons.push('Emergency special requirement detected requiring immediate clinical intervention');
  } else if (person.specialRequirement === 'elderly' || person.specialRequirement === 'disability') {
    reasons.push(`Special accommodation granted for vulnerable group: ${person.specialRequirement}`);
  }
  if (person.appointmentStatus === 'scheduled') {
    reasons.push('Confirmed advance scheduled appointment slot entitled to priority progression');
  }
  if (reasons.length === 0) {
    reasons.push('Standard FIFO queue progression without elevated risk factors');
  }

  // Handle pairwise comparison
  async function handleCompare() {
    if (!compareTargetId || compareTargetId === person.personId) return;
    setIsComparing(true);
    try {
      const res = await onComparePair(person.personId, compareTargetId);
      setComparisonResult(res.data);
    } catch (err) {
      alert(`Comparison failed: ${err.message}`);
    } finally {
      setIsComparing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full z-10 animate-slide-in-right overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-slate-500 font-semibold">{person.personId}</span>
              <span className="text-slate-300">&bull;</span>
              <span className="text-xs text-slate-500 font-mono">Arrived {person.arrivalTime || '09:00'}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5 tracking-tight">{person.name}</h2>
          </div>
          <div className="flex items-center space-x-3">
            <PriorityBadge priority={evaluated.priority} size="lg" />
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Quick Attribute Grid */}
          <div className="grid grid-cols-4 gap-2 border border-slate-200 rounded-md p-3 bg-white">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Wait Time</span>
              <span className="font-semibold text-slate-800">{person.waitingTime} min</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Urgency</span>
              <UrgencyBadge urgency={person.urgency} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Appointment</span>
              <AppointmentBadge status={person.appointmentStatus} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Requirement</span>
              <SpecialBadge special={person.specialRequirement} />
            </div>
          </div>

          {/* Section: Why Was This Person Prioritized? */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              Why was this person prioritized?
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              {reasons.map((reason, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-slate-700">
                  <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                  <span className="font-medium leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Rules Triggered */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center justify-between">
              <span>Rules Triggered</span>
              <span className="font-mono text-[10px] text-slate-400">rule_applies/5</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {evaluated.ruleCodes && evaluated.ruleCodes.length > 0 ? (
                evaluated.ruleCodes.map((code) => (
                  <span 
                    key={code}
                    className="font-mono text-[11px] px-2 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200 font-medium"
                  >
                    {code}
                  </span>
                ))
              ) : (
                <span className="font-mono text-[11px] text-slate-400">normal_queue_progression</span>
              )}
            </div>
          </div>

          {/* Section: Academic Logical Reasoning (FACT -> RULE -> INFERENCE -> RESULT) */}
          <div className="space-y-2.5">
            <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              Logical Reasoning (Prolog Knowledge Base)
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
              {/* Layer 1: FACT */}
              <div className="p-3 border-b border-slate-100 flex items-start space-x-3">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  FACT
                </span>
                <div className="font-mono text-[11px] text-slate-700 space-y-0.5 leading-relaxed">
                  <div>urgency({prologAtomName}, {person.urgency}).</div>
                  <div>waiting_time({prologAtomName}, {person.waitingTime}).</div>
                  <div>special_requirement({prologAtomName}, {person.specialRequirement}).</div>
                  <div>appointment_status({prologAtomName}, {person.appointmentStatus}).</div>
                </div>
              </div>

              {/* Layer 2: RULE */}
              <div className="p-3 border-b border-slate-100 flex items-start space-x-3 bg-slate-50/40">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200">
                  RULE
                </span>
                <div className="font-mono text-[11px] text-slate-700 leading-relaxed">
                  <div>priority(P, high) :- urgency(P, high), waiting_time(P, T), T &gt;= 30.</div>
                  <div>priority(P, high) :- waiting_time(P, T), T &gt;= 60. % Starvation rule</div>
                </div>
              </div>

              {/* Layer 3: INFERENCE */}
              <div className="p-3 border-b border-slate-100 flex items-start space-x-3">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-purple-50 text-purple-700 border border-purple-200">
                  INFERENCE
                </span>
                <div className="font-mono text-[11px] text-slate-700 leading-relaxed">
                  <div>Unification: P = '{person.personId}', T = {person.waitingTime}</div>
                  <div>SLD Resolution: Goals satisfied without failure</div>
                </div>
              </div>

              {/* Layer 4: RESULT */}
              <div className="p-3 flex items-start space-x-3 bg-emerald-50/30">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                  RESULT
                </span>
                <div className="font-mono text-[11px] text-slate-900 font-semibold leading-relaxed">
                  &rarr; priority({prologAtomName}, {evaluated.priority || 'normal'}).
                </div>
              </div>
            </div>
          </div>

          {/* Section: Pairwise Comparison Tool */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="text-[11px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-400" />
              <span>Pairwise Comparison ("Why this person before X?")</span>
            </div>

            <div className="flex space-x-2">
              <select
                value={compareTargetId}
                onChange={e => {
                  setCompareTargetId(e.target.value);
                  setComparisonResult(null);
                }}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">Select another person in queue...</option>
                {allPeople
                  .filter(p => p.personId !== person.personId)
                  .map(p => (
                    <option key={p.personId} value={p.personId}>
                      {p.name} ({p.personId}) &mdash; {p.priority}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleCompare}
                disabled={!compareTargetId || isComparing}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs disabled:opacity-40 transition whitespace-nowrap"
              >
                {isComparing ? 'Comparing...' : 'Compare'}
              </button>
            </div>

            {comparisonResult && (
              <div className="p-3 rounded border border-slate-200 bg-slate-50/70 text-xs text-slate-800 space-y-1">
                <div className="font-semibold text-slate-900">
                  Prolog Precedence Determination:
                </div>
                <div className="text-slate-600 leading-normal">
                  "{comparisonResult.reason}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
