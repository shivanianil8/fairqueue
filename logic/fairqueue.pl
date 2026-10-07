% ==============================================================================
% FAIRQUEUE - Intelligent Queue Fairness Analyzer
% ==============================================================================
% Logic Programming Knowledge Base & Inference Engine (SWI-Prolog / ISO Prolog)
%
% ------------------------------------------------------------------------------
% ACADEMIC CONCEPTS EXPLAINED IN THIS CODE:
% 1. FACTS: Direct assertions of truth in the world (e.g., person/7, threshold/2).
% 2. RULES: Conditional assertions (Horn Clauses) of the form "Head :- Body"
%    meaning "Head is true IF Body is true".
% 3. PREDICATES: Named relations with specific arity (e.g., rule_applies/5 has arity 5).
% 4. ATOMS vs VARIABLES: Atoms are lowercase identifiers (high, walkin, none);
%    Variables start with an uppercase letter or underscore (Id, Wait, Rules).
% 5. UNIFICATION: The core pattern-matching algorithm where Prolog binds variables
%    to terms to satisfy relations (e.g., Urgency = high).
% 6. QUERY EVALUATION / RESOLUTION: Backward chaining from goals to facts using
%    SLD resolution (Selective Linear Definite clause resolution).
% 7. EXPLAINABILITY: Capturing the specific deduction path and fired rules so
%    every queue ranking decision is fully auditable and transparent.
% ==============================================================================

:- dynamic(person/7).
:- dynamic(threshold/2).

% ------------------------------------------------------------------------------
% DEFAULT THRESHOLDS (Configurable Facts)
% threshold(Name, ValueInMinutes)
% ------------------------------------------------------------------------------
threshold(critical_wait, 60).    % Waiting >= 60 min triggers critical starvation rule
threshold(long_wait, 30).        % Waiting >= 30 min triggers long-wait rule
threshold(vulnerable_wait, 20).  % Waiting >= 20 min for elderly/disability triggers high priority
threshold(moderate_wait, 15).    % Waiting >= 15 min triggers moderate rule

% ------------------------------------------------------------------------------
% FUNDAMENTAL LOGIC PREDICATE: member/2
% Classic declarative definition used across ISO Prolog and during academic vivas:
% - Base Case: Element X is the head of the list.
% - Recursive Case: Element X is a member of the tail.
% ------------------------------------------------------------------------------
member(X, [X|_]).
member(X, [_|Tail]) :-
    member(X, Tail).

% ------------------------------------------------------------------------------
% PORTABLE STRING/ATOM CONCATENATION HELPER
% Compatible across SWI-Prolog and standard ISO Prolog engines
% ------------------------------------------------------------------------------
concat_atom_list([], '').
concat_atom_list([X], AtomX) :-
    !,
    ( number(X) -> number_chars(X, Chars), atom_chars(AtomX, Chars) ; AtomX = X ).
concat_atom_list([X|Xs], Result) :-
    concat_atom_list(Xs, Rest),
    ( number(X) -> number_chars(X, Chars), atom_chars(AtomX, Chars) ; AtomX = X ),
    atom_concat(AtomX, Rest, Result).

% ------------------------------------------------------------------------------
% FACT TEMPLATE:
% person(Id, Name, WaitingTime, Urgency, AppointmentStatus, SpecialRequirement, ArrivalTime).
% - Id: Unique identifier (e.g., p1, anjana)
% - Name: String or atom of person name
% - WaitingTime: Integer (minutes already waiting)
% - Urgency: low | medium | high
% - AppointmentStatus: scheduled | walkin | missed
% - SpecialRequirement: none | elderly | disability | emergency | other
% - ArrivalTime: String (e.g., "09:15")
% ------------------------------------------------------------------------------

% ==============================================================================
% LOGICAL RULES FOR FAIR QUEUE EVALUATION
% rule_applies(Id, RuleCode, PriorityTier, ShortSummary, Explanation)
% ==============================================================================

% RULE 1: Emergency Condition
% IF the person has an emergency requirement
% THEN high priority is immediately assigned regardless of waiting time.
rule_applies(Id, emergency_special_need, high,
             'Emergency special need detected',
             'Patient presents an immediate emergency condition requiring urgent clinical attention.') :-
    person(Id, _, _, _, _, emergency, _).

% RULE 2: High Urgency
% IF urgency is rated high
% THEN high priority is assigned.
rule_applies(Id, high_urgency_priority, high,
             'High medical/operational urgency',
             'Case is categorized as high urgency requiring expedited queue processing.') :-
    person(Id, _, _, high, _, Spec, _),
    Spec \== emergency. % Prevent redundant duplicate tagging if emergency is already active

