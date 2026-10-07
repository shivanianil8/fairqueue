# FAIRQUEUE Declarative Knowledge Base & Horn Clause Catalog
> **Formal Specification of Pure First-Order Logic Rules (`logic/fairqueue.pl`)**

---

## 1. Relational Facts Schema

The Prolog reasoning engine represents the active queue state as a relational knowledge base:

```prolog
person(PersonId, Name, WaitingTime, Urgency, AppointmentStatus, SpecialRequirement, ArrivalTime).
threshold(ThresholdName, MinutesValue).
```

### Fact Arguments:
- **`PersonId`** *(atom)*: Unique ticket identifier (e.g. `'P001'`).
- **`Name`** *(atom)*: Visitor full name (e.g. `'Anjana AS'`).
- **`WaitingTime`** *(integer >= 0)*: Duration in minutes the person has spent in queue.
- **`Urgency`** *(atom)*: Clinical/service urgency (`low`, `medium`, `high`).
- **`AppointmentStatus`** *(atom)*: Scheduled status (`scheduled`, `walkin`, `missed`).
- **`SpecialRequirement`** *(atom)*: Demographic attribute (`emergency`, `elderly`, `disability`, `none`, `other`).
- **`ArrivalTime`** *(atom)*: Timestamp of visitor check-in (`'09:12'`).

---

## 2. Complete Catalog of 11 Horn Clauses

All rules are formulated as standard **Horn Clauses** of the form:  
`Head :- Body1, Body2, ..., BodyN.`

| # | Rule Code | Tier | Logic Rule Formulation | Natural-Language Rationale |
| :-: | :--- | :---: | :--- | :--- |
| **1** | `emergency_special_need` | **HIGH** | `rule_applies(Id, emergency_special_need, high, ..., ...) :- person(Id, _, _, _, _, emergency, _).` | Acute medical or physical emergency condition supersedes standard queue progression. |
| **2** | `high_urgency_priority` | **HIGH** | `rule_applies(Id, high_urgency_priority, high, ..., ...) :- person(Id, _, _, high, _, _, _).` | High triage urgency requires prompt intake and service. |
| **3** | `critical_wait_priority` | **HIGH** | `rule_applies(Id, critical_wait_priority, high, ..., ...) :- person(Id, _, Wait, _, _, _, _), threshold(critical_wait, T), Wait >= T.` | **Starvation Prevention Clause**: Elevates any visitor waiting &gt;= critical threshold (60 min) to prevent indefinite delays. |
| **4** | `vulnerable_long_wait` | **HIGH** | `rule_applies(Id, vulnerable_long_wait, high, ..., ...) :- person(Id, _, Wait, _, _, Spec, _), is_vulnerable(Spec), threshold(vulnerable_wait, T), Wait >= T.` | Protects vulnerable individuals (elderly/disability) experiencing prolonged waiting times (&gt;= 20 min). |
| **5** | `high_urgency_long_wait` | **HIGH** | `rule_applies(Id, high_urgency_long_wait, high, ..., ...) :- person(Id, _, Wait, high, _, _, _), threshold(long_wait, T), Wait >= T.` | High urgency cases who have also waited prolonged durations (&gt;= 30 min). |
| **6** | `scheduled_sla_breach` | **HIGH** | `rule_applies(Id, scheduled_sla_breach, high, ..., ...) :- person(Id, _, Wait, _, scheduled, _, _), threshold(long_wait, T), Wait >= T.` | Pre-booked appointment waiting longer than service level agreement threshold (&gt;= 30 min). |
| **7** | `medium_urgency_wait` | **MEDIUM** | `rule_applies(Id, medium_urgency_wait, medium, ..., ...) :- person(Id, _, Wait, medium, _, _, _), threshold(moderate_wait, T), Wait >= T.` | Moderate urgency visitors who have accumulated meaningful queue wait (&gt;= 15 min). |
| **8** | `scheduled_appointment_priority` | **MEDIUM** | `rule_applies(Id, scheduled_appointment_priority, medium, ..., ...) :- person(Id, _, _, _, scheduled, _, _).` | Honoring pre-booked appointments over unannounced walk-in visits. |
| **9** | `vulnerable_group_protection` | **MEDIUM** | `rule_applies(Id, vulnerable_group_protection, medium, ..., ...) :- person(Id, _, _, _, _, Spec, _), is_vulnerable(Spec).` | Affirmative protection for elderly and disabled visitors. |
| **10** | `moderate_wait_priority` | **MEDIUM** | `rule_applies(Id, moderate_wait_priority, medium, ..., ...) :- person(Id, _, Wait, _, _, _, _), threshold(moderate_wait, T), Wait >= T.` | Rewarding patience once moderate wait duration is reached (&gt;= 15 min). |
| **11** | `normal_queue_progression` | **NORMAL** | `rule_applies(Id, normal_queue_progression, normal, ..., ...) :- person(Id, _, _, _, _, _, _).` | Universal baseline rule applying to all registered arrivals. |

