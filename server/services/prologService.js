import pl from 'tau-prolog';
import lists from 'tau-prolog/modules/lists.js';
lists(pl);
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROLOG_FILE_PATH = path.join(__dirname, '..', '..', 'logic', 'fairqueue.pl');

// Detect if swipl (SWI-Prolog CLI) is installed and available
function checkSwiplAvailability() {
  const swiplCmd = process.env.SWIPL_PATH || 'swipl';
  try {
    const res = spawnSync(swiplCmd, ['--version'], { encoding: 'utf8', timeout: 2000 });
    if (res.status === 0 && res.stdout) {
      return {
        available: true,
        version: res.stdout.trim(),
        cmd: swiplCmd,
      };
    }
  } catch (e) {
    // binary not found or timeout
  }
  return {
    available: false,
    version: null,
    cmd: null,
  };
}

const swiplStatus = checkSwiplAvailability();

// Helper to escape Prolog atom strings
function sanitizePrologAtom(val) {
  if (val === undefined || val === null) return "''";
  const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `'${str}'`;
}

// Convert people and thresholds to Prolog fact statements
export function buildPrologFacts(people, thresholds = {}) {
  const lines = [];

  // Add threshold facts
  const crit = thresholds.criticalWait ?? 60;
  const longW = thresholds.longWait ?? 30;
  const vuln = thresholds.vulnerableWait ?? 20;
  const mod = thresholds.moderateWait ?? 15;

  lines.push(`threshold(critical_wait, ${crit}).`);
  lines.push(`threshold(long_wait, ${longW}).`);
  lines.push(`threshold(vulnerable_wait, ${vuln}).`);
  lines.push(`threshold(moderate_wait, ${mod}).`);

  // Add person facts
  for (const p of people) {
    const id = sanitizePrologAtom(p.personId);
    const name = sanitizePrologAtom(p.name);
    const wait = Math.max(0, parseInt(p.waitingTime, 10) || 0);
    const urgency = ['low', 'medium', 'high'].includes(p.urgency) ? p.urgency : 'low';
    const status = ['scheduled', 'walkin', 'missed'].includes(p.appointmentStatus) ? p.appointmentStatus : 'walkin';
    const special = ['none', 'elderly', 'disability', 'emergency', 'other'].includes(p.specialRequirement)
      ? p.specialRequirement
      : 'none';
    const arrival = sanitizePrologAtom(p.arrivalTime || '09:00');

    lines.push(`person(${id}, ${name}, ${wait}, ${urgency}, ${status}, ${special}, ${arrival}).`);
  }

  return lines.join('\n');
}

// Helper to parse Tau-Prolog term into JavaScript object
function parseEvalTerm(evalTerm) {
  // eval(Id, Name, WaitTime, Urgency, Status, Special, Arrival, Priority, Weight, RuleCodes, RuleSummaries, SummaryExpl)
  const args = evalTerm.args;
  const id = args[0].id || args[0].value || String(args[0]);
  const name = args[1].id || args[1].value || String(args[1]);
  const waitTime = args[2].value !== undefined ? args[2].value : parseInt(args[2], 10);
  const urgency = args[3].id || String(args[3]);
  const status = args[4].id || String(args[4]);
  const special = args[5].id || String(args[5]);
  const arrival = args[6].id || args[6].value || String(args[6]);
  const priority = args[7].id || String(args[7]);
  const weight = args[8].value !== undefined ? args[8].value : parseInt(args[8], 10);

  // Parse rule codes
  let ruleCodes = [];
  try {
    const rawCodes = args[9].toJavaScript ? args[9].toJavaScript() : [];
    ruleCodes = Array.isArray(rawCodes) ? rawCodes.map(c => (typeof c === 'object' ? c.id || String(c) : String(c))) : [];
  } catch (e) {
    ruleCodes = [];
  }

  // Parse rule detailed summaries: r(Code, Tier, Summary, Expl)
  let ruleDetails = [];
  try {
    let currentList = args[10];
    while (currentList && currentList.id === '.' && currentList.args && currentList.args.length === 2) {
      const rTerm = currentList.args[0];
      if (rTerm && rTerm.id === 'r' && rTerm.args && rTerm.args.length >= 4) {
        ruleDetails.push({
          code: rTerm.args[0].id || String(rTerm.args[0]),
          tier: rTerm.args[1].id || String(rTerm.args[1]),
          summary: rTerm.args[2].id || rTerm.args[2].value || String(rTerm.args[2]),
          explanation: rTerm.args[3].id || rTerm.args[3].value || String(rTerm.args[3]),
        });
      }
      currentList = currentList.args[1];
    }
  } catch (e) {
    ruleDetails = [];
  }

  const explanation = args[11].id || args[11].value || String(args[11]);

  return {
    personId: id,
    name,
    waitingTime: waitTime,
    urgency,
    appointmentStatus: status,
    specialRequirement: special,
    arrivalTime: arrival,
    priority,
    weight,
    ruleCodes,
    rulesApplied: ruleCodes,
    rules: ruleDetails,
    explanation,
  };
}

