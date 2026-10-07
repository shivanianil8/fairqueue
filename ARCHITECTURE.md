# FAIRQUEUE Architecture & System Design
> **Enterprise Rule-Based Queue Decision-Support Platform**  
> Paradigms: **First-Order Logic Programming (Horn Clauses), Declarative Expert Systems, State Machine Queues**

---

## 1. Architectural Philosophy

FAIRQUEUE is designed as a **rule-based queue decision-support system**, not an autonomous "AI oracle".

### Fundamental Tenets:
1. **Decision Support vs. Action**: The system produces transparent, explainable *recommendations* based on an organization's explicit declarative policies. Operational actions (calling a visitor, beginning counter service, or departing a ticket) remain strictly in the hands of authorized human operators.
2. **Transparent Deductive Logic**: Priority determinations are evaluated via **pure First-Order Horn Clauses** (`logic/fairqueue.pl`). No opaque machine learning weights, neural networks, or black-box arithmetic formulas (`score = urgency * 5 + wait * 2`) are used.
3. **Controlled Manual Override**: When human clinical or administrative discretion is necessary, operators can record a manual priority override—subject to a mandatory, audited justification reason.
4. **Auditability & Traceability**: Every decision, status transition, threshold update, and override is permanently logged to an immutable organizational event ledger.

---

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION                                 |
|                               (Vite, React 18, Tailwind CSS)                          |
|                                                                                       |
|   +-------------------+  +--------------------+  +------------------+                 |
|   | Queue Operations  |  | Decision Drawer    |  | Operational      |                 |
|   | - State Machine   |  | - FACT             |  |   Reports        |                 |
|   | - Call Next Turn  |  | - RULE             |  | - Starvation     |                 |
|   | - Manual Override |  | - INFERENCE        |  | - Frequencies    |                 |
|   | - Live Triage     |  | - RESULT           |  | - Throughput     |                 |
|   +-------------------+  +--------------------+  +------------------+                 |
|                                                                                       |
|   +-------------------+  +--------------------+  +------------------+                 |
|   | Multi-Queue       |  | RBAC Persona       |  | Audit Trail      |                 |
|   | Switcher (CS/DV)  |  | Switcher (Admin/Op)|  | Explorer (JSON)  |                 |
|   +-------------------+  +--------------------+  +------------------+                 |
+-------------------------------------------+-------------------------------------------+
                                            | REST API (JWT & JSON via HTTP)
                                            v
+---------------------------------------------------------------------------------------+
|                                  EXPRESS APPLICATION LAYER                            |
|                                    (Node.js ES Modules)                               |
|                                                                                       |
|  +--------------------+  +--------------------+  +------------------+                 |
|  | authMiddleware     |  | queueEntryController| | auditService     |                 |
|  | - PBKDF2 Verification| - WAITING -> CALLED |  | - Structured     |                 |
|  | - JWT Session Token|  | - Controlled       |  |   Compliance     |                 |
|  | - RBAC Guard       |  |   Override Guard   |  |   Logging        |                 |
|  +--------------------+  +--------------------+  +------------------+                 |
|                                                                                       |
|  +--------------------+  +--------------------+  +------------------+                 |
|  | queueController    |  | reportController   |  | prologService    |                 |
|  | - Multi-tenant Queues - Empirical Metrics  |  | - Relational     |                 |
|  | - Department Config|  | - Policy Disclaimer|  |   Fact Synthesis |                 |
|  +--------------------+  +--------------------+  +------------------+                 |
+------------------------------------+------+-------------------------------------------+
                                     |      |
                    Database Queries |      | Dynamic Facts & Query Goal
                                     v      v
