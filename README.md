# FAIRQUEUE – Intelligent Queue Fairness Analyzer
> **Enterprise-Grade Rule-Based Queue Decision-Support Platform**  
> Powered by: **Logic Programming / Pure Prolog Horn Clauses (`logic/fairqueue.pl`), React 18, Node.js, Express, MongoDB**

---

## 📚 Production Documentation Suite
- 🏛️ [**ARCHITECTURE.md**](file:///Users/shivani/.gemini/antigravity/scratch/fairqueue/ARCHITECTURE.md): Multi-queue model, decision-support separation, state machine transitions, and dual-engine logic design.
- 🔒 [**SECURITY.md**](file:///Users/shivani/.gemini/antigravity/scratch/fairqueue/SECURITY.md): PBKDF2 cryptography, HMAC-SHA256 JWTs, 4-tier RBAC matrix, and manual override audit policies.
- 📜 [**RULES.md**](file:///Users/shivani/.gemini/antigravity/scratch/fairqueue/RULES.md): Formal specification of all 11 Prolog Horn clauses, cut operator (`!`) semantics, and starvation prevention.
- 📡 [**API.md**](file:///Users/shivani/.gemini/antigravity/scratch/fairqueue/API.md): Full REST API endpoint reference with JSON payloads, status transitions, and audit export.
- 🚀 [**DEPLOYMENT.md**](file:///Users/shivani/.gemini/antigravity/scratch/fairqueue/DEPLOYMENT.md): Production deployment guide, Dockerfile, PM2 cluster setup, and telemetry verification.

---

## 1. Project Overview & Vision

**FAIRQUEUE** is an enterprise-grade, rule-based queue decision-support platform designed to address the foundational flaws of conventional queue management: **opaque arithmetic scoring ("AI black-boxes") and low-urgency queue starvation**.

In conventional commercial tools, priority is frequently calculated via arbitrary arithmetic multipliers (e.g. `score = urgency * 5 + wait * 2`). This produces untraceable decisions where neither patients, citizens, nor staff understand *why* one person was prioritized over another. Furthermore, lower-urgency visitors frequently suffer from **starvation** (waiting indefinitely while new arrivals jump ahead).

FAIRQUEUE implements a **declarative rule-based expert system** powered by **First-Order Logic Programming (Prolog)**:
- **Decision Support, Not Autonomous Replacement**: Generates recommended turn assignments based on published declarative rules, leaving operational calls to human operators.
- **Pure Horn Clause Reasoning**: Deductions are evaluated strictly using relational unification in pure Prolog (`logic/fairqueue.pl`).
- **Controlled Manual Override**: When clinical triage or supervisor discretion is required, authorized managers can override priority with a mandatory, audited justification reason.
- **Multi-Queue Support**: Pre-configured with three live service desks at `CityCare Municipal & Health Services Centre` (`CS` Citizen Services, `DV` Document Verification, `SA` Specialist Appointments).
- **State Machine Workflow**: Tracks visitors through explicit transitions: `WAITING` → `CALLED` → `IN_SERVICE` → `COMPLETED` / `NO_SHOW` / `CANCELLED`.
- **Zero-Crash Portability**: Native SWI-Prolog CLI (`swipl`) with automatic in-process ISO Tau-Prolog fallback and MongoDB in-memory store fallback.

---

## 2. Architecture & Data Flow

```
+-------------------------------------------------------------------------------+
|                             REACT FRONTEND (Vite)                             |
|  - Dashboard: Live metrics, recommended queue timeline, priority distribution |
|  - Add Person: Validated input form with 4 realistic rule-demonstrating presets|
|  - Queue Management: Search, multi-criteria filter, sort, delete confirmation |
|  - Analyze Queue: Visual logic pipeline, raw Prolog fact inspector & results   |
|  - Decision Details: Horn clause breakdowns & Pairwise Comparison tool        |
|  - Rules & Knowledge Base: IF-THEN catalog, dynamic threshold configuration   |
|  - Analysis History: Persistent historical snapshots                          |
|  - Academic Viva Guide: Interactive logic programming concepts & answers      |
+---------------------------------------+---------------------------------------+
                                        | REST API (JSON via HTTP)
                                        v
+-------------------------------------------------------------------------------+
|                            NODE.JS / EXPRESS API                              |
|  - Routes: /api/people, /api/analyze, /api/analyses, /api/rules, /api/status  |
|  - prologService.js: Translates JSON records -> dynamic Prolog relational facts|
|  - dbService.js: Mongoose persistence + local in-memory fallback store        |
+---------------------------------------+---------------------------------------+
                                        | Fact Consultation & Goal Resolution
                                        v
+-------------------------------------------------------------------------------+
|                       PROLOG LOGIC ENGINE (logic/fairqueue.pl)                 |
|  - Dynamic Facts: person/7, threshold/2                                       |
|  - Horn Clause Rules: rule_applies/5                                          |
|  - Priority Deduction: deduce_priority/2 using cut (!) operators              |
|  - Deterministic Ordering: precedes/3 (Priority Tier > Wait Time > Arrival)   |
|  - Query Resolution: rank_all_people(RankedList), compare_pair/5              |
+-------------------------------------------------------------------------------+
```

### Complete End-to-End Data Flow:
1. **User Action**: The user adds visitors or clicks **"Analyze Queue with Prolog"** in the React application.
2. **API Request**: React dispatches an HTTP `POST /api/analyze` request to the Express backend.
3. **Fact Generation**: `prologService.js` transforms each queue entry into a relational Prolog fact:
   ```prolog
   person('P001', 'Anjana Devi', 45, high, scheduled, disability, '08:45').
   threshold(critical_wait, 60).
   threshold(long_wait, 30).
   ```
4. **Prolog Execution**:
   - Primary: Invokes **SWI-Prolog** CLI (`swipl`).
   - Fallback: Loads the ISO Prolog engine (`tau-prolog`) directly in-process with the exact same `logic/fairqueue.pl` file.
5. **Deductive Inference**:
   - Prolog matches terms using **unification**.
   - Evaluates `rule_applies/5` Horn clauses for all candidates.
   - Deduces final priority tier (`high` > `medium` > `normal`) using cut (`!`) operators.
   - Orders the queue deterministically with `precedes/3` (tie-breaking by wait time and arrival).
6. **JSON Serialization**: Express receives unified Prolog terms, formats them with natural-language justifications, and stores an analysis snapshot.
7. **UI Presentation**: React displays the prioritized queue with badges, triggered rules chips, and inspectable proofs.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Plus Jakarta Sans typography.
- **Backend**: Node.js (ES Modules), Express 4, CORS, Dotenv.
- **Logic Programming Engine**: SWI-Prolog (Native CLI) + Tau-Prolog (Embedded ISO Prolog).
- **Database**: MongoDB (via Mongoose) with automatic persistent in-memory fallback.

---

## 4. Folder Structure

```
fairqueue/
├── logic/
│   └── fairqueue.pl            # Pure Prolog Knowledge Base (facts, rules, ordering, cuts)
├── server/
│   ├── config/
│   │   └── db.js               # MongoDB connection with graceful local fallback
│   ├── controllers/
│   │   ├── analyzeController.js# Runs Prolog reasoning & pairwise comparison
│   │   ├── analysisController.js# Retrieves historical analysis snapshots
│   │   ├── personController.js # CRUD for queue members & sample demo seeding
│   │   ├── rulesController.js  # Rule catalog & threshold configuration
│   │   └── statusController.js # Engine and DB health status
│   ├── data/
│   │   └── demoData.js         # 8 realistic demo cases showcasing all rules
│   ├── models/
│   │   ├── Analysis.js         # Mongoose schema for historical analyses
│   │   ├── Person.js           # Mongoose schema for queue persons
│   │   └── RuleConfig.js       # Mongoose schema for configurable thresholds
│   ├── routes/
│   │   ├── analyzeRoutes.js    # /api/analyze, /api/analyze/compare
│   │   ├── analysisRoutes.js   # /api/analyses
│   │   ├── personRoutes.js     # /api/people
│   │   ├── rulesRoutes.js      # /api/rules
│   │   └── statusRoutes.js     # /api/status
│   ├── services/
│   │   ├── dbService.js        # Persistence abstraction layer
│   │   └── prologService.js    # Fact compiler, SWI-Prolog child process & Tau-Prolog bridge
│   ├── test_prolog.js          # Direct CLI test for fairqueue.pl
│   ├── test_api.js             # Integration test for backend and reasoning
│   ├── .env                    # Environment variables
│   ├── .env.example            # Example configuration
│   ├── package.json            # Server dependencies
│   └── server.js               # Express application entry point & static client host
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Badges.jsx      # Priority, Urgency, Appointment & Special badges
│   │   │   └── Navbar.jsx      # Sticky navbar with engine status indicators
│   │   ├── pages/
│   │   │   ├── AddPersonPage.jsx      # Validated form with 4 1-click rule presets
│   │   │   ├── AnalyzePage.jsx        # Core page: logic pipeline & fact inspector
│   │   │   ├── DashboardPage.jsx      # Metrics overview & recommended queue cards
│   │   │   ├── DecisionDetailsPage.jsx# Deep explainability & Pairwise Comparison tool
│   │   │   ├── HistoryPage.jsx        # Historical analysis snapshots viewer
│   │   │   ├── QueuePage.jsx          # Search, filter, sort & delete confirmation
│   │   │   ├── RulesPage.jsx          # Horn clause catalog & threshold editor
│   │   │   └── VivaGuidePage.jsx      # Academic viva preparation guide
│   │   ├── services/
│   │   │   └── api.js          # REST client wrapper
│   │   ├── App.jsx             # Main React application
│   │   ├── index.css           # Tailwind CSS directives & custom fonts
│   │   └── main.jsx            # React root mount
│   ├── index.html              # HTML shell
│   ├── package.json            # Client dependencies
│   ├── tailwind.config.js      # Tailwind design system configuration
│   └── vite.config.js          # Vite config with /api proxy
├── package.json                # Root package for convenient npm scripts
└── README.md                   # Complete academic documentation
```

---

## 5. Installation & Setup

### Prerequisites
1. **Node.js**: v18.0.0 or higher (`node -v`)
2. **npm**: v9.0.0 or higher (`npm -v`)
3. **SWI-Prolog** *(Recommended for native CLI execution)*:
   - **macOS**: `brew install swi-prolog`
   - **Ubuntu/Debian**: `sudo apt install swi-prolog`
   - **Windows**: Download from [swi-prolog.org](https://www.swi-prolog.org/download/stable)
   > *Note: If SWI-Prolog is not installed, FAIRQUEUE automatically uses its embedded ISO Tau-Prolog engine so the project runs out of the box with zero setup!*
4. **MongoDB** *(Optional)*:
   - **macOS**: `brew services start mongodb-community`
   - **Docker**: `docker run -d -p 27017:27017 --name mongo mongo:latest`
   > *Note: If MongoDB is offline, FAIRQUEUE automatically switches to its in-memory storage mode.*

### Installation Steps

1. **Clone or Navigate to the project directory**:
   ```bash
   cd /Users/shivani/.gemini/antigravity/scratch/fairqueue
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Build Frontend**:
   ```bash
   npm run build
   ```

---

## 6. How to Run the Application

### Option A: Unified Server (Recommended)
Because the Express backend serves the built React frontend directly, you can run the entire application with a single command:

```bash
cd server
npm start
```
Now open your web browser at:
👉 **`http://localhost:5001`**

### Option B: Development Mode (Hot Reloading)
To run frontend and backend independently with Vite hot module replacement:

1. **Terminal 1 (Backend)**:
   ```bash
   cd server
   npm run dev
   ```
   *(Runs backend at `http://localhost:5001`)*

2. **Terminal 2 (Frontend)**:
   ```bash
   cd client
   npm run dev
   ```
   *(Runs Vite dev server at `http://localhost:5173` with proxy to backend)*

---

## 7. How the Prolog Reasoning Works

In `logic/fairqueue.pl`, the problem is modeled declaratively:

### 1. Facts Representation
A person is represented as a 7-ary predicate:
```prolog
person(Id, Name, WaitingTime, Urgency, AppointmentStatus, SpecialRequirement, ArrivalTime).
```
Thresholds are represented as 2-ary facts:
```prolog
threshold(critical_wait, 60).
threshold(long_wait, 30).
threshold(vulnerable_wait, 20).
threshold(moderate_wait, 15).
```

### 2. Multi-Factor Horn Clauses
Each rule defines conditions for priority assignment and generates an auditable text explanation:
```prolog
rule_applies(Id, RuleCode, PriorityTier, ShortSummary, Explanation)
```

### 3. Deductive Priority Synthesis
```prolog
deduce_priority(Rules, high) :-
    member(rule_entry(_, high, _, _), Rules), !.
deduce_priority(Rules, medium) :-
    member(rule_entry(_, medium, _, _), Rules), !.
deduce_priority(_, normal).
```
The **Cut (`!`)** operator prevents unnecessary backtracking once the highest priority tier is satisfied.

### 4. Deterministic Precedence & Tie-Breaking
Queue ranking uses explicit precedence logic (`precedes/3`):
1. **Priority Tier**: High (weight 3) precedes Medium (weight 2) precedes Normal (weight 1).
2. **Wait Time Tie-Breaker**: If priorities are equal, the person who has waited longer goes first.
3. **Arrival Time Tie-Breaker**: If wait times are equal, the person who arrived earlier goes first (FIFO).
4. **Deterministic ID Fallback**: If all else is identical, alphanumeric ID breaks the tie.

---

## 8. Catalog of Explicit Logical Rules

| Rule Identifier | Tier | Condition | Fairness Rationale |
|---|---|---|---|
| `emergency_special_need` | **HIGH** | `SpecialRequirement == emergency` | Immediate medical risk overrides all wait times. |
| `high_urgency_priority` | **HIGH** | `Urgency == high` | Fast-tracks acute conditions to prevent clinical deterioration. |
| `critical_wait_priority` | **HIGH** | `WaitingTime >= critical_wait` (60m) | **Starvation Prevention**: Guarantees low-urgency visitors are never delayed indefinitely. |
| `vulnerable_long_wait` | **HIGH** | `(elderly ; disability) AND Wait >= 20m` | Social equity protection for physically vulnerable visitors. |
| `high_urgency_long_wait` | **HIGH** | `Urgency == high AND Wait >= 30m` | Compound severity rule combining urgency with accumulated delay. |
| `scheduled_sla_breach` | **HIGH** | `Status == scheduled AND Wait >= 30m` | Upholds organizational commitments for booked appointments. |
| `medium_urgency_wait` | **MEDIUM** | `Urgency == medium AND Wait >= 15m` | Balanced progression for semi-urgent conditions. |
| `scheduled_appointment` | **MEDIUM** | `Status == scheduled` | Gives advance-booked visitors priority over routine walk-ins. |
| `vulnerable_group` | **MEDIUM** | `SpecialRequirement in [elderly, disability]` | Baseline accommodation for vulnerable groups. |
| `moderate_wait_priority` | **MEDIUM** | `WaitingTime >= moderate_wait` (15m) | Recognizes accumulated wait time for standard visitors. |
| `normal_queue_progression` | **NORMAL** | Baseline default | Standard First-Come First-Served progression. |

---

## 9. Example Input & Output

### Input Queue Facts:
```prolog
person('P001', 'Anjana Devi', 45, high, scheduled, disability, '08:45').
person('P002', 'Carlos Mendez', 12, high, walkin, emergency, '09:18').
person('P003', 'Beatrice Vance', 68, low, scheduled, elderly, '08:22').
person('P004', 'Avanish Sharma', 32, medium, walkin, none, '08:58').
person('P007', 'Fatima Al-Mansoor', 8, low, walkin, none, '09:22').
```

### Resulting Prioritized Queue (Prolog Output):
1. **Rank #1: Beatrice Vance (P003)** — `HIGH PRIORITY` (Wait: 68m)  
   *Reason*: Waiting time of 68 min exceeds critical fairness limit of 60 min (Starvation Prevention).
2. **Rank #2: Anjana Devi (P001)** — `HIGH PRIORITY` (Wait: 45m)  
   *Reason*: High medical urgency + Vulnerable group wait + Scheduled SLA breach.
3. **Rank #3: Carlos Mendez (P002)** — `HIGH PRIORITY` (Wait: 12m)  
   *Reason*: Emergency special need detected.
4. **Rank #4: Avanish Sharma (P004)** — `MEDIUM PRIORITY` (Wait: 32m)  
   *Reason*: Medium urgency with moderate wait time accumulated.
5. **Rank #5: Fatima Al-Mansoor (P007)** — `NORMAL PRIORITY` (Wait: 8m)  
   *Reason*: Standard queue progression.

### Pairwise Comparison Example:
Query: `compare_pair('P003', 'P001', Winner, Loser, Reason).`  
Output:
```
Winner = 'P003' (Beatrice Vance)
Loser  = 'P001' (Anjana Devi)
Reason = Both have high priority, but Beatrice Vance has waited longer (68 min vs 45 min).
```

---

## 10. Academic Presentation & Viva Guide

During your college viva or project presentation, you can demonstrate the following **Programming Paradigms** concepts:

### Key Viva Questions & Explanations

#### 1. What makes this a Logic Programming project rather than a typical CRUD web app?
> **Answer**: In a typical CRUD app, business logic is embedded inside procedural JavaScript `if/else` statements or numeric weight formulas. In FAIRQUEUE, **all prioritization decisions and explanations are executed inside a First-Order Logic Knowledge Base (`logic/fairqueue.pl`)**. JavaScript only acts as a thin communication bridge. If you modify the Prolog clauses, the behavior changes declaratively without changing a line of JS.

#### 2. What is Unification? Show an example from your project.
> **Answer**: Unification is Prolog's algorithm to make two terms identical by binding variables. When evaluating:
> ```prolog
> rule_applies(Id, high_urgency_priority, high, ...) :- person(Id, _, _, high, _, Spec, _), Spec \== emergency.
> ```
> Prolog unifies the variable `Id` with `'P001'` and `Spec` with `disability`. Since the 4th argument unifies with the atom `high` and `Spec` is not `emergency`, the subgoal succeeds.

#### 3. What is Resolution and Backward Chaining?
> **Answer**: FAIRQUEUE uses **SLD Resolution**. When the query `?- rank_all_people(RankedList)` is issued, Prolog treats it as a goal to prove. It searches for matching clause heads, generates subgoals for person facts and threshold facts, recursively evaluates precedence, and produces variable bindings for `RankedList`.

#### 4. Why is the Cut (`!`) operator necessary?
> **Answer**: In `deduce_priority/2`, the cut operator prunes the SLD search tree once a high priority rule is found. Without the cut, if a high priority candidate had medium rules as well, Prolog would backtrack and redundantly evaluate alternate branches.

#### 5. How does FAIRQUEUE achieve Explainable AI (XAI)?
> **Answer**: Neural networks and complex scoring algorithms are black boxes. In FAIRQUEUE, every decision links back to explicit Horn clauses. Each candidate receives a list of triggered rule codes and natural-language proofs, allowing patients and auditors to verify that rules were applied equitably.

---

## 11. Files Created in this Project

| File Path | Description | Must Understand for Viva? |
|---|---|:---:|
| `logic/fairqueue.pl` | Pure Prolog Knowledge Base (facts, rules, precedence, cuts) | **YES (Crucial)** |
| `server/services/prologService.js` | Translates queue data into facts & executes Prolog query | **YES** |
| `server/services/dbService.js` | Database abstraction (MongoDB + local fallback) | No |
| `server/controllers/analyzeController.js` | API controller invoking Prolog analysis & pairwise query | **YES** |
| `server/controllers/personController.js` | API controller for managing queue persons & demo seed | No |
| `server/controllers/rulesController.js` | Returns rule definitions and updates thresholds | No |
| `server/models/` | Mongoose schemas for Person, Analysis, and RuleConfig | No |
| `server/server.js` | Express server entry point & static frontend server | No |
| `client/src/pages/AnalyzePage.jsx` | UI for running analysis & inspecting dynamic facts | **YES** |
| `client/src/pages/DecisionDetailsPage.jsx`| UI for rule proofs & pairwise comparison tool | **YES** |
| `client/src/pages/RulesPage.jsx` | UI for rule catalog and threshold editor | No |
| `client/src/pages/VivaGuidePage.jsx` | In-app viva study sheet | **YES** |

---

## 12. Limitations & Future Enhancements

### Current Limitations:
- The system currently operates on batch queue snapshots rather than real-time WebSocket streams.
- The rule base covers medical/outpatient triage; enterprise queuing (banking, air traffic) would require domain-specific predicates.

### Future Enhancements:
- **WebSocket Live Stream**: Push real-time queue position updates as new arrivals enter.
- **Dynamic Rule Ingestion**: Allow users to write and assert new Prolog clauses directly from a web IDE editor.
- **Multi-Server Multi-Queue**: Extend predicates to handle multiple service counters with varying service times.