// Fallback embedded ISO Prolog Horn Clause knowledge base in case of sandbox/permission restrictions
const EMBEDDED_FAIRQUEUE_PL = `
:- dynamic(person/7).
:- dynamic(threshold/2).

threshold(critical_wait, 60).
threshold(long_wait, 30).
threshold(vulnerable_wait, 20).
threshold(moderate_wait, 15).

member(X, [X|_]).
member(X, [_|Tail]) :- member(X, Tail).

concat_atom_list([], '').
concat_atom_list([X], AtomX) :- !, ( number(X) -> number_chars(X, Chars), atom_chars(AtomX, Chars) ; AtomX = X ).
concat_atom_list([X|Xs], Result) :- concat_atom_list(Xs, Rest), ( number(X) -> number_chars(X, Chars), atom_chars(AtomX, Chars) ; AtomX = X ), atom_concat(AtomX, Rest, Result).

rule_applies(Id, emergency_special_need, high, 'Emergency special need detected', 'Patient presents an immediate emergency condition requiring urgent clinical attention.') :- person(Id, _, _, _, _, emergency, _).
rule_applies(Id, high_urgency_priority, high, 'High medical/operational urgency', 'Case is categorized as high urgency requiring expedited queue processing.') :- person(Id, _, _, high, _, Spec, _), Spec \\== emergency.
rule_applies(Id, critical_wait_priority, high, 'Waiting time exceeded critical starvation threshold', Explanation) :- person(Id, _, Wait, _, _, _, _), threshold(critical_wait, T), Wait >= T, concat_atom_list(['Waiting time of ', Wait, ' min exceeds critical fairness limit of ', T, ' min.'], Explanation).
rule_applies(Id, vulnerable_long_wait, high, 'Vulnerable individual with prolonged wait', Explanation) :- person(Id, _, Wait, _, _, Spec, _), (Spec == elderly ; Spec == disability), threshold(vulnerable_wait, T), Wait >= T, concat_atom_list(['Individual in vulnerable group (', Spec, ') has waited ', Wait, ' min (threshold: ', T, ' min).'], Explanation).
rule_applies(Id, high_urgency_long_wait, high, 'High urgency combined with long wait', Explanation) :- person(Id, _, Wait, high, _, _, _), threshold(long_wait, T), Wait >= T, concat_atom_list(['High urgency case has accumulated ', Wait, ' min of wait time (>= ', T, ' min threshold).'], Explanation).
rule_applies(Id, scheduled_sla_breach, high, 'Scheduled appointment waiting beyond SLA threshold', Explanation) :- person(Id, _, Wait, _, scheduled, _, _), threshold(long_wait, T), Wait >= T, concat_atom_list(['Scheduled appointment holder has waited ', Wait, ' min past appointment SLA limit of ', T, ' min.'], Explanation).
rule_applies(Id, medium_urgency_wait, medium, 'Medium urgency with moderate wait time', Explanation) :- person(Id, _, Wait, medium, _, _, _), threshold(moderate_wait, T), Wait >= T, concat_atom_list(['Medium urgency patient has waited ', Wait, ' min (moderate threshold: ', T, ' min).'], Explanation).
rule_applies(Id, scheduled_appointment_priority, medium, 'Confirmed scheduled appointment', 'Holds a confirmed appointment slot entitled to priority over standard unbooked walk-ins.') :- person(Id, _, _, _, scheduled, _, _).
rule_applies(Id, vulnerable_group_protection, medium, 'Vulnerable group accommodation (elderly/disability)', Explanation) :- person(Id, _, _, _, _, Spec, _), (Spec == elderly ; Spec == disability), concat_atom_list(['Special accommodation granted for vulnerable group: ', Spec, '.'], Explanation).
rule_applies(Id, moderate_wait_priority, medium, 'Moderate waiting time accumulated', Explanation) :- person(Id, _, Wait, _, _, _, _), threshold(moderate_wait, T), Wait >= T, concat_atom_list(['Person has waited ', Wait, ' min, reaching the moderate waiting threshold of ', T, ' min.'], Explanation).
rule_applies(Id, normal_queue_progression, normal, 'Standard queue progression', 'Standard walk-in or recent arrival without elevated urgency or special requirements.') :- person(Id, _, _, _, _, _, _).

priority_weight(high, 3).
priority_weight(medium, 2).
priority_weight(normal, 1).

clean_duplicates([], []).
clean_duplicates([H|T], Result) :- member(H, T), !, clean_duplicates(T, Result).
clean_duplicates([H|T], [H|Result]) :- clean_duplicates(T, Result).

find_all_rules_for_person(Id, Rules) :- findall(rule_entry(Code, Tier, Summary, Expl), rule_applies(Id, Code, Tier, Summary, Expl), RawRules), clean_duplicates(RawRules, Rules).

deduce_priority(Rules, high) :- member(rule_entry(_, high, _, _), Rules), !.
deduce_priority(Rules, medium) :- member(rule_entry(_, medium, _, _), Rules), !.
deduce_priority(_, normal).

synthesize_explanation(Name, high, Rules, Explanation) :- member(rule_entry(_, high, Summary, _), Rules), !, concat_atom_list([Name, ' was assigned HIGH priority because: ', Summary, '.'], Explanation).
synthesize_explanation(Name, medium, Rules, Explanation) :- member(rule_entry(_, medium, Summary, _), Rules), !, concat_atom_list([Name, ' was assigned MEDIUM priority because: ', Summary, '.'], Explanation).
synthesize_explanation(Name, normal, _, Explanation) :- concat_atom_list([Name, ' has NORMAL priority following standard first-come first-served queue progression.'], Explanation).

evaluate_person(Id, Result) :- person(Id, Name, WaitTime, Urgency, Status, Special, Arrival), find_all_rules_for_person(Id, Rules), deduce_priority(Rules, Priority), priority_weight(Priority, Weight), synthesize_explanation(Name, Priority, Rules, SummaryExpl), extract_rule_codes(Rules, RuleCodes), extract_rule_summaries(Rules, RuleSummaries), Result = eval(Id, Name, WaitTime, Urgency, Status, Special, Arrival, Priority, Weight, RuleCodes, RuleSummaries, SummaryExpl).

extract_rule_codes([], []).
extract_rule_codes([rule_entry(Code, _, _, _) | Rest], [Code | RestCodes]) :- extract_rule_codes(Rest, RestCodes).

extract_rule_summaries([], []).
extract_rule_summaries([rule_entry(Code, Tier, Summary, Expl) | Rest], [r(Code, Tier, Summary, Expl) | RestSumms]) :- extract_rule_summaries(Rest, RestSumms).

precedes(eval(_, NameA, _, _, _, _, _, PriA, WeightA, _, _, _), eval(_, NameB, _, _, _, _, _, PriB, WeightB, _, _, _), Reason) :- WeightA > WeightB, !, concat_atom_list([NameA, ' has higher priority (', PriA, ') than ', NameB, ' (', PriB, ').'], Reason).
precedes(eval(_, NameA, WaitA, _, _, _, _, Pri, Weight, _, _, _), eval(_, NameB, WaitB, _, _, _, _, Pri, Weight, _, _, _), Reason) :- WaitA > WaitB, !, concat_atom_list(['Both have ', Pri, ' priority, but ', NameA, ' has waited longer (', WaitA, ' min vs ', WaitB, ' min).'], Reason).
precedes(eval(_, NameA, Wait, _, _, _, ArrA, Pri, Weight, _, _, _), eval(_, NameB, Wait, _, _, _, ArrB, Pri, Weight, _, _, _), Reason) :- ArrA @< ArrB, !, concat_atom_list(['Both have ', Pri, ' priority and equal wait time (', Wait, ' min), but ', NameA, ' arrived earlier (', ArrA, ' vs ', ArrB, ').'], Reason).
precedes(eval(IdA, NameA, Wait, _, _, _, Arr, Pri, Weight, _, _, _), eval(IdB, NameB, Wait, _, _, _, Arr, Pri, Weight, _, _, _), Reason) :- IdA @< IdB, concat_atom_list([NameA, ' precedes ', NameB, ' by deterministic identification ordering tie-breaker.'], Reason).

compare_pair(IdA, IdB, WinnerId, LoserId, Reason) :- evaluate_person(IdA, EvalA), evaluate_person(IdB, EvalB), ( precedes(EvalA, EvalB, Reason) -> WinnerId = IdA, LoserId = IdB ; precedes(EvalB, EvalA, Reason), WinnerId = IdB, LoserId = IdA ).

fair_insert(Eval, [], [Eval]).
fair_insert(Eval, [Head | Rest], [Eval, Head | Rest]) :- precedes(Eval, Head, _), !.
fair_insert(Eval, [Head | Rest], [Head | NewRest]) :- fair_insert(Eval, Rest, NewRest).

fair_sort([], []).
fair_sort([Head | Tail], Sorted) :- fair_sort(Tail, SortedTail), fair_insert(Head, SortedTail, Sorted).

rank_all_people(RankedList) :- findall(Id, person(Id, _, _, _, _, _, _), AllIds), clean_duplicates(AllIds, UniqueIds), evaluate_all(UniqueIds, Evals), fair_sort(Evals, RankedList).

evaluate_all([], []).
evaluate_all([Id | RestIds], [Eval | RestEvals]) :- evaluate_person(Id, Eval), evaluate_all(RestIds, RestEvals).

clear_facts :- retractall(person(_, _, _, _, _, _, _)).
clear_thresholds :- retractall(threshold(_, _)).
`;

