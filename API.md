# FAIRQUEUE REST API Reference
> **Complete Enterprise Endpoint Documentation**

---

## 1. Authentication & RBAC

### `POST /api/auth/login`
Authenticates a user using email and PBKDF2-hashed password.
- **Request Body**:
  ```json
  {
    "email": "manager@citycare.gov",
    "password": "Manager@123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Welcome back, Sarah Jenkins.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "usr-mgr-01",
      "email": "manager@citycare.gov",
      "name": "Sarah Jenkins",
      "role": "QUEUE_MANAGER",
      "organizationId": "org-citycare",
      "title": "Queue Operations & Policy Manager"
    }
  }
  ```

### `POST /api/auth/demo-switch`
Instant RBAC persona switcher for evaluators and demonstrations.
- **Request Body**:
  ```json
  {
    "role": "ADMIN"
  }
  ```
- **Valid Roles**: `ADMIN`, `QUEUE_MANAGER`, `OPERATOR`, `VIEWER`.

### `GET /api/auth/me`
Retrieves profile for active session token. Requires `Authorization: Bearer <token>`.

---

## 2. Multi-Queue Management

### `GET /api/queues`
Lists all active enterprise queues for the organization with live waiting/service metrics.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 3,
    "data": [
      {
        "queueId": "q-citizen",
        "name": "Citizen Services & Healthcare Desk",
        "prefix": "CS",
        "department": "Public Health & Welfare",
        "targetServiceMinutes": 10,
        "activeRuleVersion": "v1.0",
        "counts": {
          "total": 8,
          "waiting": 6,
          "inService": 2,
          "completed": 0
        }
      }
    ]
  }
  ```

### `POST /api/queues`
Provisions a new queue desk. Authorized for `ADMIN` role only.

---

## 3. Queue Entries & State Machine Transitions

### `GET /api/queues/:queueId/entries`
Retrieves tickets in the queue, ordered by Prolog recommended rank.
- **Query Parameters**:
  - `status`: Filter by state (`WAITING`, `CALLED`, `IN_SERVICE`, `COMPLETED`, `all`).

### `POST /api/queues/:queueId/entries`
Registers a new visitor ticket into state `WAITING`.
- **Request Body**:
  ```json
  {
    "name": "Anjana AS",
    "waitingTime": 68,
    "urgency": "high",
    "appointmentStatus": "scheduled",
    "specialRequirement": "elderly",
    "arrivalTime": "09:12"
  }
  ```

### `POST /api/queues/:queueId/entries/call-next`
Calls the top recommended waiting person to the counter.
- **Role Requirement**: `ADMIN`, `QUEUE_MANAGER`, `OPERATOR`.
- **Response** (`200 OK`): Returns entry with `status: "CALLED"`, `calledAt`, and `servedBy`.

### `PATCH /api/queues/:queueId/entries/:entryId/status`
Executes an explicit workflow state machine transition.
- **Request Body**:
  ```json
  {
    "status": "IN_SERVICE"
  }
  ```
- **Valid Status Values**: `WAITING`, `CALLED`, `IN_SERVICE`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.

### `POST /api/queues/:queueId/entries/:entryId/override`
Applies a controlled manual priority override with a mandatory justification reason.
- **Role Requirement**: `ADMIN`, `QUEUE_MANAGER`.
- **Request Body**:
  ```json
  {
    "newPriority": "high",
    "overrideReason": "Clinical triage nurse escalation: acute respiratory distress observed at reception."
  }
  ```
- **Response** (`200 OK`): Returns entry with `isOverridden: true`, new priority, and `overrideDetails`.

---

## 4. Prolog Reasoning & Inference

### `POST /api/analyze?queueId=:queueId`
Executes the pure Prolog Horn clause knowledge base (`logic/fairqueue.pl`) across active tickets.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Queue analyzed and fairly prioritized using Prolog rule engine.",
    "analysisId": "ANL-1727885000000-842",
    "executionTimeMs": 24,
    "engineUsed": "SWI-Prolog (Native CLI) | Tau-Prolog (ISO)",
    "stats": {
      "totalPeople": 8,
      "highPriorityCount": 5,
      "mediumPriorityCount": 2,
      "normalPriorityCount": 1,
      "averageWaitTime": 42
    },
    "rankedQueue": [
      {
        "personId": "P005",
        "name": "Dr. Beatrice Vance",
        "waitingTime": 75,
        "priority": "high",
        "ruleCodes": ["critical_wait_priority", "vulnerable_long_wait", "normal_queue_progression"],
        "explanation": "High priority: waiting time (75 min) reached critical threshold (60 min) to prevent starvation; vulnerable individual with prolonged wait (75 min >= 20 min)."
      }
    ],
    "prologFactsUsed": "person('P005', 'Dr. Beatrice Vance', 75, ...).\nthreshold(critical_wait, 60)..."
  }
  ```

### `POST /api/analyze/compare`
Evaluates the `compare_pair/5` predicate to explain pairwise ordering between any two individuals.
- **Request Body**:
  ```json
  {
    "personIdA": "P001",
    "personIdB": "P004"
  }
  ```

---

## 5. Audit Trail & Operational Reports

### `GET /api/audit`
Queries the immutable operational audit log.
- **Query Parameters**: `queueId`, `eventType`, `search`.

### `GET /api/audit/export`
Streams the entire compliance log as a downloadable JSON file attachment.

### `GET /api/reports?queueId=:queueId&timeRange=today`
Generates comprehensive operational throughput and fairness metrics.
- **Response** (`200 OK`):
  ```json
  {
    "success": true,
    "data": {
      "queueId": "q-citizen",
      "metrics": {
        "totalRegistered": 8,
        "totalWaiting": 6,
        "totalInService": 2,
        "totalCompleted": 0,
        "totalOverrides": 1,
        "averageWaitMinutes": 42,
        "longestWaitMinutes": 75,
        "waitBeyondCriticalThreshold": 2
      },
      "priorityDistribution": { "high": 5, "medium": 2, "normal": 1 },
      "ruleUsageDistribution": {
        "critical_wait_priority": 2,
        "vulnerable_long_wait": 3,
        "normal_queue_progression": 8
      },
      "disclaimer": "These metrics describe empirical queue behaviour; they do not constitute a universal mathematical fairness guarantee."
    }
  }
  ```