% RULE 3: Critical Waiting Time (Starvation Prevention)
% IF a person has been waiting longer than the critical threshold (e.g. 60 min)
% THEN elevate to high priority to prevent queue starvation and guarantee fairness.
rule_applies(Id, critical_wait_priority, high,
             'Waiting time exceeded critical starvation threshold',
             Explanation) :-
    person(Id, _, Wait, _, _, _, _),
    threshold(critical_wait, T),
    Wait >= T,
    concat_atom_list(['Waiting time of ', Wait, ' min exceeds critical fairness limit of ', T, ' min.'], Explanation).

% RULE 4: Vulnerable Individual with Prolonged Wait
% IF the person belongs to a vulnerable group (elderly or disability)
% AND has been waiting >= vulnerable_wait threshold (e.g. 20 min)
% THEN elevate to high priority out of humanitarian queue fairness.
rule_applies(Id, vulnerable_long_wait, high,
             'Vulnerable individual with prolonged wait',
             Explanation) :-
    person(Id, _, Wait, _, _, Spec, _),
    (Spec == elderly ; Spec == disability),
    threshold(vulnerable_wait, T),
    Wait >= T,
    concat_atom_list(['Individual in vulnerable group (', Spec, ') has waited ', Wait, ' min (threshold: ', T, ' min).'], Explanation).

% RULE 5: High Urgency Combined with Long Wait
% IF urgency is high AND waiting time >= long_wait threshold
% THEN reinforce high priority with compound reason.
rule_applies(Id, high_urgency_long_wait, high,
             'High urgency combined with long wait',
             Explanation) :-
    person(Id, _, Wait, high, _, _, _),
    threshold(long_wait, T),
    Wait >= T,
    concat_atom_list(['High urgency case has accumulated ', Wait, ' min of wait time (>= ', T, ' min threshold).'], Explanation).

% RULE 6: Scheduled Appointment Waiting Past Grace Period
% IF the person has a scheduled appointment AND has waited >= long_wait threshold
% THEN elevate to high priority to honor committed appointment SLA.
rule_applies(Id, scheduled_sla_breach, high,
             'Scheduled appointment waiting beyond SLA threshold',
             Explanation) :-
    person(Id, _, Wait, _, scheduled, _, _),
    threshold(long_wait, T),
    Wait >= T,
    concat_atom_list(['Scheduled appointment holder has waited ', Wait, ' min past appointment SLA limit of ', T, ' min.'], Explanation).

% RULE 7: Medium Urgency with Moderate Wait
% IF urgency is medium AND wait time >= moderate_wait threshold
% THEN assign medium priority.
rule_applies(Id, medium_urgency_wait, medium,
             'Medium urgency with moderate wait time',
             Explanation) :-
    person(Id, _, Wait, medium, _, _, _),
    threshold(moderate_wait, T),
    Wait >= T,
    concat_atom_list(['Medium urgency patient has waited ', Wait, ' min (moderate threshold: ', T, ' min).'], Explanation).

% RULE 8: Standard Scheduled Appointment
% IF the person holds a scheduled appointment and is not a missed slot
% THEN assign medium priority ahead of ordinary walk-ins.
rule_applies(Id, scheduled_appointment_priority, medium,
             'Confirmed scheduled appointment',
             'Holds a confirmed appointment slot entitled to priority over standard unbooked walk-ins.') :-
    person(Id, _, _, _, scheduled, _, _).

% RULE 9: Vulnerable Group Base Protection
% IF the person is elderly or has a disability (even if wait is under vulnerable_wait)
% THEN assign at least medium priority.
rule_applies(Id, vulnerable_group_protection, medium,
             'Vulnerable group accommodation (elderly/disability)',
             Explanation) :-
    person(Id, _, _, _, _, Spec, _),
    (Spec == elderly ; Spec == disability),
    concat_atom_list(['Special accommodation granted for vulnerable group: ', Spec, '.'], Explanation).

% RULE 10: Moderate Wait Accumulation
% IF wait time >= moderate_wait threshold
% THEN assign medium priority to recognize accumulated wait time.
rule_applies(Id, moderate_wait_priority, medium,
             'Moderate waiting time accumulated',
             Explanation) :-
    person(Id, _, Wait, _, _, _, _),
    threshold(moderate_wait, T),
    Wait >= T,
    concat_atom_list(['Person has waited ', Wait, ' min, reaching the moderate waiting threshold of ', T, ' min.'], Explanation).

% RULE 11: Normal Walk-in / Default Queue Progression
% Applies when no high or medium conditions dictate elevated priority.
rule_applies(Id, normal_queue_progression, normal,
             'Standard queue progression',
             'Standard walk-in or recent arrival without elevated urgency or special requirements.') :-
    person(Id, _, _, _, _, _, _).

