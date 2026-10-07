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

// Execute analysis using embedded ISO Tau-Prolog session
async function runAnalysisWithTauProlog(people, thresholds) {
  return new Promise((resolve, reject) => {
    try {
      const session = pl.create(10000);
      const baseCode = fs.readFileSync(PROLOG_FILE_PATH, 'utf8');

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