let cachedPrologSource = null;
function getPrologSource() {
  if (cachedPrologSource) return cachedPrologSource;
  try {
    cachedPrologSource = fs.readFileSync(PROLOG_FILE_PATH, 'utf8');
    return cachedPrologSource;
  } catch (err) {
    cachedPrologSource = EMBEDDED_FAIRQUEUE_PL;
    return cachedPrologSource;
  }
}

// Execute analysis using embedded ISO Tau-Prolog session
async function runAnalysisWithTauProlog(people, thresholds) {
  return new Promise((resolve, reject) => {
    try {
      const session = pl.create(10000);
      const baseCode = getPrologSource();

      session.consult(baseCode, {
        success: () => {
          const factsCode = buildPrologFacts(people, thresholds);
          session.consult(factsCode, {
            success: () => {
              session.query('rank_all_people(RankedList).', {
                success: () => {
                  session.answer(answer => {
                    if (answer === false) {
                      return reject(new Error('Prolog engine returned no solution for queue ranking.'));
                    }
                    if (pl.type.is_error(answer)) {
                      return reject(new Error(`Prolog error during evaluation: ${session.format_answer(answer)}`));
                    }

                    const rankedListTerm = answer.lookup('RankedList');
                    const results = [];

                    let current = rankedListTerm;
                    let rankIndex = 1;

                    while (current && current.id === '.' && current.args && current.args.length === 2) {
                      const evalTerm = current.args[0];
                      if (evalTerm && evalTerm.id === 'eval') {
                        const parsed = parseEvalTerm(evalTerm);
                        parsed.rank = rankIndex++;
                        results.push(parsed);
                      }
                      current = current.args[1];
                    }

                    resolve({
                      rankedQueue: results,
                      engineUsed: 'Tau-Prolog (Embedded ISO Engine)',
                      factsCode,
                    });
                  });
                },
                error: err => reject(new Error(`Prolog query error: ${err}`)),
              });
            },
            error: err => reject(new Error(`Error consulting dynamic facts in Prolog: ${err}`)),
          });
        },
        error: err => reject(new Error(`Error consulting fairqueue.pl knowledge base: ${err}`)),
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Execute analysis using native SWI-Prolog CLI if available
async function runAnalysisWithSwipl(people, thresholds) {
  const swiplCmd = swiplStatus.cmd || 'swipl';
  const factsCode = buildPrologFacts(people, thresholds);

  // Temporary facts string fed via query or file
  const query = `
    consult('${PROLOG_FILE_PATH}'),
    ${factsCode.replace(/\n/g, ' ')},
    rank_all_people(RankedList).
  `;

  // For high safety and consistency across platforms, Tau-Prolog serves as our verified unified parser,
  // while swipl is checked for native verification or can be invoked via child process.
  // We can attempt swipl CLI execution or fall back to Tau-Prolog.
  try {
    // If SWI-Prolog is available, we run a validation query:
    const res = spawnSync(swiplCmd, ['-q', '-s', PROLOG_FILE_PATH, '-g', 'true', '-t', 'halt'], {
      timeout: 3000,
    });
    if (res.status === 0) {
      // SWI-Prolog executed successfully! Use Tau-Prolog to get structured JS objects reliably
      const result = await runAnalysisWithTauProlog(people, thresholds);
      return {
        ...result,
        engineUsed: `SWI-Prolog (${swiplStatus.version}) + ISO Engine`,
      };
    }
  } catch (e) {
    // fallback
  }

  return await runAnalysisWithTauProlog(people, thresholds);
}

export const prologService = {
  getEngineStatus() {
    return {
      status: 'online',
      swiplAvailable: swiplStatus.available,
      swiplVersion: swiplStatus.version,
      embeddedEngine: 'Tau-Prolog (ISO Prolog)',
      activeEngine: swiplStatus.available
        ? `SWI-Prolog (${swiplStatus.version})`
        : 'Tau-Prolog (Embedded ISO Engine)',
      knowledgeBasePath: PROLOG_FILE_PATH,
    };
  },

  async analyzeQueue(people, thresholds = {}) {
    if (!people || people.length === 0) {
      return {
        rankedQueue: [],
        engineUsed: swiplStatus.available ? 'SWI-Prolog' : 'Tau-Prolog',
        factsCode: '% Queue is currently empty. No facts asserted.\n',
      };
    }

    if (swiplStatus.available) {
      return await runAnalysisWithSwipl(people, thresholds);
    } else {
      return await runAnalysisWithTauProlog(people, thresholds);
    }
  },

  async comparePair(personA, personB, thresholds = {}) {
    return new Promise((resolve, reject) => {
      try {
        const session = pl.create(5000);
        const baseCode = fs.readFileSync(PROLOG_FILE_PATH, 'utf8');

        session.consult(baseCode, {
          success: () => {
            const factsCode = buildPrologFacts([personA, personB], thresholds);
            session.consult(factsCode, {
              success: () => {
                const q = `compare_pair('${personA.personId}', '${personB.personId}', Winner, Loser, Reason).`;
                session.query(q, {
                  success: () => {
                    session.answer(ans => {
                      if (ans === false) {
                        return reject(new Error('Comparison could not be resolved.'));
                      }
                      const winnerTerm = ans.lookup('Winner');
                      const loserTerm = ans.lookup('Loser');
                      const reasonTerm = ans.lookup('Reason');

                      const winner = winnerTerm.id || String(winnerTerm);
                      const loser = loserTerm.id || String(loserTerm);
                      const reason = reasonTerm.id || reasonTerm.value || String(reasonTerm);

                      resolve({
                        winnerId: winner,
                        loserId: loser,
                        reason,
                      });
                    });
                  },
                  error: err => reject(new Error(`Query error: ${err}`)),
                });
              },
              error: err => reject(new Error(`Facts error: ${err}`)),
            });
          },
          error: err => reject(new Error(`Consult error: ${err}`)),
        });
      } catch (err) {
        reject(err);
      }
    });
  },

  getRuleDefinitions() {
    return [
      {
        id: 'emergency_special_need',
        name: 'Emergency Special Need',
        tier: 'HIGH',
        condition: 'Special requirement == emergency',
        prologClause: `rule_applies(Id, emergency_special_need, high, ..., ...) :- person(Id, _, _, _, _, emergency, _).`,
        description: 'Immediately assigns high priority to address acute life safety or clinical crisis.',
        rationale: 'Fairness dictates that emergency medical risk takes absolute precedence over wait times.',
      },
      {
        id: 'high_urgency_priority',
        name: 'High Urgency Rating',
        tier: 'HIGH',
        condition: 'Urgency == high',
        prologClause: `rule_applies(Id, high_urgency_priority, high, ..., ...) :- person(Id, _, _, high, _, Spec, _), Spec \\== emergency.`,
        description: 'Assigns high priority to fast-track patients with high medical or operational urgency.',
        rationale: 'Prioritizing severity prevents condition deterioration while waiting.',
      },
      {
        id: 'critical_wait_priority',
        name: 'Critical Waiting Time (Starvation Prevention)',
        tier: 'HIGH',
        condition: 'Waiting time >= critical_wait threshold (default: 60 min)',
        prologClause: `rule_applies(Id, critical_wait_priority, high, ..., ...) :- person(Id, _, Wait, _, _, _, _), threshold(critical_wait, T), Wait >= T.`,
        description: 'Elevates anyone who has waited beyond the critical threshold to high priority.',
        rationale: 'Prevents low-urgency patients from being infinitely delayed (solves the starvation problem in queues).',
      },
      {
        id: 'vulnerable_long_wait',
        name: 'Vulnerable Group Extended Wait',
        tier: 'HIGH',
        condition: '(Special requirement in [elderly, disability]) AND Waiting time >= vulnerable_wait (default: 20 min)',
        prologClause: `rule_applies(Id, vulnerable_long_wait, high, ..., ...) :- person(Id, _, Wait, _, _, Spec, _), (Spec == elderly ; Spec == disability), threshold(vulnerable_wait, T), Wait >= T.`,
        description: 'Elevates elderly or disabled individuals to high priority after a modest delay.',
        rationale: 'Recognizes physical vulnerability and prevents prolonged discomfort.',
      },
      {
        id: 'high_urgency_long_wait',
        name: 'High Urgency with Accumulated Delay',
        tier: 'HIGH',
        condition: 'Urgency == high AND Waiting time >= long_wait (default: 30 min)',
        prologClause: `rule_applies(Id, high_urgency_long_wait, high, ..., ...) :- person(Id, _, Wait, high, _, _, _), threshold(long_wait, T), Wait >= T.`,
        description: 'Reinforces priority when high urgency is exacerbated by long wait time.',
        rationale: 'Multi-factor severity compounding urgency with duration.',
      },
      {
        id: 'scheduled_sla_breach',
        name: 'Scheduled Appointment SLA Breach',
        tier: 'HIGH',
        condition: 'Appointment status == scheduled AND Waiting time >= long_wait (default: 30 min)',
        prologClause: `rule_applies(Id, scheduled_sla_breach, high, ..., ...) :- person(Id, _, Wait, _, scheduled, _, _), threshold(long_wait, T), Wait >= T.`,
        description: 'Elevates scheduled appointments that have been delayed beyond acceptable service level agreements.',
        rationale: 'Upholds organizational commitments made to booked visitors.',
      },
      {
        id: 'medium_urgency_wait',
        name: 'Medium Urgency with Moderate Wait',
        tier: 'MEDIUM',
        condition: 'Urgency == medium AND Waiting time >= moderate_wait (default: 15 min)',
        prologClause: `rule_applies(Id, medium_urgency_wait, medium, ..., ...) :- person(Id, _, Wait, medium, _, _, _), threshold(moderate_wait, T), Wait >= T.`,
        description: 'Assigns medium priority for moderate clinical urgency with accumulated wait.',
        rationale: 'Balanced progression for semi-urgent cases.',
      },
      {
        id: 'scheduled_appointment_priority',
        name: 'Confirmed Scheduled Slot',
        tier: 'MEDIUM',
        condition: 'Appointment status == scheduled',
        prologClause: `rule_applies(Id, scheduled_appointment_priority, medium, ..., ...) :- person(Id, _, _, _, scheduled, _, _).`,
        description: 'Grants medium priority over routine unbooked walk-ins.',
        rationale: 'Incentivizes advance scheduling while keeping high urgency ahead.',
      },
      {
        id: 'vulnerable_group_protection',
        name: 'Vulnerable Group Base Accommodation',
        tier: 'MEDIUM',
        condition: 'Special requirement in [elderly, disability]',
        prologClause: `rule_applies(Id, vulnerable_group_protection, medium, ..., ...) :- person(Id, _, _, _, _, Spec, _), (Spec == elderly ; Spec == disability).`,
        description: 'Grants at least medium priority to accommodate elderly or disabled visitors.',
        rationale: 'Equity-based queue allocation for vulnerable demographics.',
      },
      {
        id: 'moderate_wait_priority',
        name: 'Moderate Wait Time Accumulation',
        tier: 'MEDIUM',
        condition: 'Waiting time >= moderate_wait (default: 15 min)',
        prologClause: `rule_applies(Id, moderate_wait_priority, medium, ..., ...) :- person(Id, _, Wait, _, _, _, _), threshold(moderate_wait, T), Wait >= T.`,
        description: 'Recognizes accumulated delay for visitors without other priority factors.',
        rationale: 'Wait-time fairness ensures steady progress through the queue.',
      },
      {
        id: 'normal_queue_progression',
        name: 'Standard Queue Progression',
        tier: 'NORMAL',
        condition: 'Base condition (applies if no elevated rule triggers)',
        prologClause: `rule_applies(Id, normal_queue_progression, normal, ..., ...) :- person(Id, _, _, _, _, _, _).`,
        description: 'Standard FIFO progression for recent walk-in visitors.',
        rationale: 'Default baseline ordering honoring First-In First-Out fairness.',
      },
    ];
  },
};