---

## 3. Priority Deduction & The Cut Operator (`!`)

To prevent backtracking from demoting a candidate after a higher-priority tier has been proven, FAIRQUEUE uses Prolog's **cut operator (`!`)**:

```prolog
% Deduce final priority tier
deduce_priority(PersonId, high) :-
    rule_applies(PersonId, _, high, _, _), !.

deduce_priority(PersonId, medium) :-
    rule_applies(PersonId, _, medium, _, _), !.

deduce_priority(PersonId, normal) :-
    rule_applies(PersonId, _, normal, _, _), !.

deduce_priority(_, normal).
```

### Execution Semantics:
1. Prolog attempts to satisfy `rule_applies(PersonId, _, high, _, _)`. If any high-tier clause succeeds, the cut `!` commits to `high` and discards all alternative choice points.
2. If no high clause applies, Prolog evaluates medium clauses. The cut commits to `medium`.
3. If neither succeeds, it defaults deterministically to `normal`.

---

## 4. Deterministic Ordering Predicate (`precedes/3`)

Tie-breaking in FAIRQUEUE is 100% deterministic and transitive:

```prolog
precedes(IdA, IdB, Reason) :-
    deduce_priority(IdA, PriA),
    deduce_priority(IdB, PriB),
    priority_level(PriA, LevA),
    priority_level(PriB, LevB),
    (   LevA > LevB
    ->  ...
    ;   LevA =:= LevB
    ->  person(IdA, _, WaitA, _, _, _, ArrA),
        person(IdB, _, WaitB, _, _, _, ArrB),
        (   WaitA > WaitB
        ->  ...
        ;   WaitA =:= WaitB
        ->  ArrA @< ArrB
        )
    ).
```

### Deterministic Precedence Hierarchy:
1. **Tier Superiority**: `HIGH` (Level 3) &gt; `MEDIUM` (Level 2) &gt; `NORMAL` (Level 1).
2. **Waiting Time Tie-Breaker**: Greater `WaitingTime` precedes lesser `WaitingTime`.
3. **Arrival Time Tie-Breaker**: Earlier lexicographical `ArrivalTime` (`'09:05'` &lt; `'09:12'`) precedes later arrival.

---

## 5. Pairwise Comparison (`compare_pair/5`)

Answers examiner and administrative questions such as:  
*"Why was Person A recommended before Person B?"*

```prolog
compare_pair(IdA, IdB, WinnerId, LoserId, Reason) :-
    (   precedes(IdA, IdB, PrecedesReason)
    ->  WinnerId = IdA,
        LoserId = IdB,
        Reason = PrecedesReason
    ;   precedes(IdB, IdA, PrecedesReason)
    ->  WinnerId = IdB,
        LoserId = IdA,
        Reason = PrecedesReason
    ;   WinnerId = IdA,
        LoserId = IdB,
        Reason = 'Equal priority and waiting times; preserved initial registration order.'
    ).
```