+-----------------------------+    +----------------------------------------------------+
|       DATA PERSISTENCE      |    |            DECLARATIVE LOGIC INFERENCE             |
|                             |    |               (logic/fairqueue.pl)                 |
| - MongoDB (Production)      |    |                                                    |
| - MemoryStore (Resilience)  |    | - Dynamic Facts: person/7, threshold/2             |
| - Multi-Tenant Collections: |    | - 11 Horn Clauses: rule_applies/5                  |
|   * organizations           |    | - Priority Resolution: deduce_priority/2           |
|   * users & credentials     |    | - Starvation Guard: critical_wait_priority         |
|   * queues & rulesets       |    | - Deterministic Tie-Breaker: precedes/3            |
|   * queueEntries & states   |    | - Dual-Engine Portability:                         |
|   * auditLogs & snapshots   |    |   * SWI-Prolog CLI (`swipl`)                       |
|                             |    |   * Embedded ISO Tau-Prolog Engine                 |
+-----------------------------+    +----------------------------------------------------+
```

---

## 3. Multi-Queue Organization Model

FAIRQUEUE supports multi-queue environments within municipal, clinical, and corporate organizations.

### CityCare Service Centre Demo Configuration:
- **Organization**: `CityCare Municipal & Health Services Centre` (`org-citycare`)
- **Queue 1 (`q-citizen`)**: **Citizen Services & Healthcare Desk**
  - Prefix: `CS`
  - Scope: General citizen inquiries, primary healthcare intake, and public assistance.
  - Active Rule Set: `RULES-q-citizen-v1.0`
- **Queue 2 (`q-doc`)**: **Document Verification & Licensing**
  - Prefix: `DV`
  - Scope: Identity documentation, resident permits, and civil registry attestations.
  - Active Rule Set: `RULES-q-doc-v1.0`
- **Queue 3 (`q-appt`)**: **Specialist Appointments & Consular Desk**
  - Prefix: `SA`
  - Scope: Scheduled specialized consultations, legal affidavits, and consular services.
  - Active Rule Set: `RULES-q-appt-v1.0`

---

## 4. Queue Workflow State Machine

Visitors progress through an explicit, auditable operational state machine:

```
                  +-------------------------------------------------+
                  |                                                 |
                  v                                                 |
[ Registration ] ---> ( WAITING ) --[ Call Next / Call ]--> ( CALLED )
                           |                                   |       |
                           |--[ Cancel ]                       |       |--[ No Show ]
                           v                                   v       v
                     ( CANCELLED )                        ( IN_SERVICE )  ( NO_SHOW )
                                                               |
                                                               |--[ Complete ]
                                                               v
                                                          ( COMPLETED )
```

### State Definitions & Operational Rules:
1. `WAITING`: Visitor is seated in the waiting area. Subject to Prolog Horn clause deductive priority evaluation and starvation prevention.
2. `CALLED`: Operator at a designated counter has called the visitor ticket. Ticket displays on counter displays.
3. `IN_SERVICE`: Visitor is physically present at the counter receiving service.
4. `COMPLETED`: Service transaction successfully concluded. Service duration timestamped.
5. `NO_SHOW`: Visitor did not present at the counter after being called.
6. `CANCELLED`: Visitor voluntarily withdrew or ticket was cancelled by supervisor.

---

## 5. Dual-Engine Logic Architecture

To guarantee 100% runtime availability across both bare-metal servers and restricted container environments:

1. **Native SWI-Prolog CLI (`swipl`)**:
   - High-performance compiled C Prolog runtime.
   - Invoked via asynchronous child process spawn when `swipl` binary is detected on the host system `PATH`.
2. **Embedded ISO Tau-Prolog Engine**:
   - Zero-dependency JavaScript implementation of the ISO Prolog standard.
   - Evaluates the identical `logic/fairqueue.pl` code in-process if SWI-Prolog is not installed.
   - Guarantees instant zero-install deployment without native build tools or C compilers.

---

## 6. Audit Trail & Compliance Subsystem

FAIRQUEUE implements an immutable operational ledger (`audit_logs`) recording:
- `logId`: Globally unique timestamped record ID (`LOG-<timestamp>-<rand>`).
- `timestamp`: UTC ISO timestamp of the operational event.
- `organizationId` & `queueId`: Tenant and queue partition.
- `userId` & `userRole`: Identity and authorization tier of the actor.
- `eventType`: Standardized event code (e.g. `MANUAL_OVERRIDE_RECORDED`, `RULE_SET_ACTIVATED`, `ENTRY_CALLED`).
- `affectedRecordId`: Identifier of the affected visitor ticket, queue, or ruleset.
- `details`: Contextual payload (including mandatory override justification reason).
- `ipAddress`: Origin network address.
