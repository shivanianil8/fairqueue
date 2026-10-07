import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Terminal, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Scale, 
  Cpu, 
  Layers, 
  FileText, 
  ChevronRight,
  Activity,
  Check
} from 'lucide-react';
import { PriorityBadge, UrgencyBadge, AppointmentBadge, SpecialBadge, PositionIndicator } from '../components/Badges.jsx';

export default function AnalyzePage({
  people = [],
  latestAnalysis,
  onAnalyze,
  isAnalyzing,
  onSelectPersonForProof,
  systemStatus
}) {
  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'facts' | 'pipeline'
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);

  const evaluationSteps = [
    'Collecting queue facts...',
    'Evaluating logical rules...',
    'Resolving priority tiers...',
    'Applying tie-breakers...',
    'Generating explanations...',
  ];

  // Animate realistic progress steps when isAnalyzing is true
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      setAnalysisStepIndex(0);
      interval = setInterval(() => {
        setAnalysisStepIndex((prev) => (prev < evaluationSteps.length - 1 ? prev + 1 : prev));
      }, 350);
    } else {
      setAnalysisStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const rankedQueue = latestAnalysis?.rankedQueue || [];
  const engineName = systemStatus?.prologEngine?.swiplAvailable
    ? 'SWI-Prolog (Native)'
    : 'Tau-Prolog (ISO)';

  const factsCode = latestAnalysis?.prologFactsUsed || '% Run "Analyze Queue" to inspect generated dynamic facts.';

  return (
    <div className="space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Queue Analysis</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Run the Prolog rule engine against the current queue to deduce fair priority rankings.
          </p>
        </div>

        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || people.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 text-blue-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? evaluationSteps[analysisStepIndex] : 'Run Analysis'}</span>
        </button>
      </div>

      {/* Three-Step Horizontal Visual Pipeline */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Step 1: Queue Data */}
          <div className="p-3 rounded border border-slate-200/90 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-400">01</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Input</span>
            </div>
            <div className="font-bold text-xs text-slate-900">QUEUE DATA</div>
            <p className="text-[11px] text-slate-500">
              {people.length} active visitor facts collected (<code className="font-mono text-[10px]">person/7</code>).
            </p>
          </div>

          {/* Step 2: Logical Rule Evaluation */}
          <div className="p-3 rounded border border-slate-200/90 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-400">02</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Inference</span>
            </div>
            <div className="font-bold text-xs text-slate-900">LOGICAL RULE EVALUATION</div>
            <p className="text-[11px] text-slate-500">
              12 Horn clauses resolved in {engineName} engine.
            </p>
          </div>

          {/* Step 3: Recommended Order */}
          <div className="p-3 rounded border border-slate-200/90 bg-slate-50/50 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-slate-400">03</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">Output</span>
            </div>
            <div className="font-bold text-xs text-slate-900">RECOMMENDED ORDER</div>
            <p className="text-[11px] text-slate-500">
              {rankedQueue.length > 0 ? `${rankedQueue.length} prioritized positions generated.` : 'Awaiting analysis run.'}
            </p>
          </div>
        </div>

        {/* Realistic Progress Status Banner when analyzing */}
        {isAnalyzing && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs text-blue-700 animate-pulse font-mono">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>Prolog Resolution in Progress: {evaluationSteps[analysisStepIndex]}</span>
          </div>
        )}
      </div>

      {/* Analysis Complete Status Card */}
      {latestAnalysis && (
        <div className="bg-white p-3.5 rounded-md border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <span className="font-bold text-slate-900">ANALYSIS COMPLETE</span>
              <span className="text-slate-400 text-[11px] ml-2 font-mono">
                {new Date(latestAnalysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6 text-slate-600 font-mono text-[11px]">
            <span><strong>{latestAnalysis.totalPeople}</strong> people analyzed</span>
            <span>&bull;</span>
            <span><strong>12</strong> rules evaluated</span>
            <span>&bull;</span>
            <span><strong>{latestAnalysis.totalPeople}</strong> decisions generated</span>
            <span>&bull;</span>
            <span className="text-slate-500">{latestAnalysis.executionTimeMs || 4} ms</span>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs pb-1">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-3 py-1.5 rounded-t font-medium transition ${
            activeTab === 'results'
              ? 'border-b-2 border-slate-900 text-slate-900 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Recommended Priority Order ({rankedQueue.length})
        </button>

        <button
          onClick={() => setActiveTab('facts')}
          className={`px-3 py-1.5 rounded-t font-medium transition ${
            activeTab === 'facts'
              ? 'border-b-2 border-slate-900 text-slate-900 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Prolog Fact Inspector
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-3 py-1.5 rounded-t font-medium transition ${
            activeTab === 'pipeline'
              ? 'border-b-2 border-slate-900 text-slate-900 font-semibold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Logic Pipeline Diagram
        </button>
      </div>

      {/* TAB 1: RECOMMENDED ORDER RESULTS TABLE */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
          {rankedQueue.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-800">Queue not yet evaluated</p>
              <p className="text-slate-400">Click "Run Analysis" to execute Prolog reasoning on current members.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-14">POS</th>
                  <th className="py-2.5 px-3">PERSON</th>
                  <th className="py-2.5 px-3">WAIT TIME</th>
                  <th className="py-2.5 px-3">PRIORITY</th>
                  <th className="py-2.5 px-3">EXPLANATION</th>
                  <th className="py-2.5 px-3">RULES TRIGGERED</th>
                  <th className="py-2.5 px-3 text-right">PROOF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankedQueue.map((item, idx) => (
                  <tr
                    key={item.personId}
                    onClick={() => onSelectPersonForProof(item)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <PositionIndicator position={item.rank || idx + 1} priority={item.priority} />
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                        {item.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{item.personId}</div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-700">
                      {item.waitingTime} min
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                      {item.explanation}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                      {item.ruleCodes?.join(', ')}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPersonForProof(item);
                        }}
                        className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded border border-slate-200 hover:bg-white"
                      >
                        Proof
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 2: PROLOG FACT INSPECTOR */}
      {activeTab === 'facts' && (
        <div className="bg-slate-900 text-slate-200 rounded-md p-4 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px]">
            <span className="text-slate-400">Dynamic Prolog Fact Consulted at Runtime</span>
            <span className="text-slate-500">logic/fairqueue.pl</span>
          </div>

          <pre className="text-emerald-400 overflow-x-auto leading-relaxed text-[11px] py-1">
            {factsCode}
          </pre>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Query Goal: <code className="text-blue-300">?- rank_all_people(RankedList).</code></span>
            <span>Unification: Deterministic</span>
          </div>
        </div>
      )}

      {/* TAB 3: LOGIC PIPELINE DIAGRAM */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-md border border-slate-200 p-6 shadow-2xs space-y-6 text-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Logic Pipeline Architecture</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The complete seven-stage deductive lifecycle in FAIRQUEUE.
            </p>
          </div>

          {/* 7-Step Pipeline Diagram */}
          <div className="flex flex-col space-y-2">
            {[
              { num: '01', title: 'QUEUE FACTS', desc: 'Raw records: name, waiting time, urgency, appointment status, special requirements, arrival time.' },
              { num: '02', title: 'FACT NORMALIZATION', desc: 'Node.js compiles records into relational first-order Prolog predicates: person(Id, Name, Wait, Urg, Appt, Spec, Arr).' },
              { num: '03', title: 'PROLOG RULE ENGINE', desc: 'Consults knowledge base (fairqueue.pl) containing 12 explicit Horn clauses and dynamic threshold facts.' },
              { num: '04', title: 'LOGICAL INFERENCE', desc: 'Pattern unification binds variables; SLD resolution proves rule_applies/5 subgoals.' },
              { num: '05', title: 'PRIORITY RESOLUTION', desc: 'Precedence tiers deduced (high > medium > normal) using cut (!) search space pruning.' },
              { num: '06', title: 'EXPLANATION GENERATION', desc: 'Synthesizes natural-language proofs and captures all fired Horn clauses for full auditability.' },
              { num: '07', title: 'RECOMMENDED QUEUE', desc: 'Deterministic sorting with precedes/3 resolves wait-time tie-breaking and starvation prevention.' },
            ].map((step, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-2.5 rounded border border-slate-100 bg-slate-50/50">
                <span className="font-mono font-bold text-[11px] text-slate-400 w-6">{step.num}</span>
                <span className="font-bold text-slate-900 w-44 whitespace-nowrap">{step.title}</span>
                <span className="text-slate-300">&rarr;</span>
                <span className="text-slate-600 flex-1">{step.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
