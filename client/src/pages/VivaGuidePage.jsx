import React from 'react';
import { GraduationCap, CheckCircle2, Terminal, BookOpen, Layers, HelpCircle } from 'lucide-react';

export default function VivaGuidePage() {
  const vivaTopics = [
    {
      q: 'Why Logic Programming (Prolog) instead of procedural scoring logic?',
      a: `In traditional imperative systems, queue priority is calculated using arbitrary numeric formulas (e.g. priority = urgency*5 + wait*2). This produces opaque, "black-box" decisions that cannot be mathematically audited and frequently cause low-urgency visitors to wait indefinitely (starvation).
      In FAIRQUEUE, business rules are written as declarative Horn clauses in fairqueue.pl. Knowledge is separated from Execution: the Prolog engine executes SLD resolution, checks explicit conditions (e.g. starvation thresholds), and produces formal deductive proofs for why Person A precedes Person B.`,
      tag: 'Declarative vs. Imperative Paradigm',
    },
    {
      q: 'Explain the difference between Facts and Rules in fairqueue.pl.',
      a: `FACTS represent unconditional assertions of truth:
      person('P001', 'Anjana AS', 68, high, scheduled, elderly, '09:12').
      threshold(critical_wait, 60).
      
      RULES (Horn Clauses) represent conditional deduction:
      rule_applies(Id, critical_wait_priority, high, Summary, Expl) :-
          person(Id, _, Wait, _, _, _, _),
          threshold(critical_wait, T),
          Wait >= T.
      The rule fires if and only if all subgoals in its body are satisfied.`,
      tag: 'Facts & Horn Clauses',
    },
    {
      q: 'What is Unification and how does it happen in this application?',
      a: `Unification is Prolog's bidirectional pattern matching mechanism. When evaluating a query like evaluate_person('P001', Result), Prolog searches for matching facts and unifies variables (capitalized like Id, Wait, Spec) with asserted values ('P001', 68, elderly). If a rule body requires Spec == elderly, the bound variable satisfies the condition.`,
      tag: 'Pattern Unification',
    },
    {
      q: 'How does FAIRQUEUE solve the queue starvation problem?',
      a: `Queue starvation occurs when low-urgency visitors are repeatedly overtaken by incoming high-urgency patients. 
      FAIRQUEUE prevents starvation using rule_applies(Id, critical_wait_priority, high, ...) :- Wait >= 60. As soon as any person's waiting time crosses the critical threshold (60 min), Prolog automatically elevates them to HIGH priority regardless of baseline urgency, mathematically guaranteeing an upper bound on wait times.`,
      tag: 'Starvation Prevention & Fairness',
    },
    {
      q: 'What role does the Cut (!) operator play in deduce_priority/2?',
      a: `The cut operator (!) prunes the SLD search tree. In deduce_priority, once a candidate satisfies a high-priority rule, the cut (!) immediately commits to the 'high' priority tier and prevents unnecessary backtracking into medium or normal clauses, ensuring deterministic and efficient evaluation.`,
      tag: 'Cut Operator & Search Pruning',
    },
    {
      q: 'How does deterministic tie-breaking work in precedes/3?',
      a: `If two individuals share the same priority tier, precedes/3 checks who has waited longer (longer wait breaks the tie). If wait times are equal, it compares arrival times (FIFO fairness). If arrival times are identical, alphanumeric ID breaks the tie, ensuring 100% reproducible ordering.`,
      tag: 'Deterministic Precedence',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Academic Viva & Logic Programming Guide</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Core concepts, theoretical justifications, and examiner questions for the Programming Paradigms course.
        </p>
      </div>

      {/* Core Concepts Grid */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Key Programming Paradigm Concepts Demonstrated
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          {[
            'Declarative Knowledge Representation',
            'First-Order Predicates & Arity',
            'Horn Clause Deduction (Head :- Body)',
            'Pattern Unification (X = Y)',
            'SLD Resolution (Backward Chaining)',
            'Cut (!) Search Space Pruning',
            'Queue Starvation Prevention Rules',
            'Explainable AI (Deductive Proofs)',
            'Separation of Knowledge & Execution',
          ].map((item, idx) => (
            <div key={idx} className="flex items-center space-x-1.5 p-2 rounded bg-slate-50 border border-slate-100 font-medium text-slate-800">
              <span className="text-emerald-600 font-bold text-xs">✓</span>
              <span className="text-[11px]">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Q&A Cards */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Anticipated Viva Questions & Comprehensive Answers
        </div>

        {vivaTopics.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold text-slate-400 uppercase">Q{idx + 1}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {item.tag}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">{item.q}</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded border border-slate-100 font-sans">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