% ==============================================================================
% DEDUCTION & PRIORITY LEVEL AGGREGATION
% ==============================================================================

% priority_weight(Level, NumericWeight)
% Maps symbolic priority tiers to numeric order for sorting.
priority_weight(high, 3).
priority_weight(medium, 2).
priority_weight(normal, 1).

% Portable duplicate removal
clean_duplicates([], []).
clean_duplicates([H|T], Result) :-
    member(H, T), !,
    clean_duplicates(T, Result).
clean_duplicates([H|T], [H|Result]) :-
    clean_duplicates(T, Result).

find_all_rules_for_person(Id, Rules) :-
    findall(rule_entry(Code, Tier, Summary, Expl),
            rule_applies(Id, Code, Tier, Summary, Expl),
            RawRules),
    clean_duplicates(RawRules, Rules).

% Deduce the overall priority tier for a person:
% If any triggered rule is 'high', overall priority is 'high'.
% Else if any triggered rule is 'medium', overall priority is 'medium'.
% Else overall priority is 'normal'.
deduce_priority(Rules, high) :-
    member(rule_entry(_, high, _, _), Rules), !.
deduce_priority(Rules, medium) :-
    member(rule_entry(_, medium, _, _), Rules), !.
deduce_priority(_, normal).

% Build human-readable synthesis explanation
synthesize_explanation(Name, high, Rules, Explanation) :-
    member(rule_entry(_, high, Summary, _), Rules), !,
    concat_atom_list([Name, ' was assigned HIGH priority because: ', Summary, '.'], Explanation).
synthesize_explanation(Name, medium, Rules, Explanation) :-
    member(rule_entry(_, medium, Summary, _), Rules), !,
    concat_atom_list([Name, ' was assigned MEDIUM priority because: ', Summary, '.'], Explanation).
synthesize_explanation(Name, normal, _, Explanation) :-
    concat_atom_list([Name, ' has NORMAL priority following standard first-come first-served queue progression.'], Explanation).

% Evaluate a single person by Id
evaluate_person(Id, Result) :-
    person(Id, Name, WaitTime, Urgency, Status, Special, Arrival),
    find_all_rules_for_person(Id, Rules),
    deduce_priority(Rules, Priority),
    priority_weight(Priority, Weight),
    synthesize_explanation(Name, Priority, Rules, SummaryExpl),
    extract_rule_codes(Rules, RuleCodes),
    extract_rule_summaries(Rules, RuleSummaries),
    Result = eval(Id, Name, WaitTime, Urgency, Status, Special, Arrival,
                  Priority, Weight, RuleCodes, RuleSummaries, SummaryExpl).

extract_rule_codes([], []).
extract_rule_codes([rule_entry(Code, _, _, _) | Rest], [Code | RestCodes]) :-
    extract_rule_codes(Rest, RestCodes).

extract_rule_summaries([], []).
extract_rule_summaries([rule_entry(Code, Tier, Summary, Expl) | Rest],
                       [r(Code, Tier, Summary, Expl) | RestSumms]) :-
    extract_rule_summaries(Rest, RestSumms).

% ==============================================================================
% FAIR QUEUE PRECEDENCE & RANKING ALGORITHM
% Deterministic tie-breakers:
% 1. Priority Weight (High=3 > Medium=2 > Normal=1)
% 2. Waiting Time (Higher wait time breaks ties)
% 3. Arrival Time (Earlier arrival breaks ties)
% 4. Person Id (Final deterministic tie-breaker)
% ==============================================================================

precedes(eval(_, NameA, _, _, _, _, _, PriA, WeightA, _, _, _),
         eval(_, NameB, _, _, _, _, _, PriB, WeightB, _, _, _),
         Reason) :-
    WeightA > WeightB, !,
    concat_atom_list([NameA, ' has higher priority (', PriA, ') than ', NameB, ' (', PriB, ').'], Reason).

precedes(eval(_, NameA, WaitA, _, _, _, _, Pri, Weight, _, _, _),
         eval(_, NameB, WaitB, _, _, _, _, Pri, Weight, _, _, _),
         Reason) :-
    WaitA > WaitB, !,
    concat_atom_list(['Both have ', Pri, ' priority, but ', NameA, ' has waited longer (', WaitA, ' min vs ', WaitB, ' min).'], Reason).

precedes(eval(_, NameA, Wait, _, _, _, ArrA, Pri, Weight, _, _, _),
         eval(_, NameB, Wait, _, _, _, ArrB, Pri, Weight, _, _, _),
         Reason) :-
    ArrA @< ArrB, !,
    concat_atom_list(['Both have ', Pri, ' priority and equal wait time (', Wait, ' min), but ', NameA, ' arrived earlier (', ArrA, ' vs ', ArrB, ').'], Reason).

precedes(eval(IdA, NameA, Wait, _, _, _, Arr, Pri, Weight, _, _, _),
         eval(IdB, NameB, Wait, _, _, _, Arr, Pri, Weight, _, _, _),
         Reason) :-
    IdA @< IdB,
    concat_atom_list([NameA, ' precedes ', NameB, ' by deterministic identification ordering tie-breaker.'], Reason).

% Pairwise comparison query
compare_pair(IdA, IdB, WinnerId, LoserId, Reason) :-
    evaluate_person(IdA, EvalA),
    evaluate_person(IdB, EvalB),
    ( precedes(EvalA, EvalB, Reason) ->
        WinnerId = IdA, LoserId = IdB
    ;
        precedes(EvalB, EvalA, Reason),
        WinnerId = IdB, LoserId = IdA
    ).

% Insertion Sort based on declarative precedes/3
fair_insert(Eval, [], [Eval]).
fair_insert(Eval, [Head | Rest], [Eval, Head | Rest]) :-
    precedes(Eval, Head, _), !.
fair_insert(Eval, [Head | Rest], [Head | NewRest]) :-
    fair_insert(Eval, Rest, NewRest).

fair_sort([], []).
fair_sort([Head | Tail], Sorted) :-
    fair_sort(Tail, SortedTail),
    fair_insert(Head, SortedTail, Sorted).

% Evaluate all loaded persons and rank them
rank_all_people(RankedList) :-
    findall(Id, person(Id, _, _, _, _, _, _), AllIds),
    clean_duplicates(AllIds, UniqueIds),
    evaluate_all(UniqueIds, Evals),
    fair_sort(Evals, RankedList).

evaluate_all([], []).
evaluate_all([Id | RestIds], [Eval | RestEvals]) :-
    evaluate_person(Id, Eval),
    evaluate_all(RestIds, RestEvals).

% Helper to clear all loaded dynamic facts
clear_facts :-
    retractall(person(_, _, _, _, _, _, _)).

clear_thresholds :-
    retractall(threshold(_, _)).

% ==============================================================================
% RULE METADATA (For Rules Page & Dynamic Explanation in UI)
% ==============================================================================
rule_metadata(emergency_special_need,
              'Emergency Special Need',
              'Special requirement is marked as emergency.',
              'Assigns HIGH priority immediately to address acute clinical risk.',
              high).

rule_metadata(high_urgency_priority,
              'High Urgency Rating',
              'Urgency is marked as high.',
              'Assigns HIGH priority to accelerate processing for critical conditions.',
              high).

rule_metadata(critical_wait_priority,
              'Critical Waiting Time Threshold',
              'Waiting time >= critical_wait threshold (default: 60 min).',
              'Assigns HIGH priority to prevent queue starvation and uphold fairness.',
              high).

rule_metadata(vulnerable_long_wait,
              'Vulnerable Group Extended Wait',
              'Individual is elderly or disabled AND waiting time >= vulnerable_wait threshold (default: 20 min).',
              'Assigns HIGH priority out of social equity and clinical caution.',
              high).

rule_metadata(high_urgency_long_wait,
              'High Urgency with Long Wait',
              'Urgency is high AND waiting time >= long_wait threshold (default: 30 min).',
              'Reinforces HIGH priority with compound severity justification.',
              high).

rule_metadata(scheduled_sla_breach,
              'Scheduled Appointment SLA Breach',
              'Appointment status is scheduled AND waiting time >= long_wait threshold (default: 30 min).',
              'Assigns HIGH priority to respect committed appointment service level agreements.',
              high).

rule_metadata(medium_urgency_wait,
              'Medium Urgency Moderate Wait',
              'Urgency is medium AND waiting time >= moderate_wait threshold (default: 15 min).',
              'Assigns MEDIUM priority for moderate clinical need with accumulated delay.',
              medium).

rule_metadata(scheduled_appointment_priority,
              'Scheduled Appointment Status',
              'Appointment status is scheduled.',
              'Assigns MEDIUM priority over routine unbooked walk-ins.',
              medium).

rule_metadata(vulnerable_group_protection,
              'Vulnerable Group Accommodation',
              'Special requirement is elderly or disability.',
              'Assigns at least MEDIUM priority to accommodate physical vulnerability.',
              medium).

rule_metadata(moderate_wait_priority,
              'Moderate Wait Time',
              'Waiting time >= moderate_wait threshold (default: 15 min).',
              'Assigns MEDIUM priority to prevent prolonged waiting for standard visitors.',
              medium).

rule_metadata(normal_queue_progression,
              'Standard Queue Progression',
              'No higher priority or special conditions triggered.',
              'Assigns NORMAL priority adhering to standard FIFO queue progression.',
              normal).
