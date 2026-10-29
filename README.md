# CareQueue V2 — Hospital Patient Queue Management System
### College Data Structures and Algorithms (DSA) Full-Stack Project Manual
**Technology Stack:** Java 21 · Spring Boot 3.3.5 · Next.js 14 · TypeScript · PostgreSQL · H2 · Tailwind CSS · Dark Mode · Docker

---

## Table of Contents

- [Section 1 — Project Overview & What's New in V2](#section-1--project-overview--whats-new-in-v2)
- [Section 2 — System Architecture & Workflow](#section-2--system-architecture--workflow)
- [Section 3 — DSA Concepts & Implementation Proofs](#section-3--dsa-concepts--implementation-proofs)
- [Section 4 — Department-Specific Daily Token System](#section-4--department-specific-daily-token-system)
- [Section 5 — Smart Registration & Similarity Detection](#section-5--smart-registration--similarity-detection)
- [Section 6 — Patient Registry & Database Management](#section-6--patient-registry--database-management)
- [Section 7 — Design System, Dark Mode & UI Manual](#section-7--design-system-dark-mode--ui-manual)
- [Section 8 — Backend and REST API Reference](#section-8--backend-and-rest-api-reference)
- [Section 9 — Database Schema, Concurrency & Migration](#section-9--database-schema-concurrency--migration)
- [Section 10 — Environment Variables & Configuration](#section-10--environment-variables--configuration)
- [Section 11 — How to Run the System Locally](#section-11--how-to-run-the-system-locally)
- [Section 12 — Testing Manual & Automated Test Results](#section-12--testing-manual--automated-test-results)
- [Section 13 — Deployment Manual (Vercel & Render)](#section-13--deployment-manual-vercel--render)
- [Section 14 — Troubleshooting Guide](#section-14--troubleshooting-guide)
- [Section 15 — Viva and Project Demonstration](#section-15--viva-and-project-demonstration)

---

## Section 1 — Project Overview & What's New in V2

### 1.1 What CareQueue Does
**CareQueue** is a full-stack, enterprise-grade hospital patient queue management system designed for outpatient departments (OPDs), triage reception desks, and consultation rooms.

In high-volume hospital environments, overcrowding, lack of transparency in waiting order, and manual paper-ticket confusion create frustration for patients and medical receptionists. CareQueue solves this problem by automating the patient lifecycle:

1. **Patient Registration:** Hospital receptionists register incoming patients with name, department, age, and optional visit notes.
2. **Predictable Department Token Assignment:** The backend generates daily department-specific queue tokens formatted as `PREFIX-NNN` (e.g., `GEN-001`, `CRD-001`, `PED-001`, `DER-001`).
3. **Strict FIFO Queue Management:** Patients enter the queue in First-In, First-Out order managed by a **custom singly linked list queue** (`LinkedPatientQueue`).
4. **Live Call Execution:** Doctors or triage nurses call the next patient in line. The call dequeues the head node, transitions status to `CALLED`, and records the call timestamp.
5. **Call History & Repeat Announcements:** Successfully called patients are pushed onto a **custom generic linked stack** (`RecentCallsStack<T>`). The latest announcement can be repeated anytime via stack `peek()`, accompanied by optional browser speech synthesis.
6. **Consultation Completion & Safe Cancellation:** Patients who finish consultation are marked `COMPLETED`. Unattended patients who leave before consultation can be confirmed and marked `CANCELLED`.
7. **Persistent State Synchronization:** The database preserves records across backend restarts. On boot, the service reconstructs both the FIFO linked-list queue and the LIFO recent-calls stack from PostgreSQL records.

---

### 1.2 What's New in CareQueue V2
CareQueue V2 represents a complete upgrade across design, database architecture, queue numbering, and patient records:

| Feature Area | CareQueue V1 | CareQueue V2 Upgrade |
|---|---|---|
| **Theme System** | Light theme only | **Complete Dark Mode** (Light / Dark / System preference) with persistent `localStorage` and zero-flash inline script |
| **Token Numbering** | Global sequential numbers (e.g., `GEN-106`, `DER-108`) | **Department-specific daily counters** (`PREFIX-001`, `PREFIX-002`) resetting daily at midnight in `Asia/Kolkata` with pessimistic write-locking concurrency |
| **Patient Registration** | Standard form submission without duplicate checking | **Smart Registration** with debounced (~300ms) **Existing-Patient Similarity Detection** (Levenshtein distance, whitespace normalization, case-folding, bounded to top 5 matches) and duplicate confirmation prompts |
| **Patient Records** | Simple client-side filtered list | **Full-width Patient Registry** with real **server-side pagination** (10, 25, 50 rows), multi-field database search, status/department/date filters, sorting, and detail view modal |
| **UI Cleanliness** | Decorative "DSA Under the Hood" card and redundant technical text | **Streamlined healthcare SaaS interface** focused on hospital operations; educational DSA proofs moved cleanly to `README.md` |
| **Typography Scale** | Small, cramped labels (12-14px) | **Expanded healthcare typography hierarchy** (Headings 28–32px, Body 16px, Table 15–16px, Tokens 30–40px, Stats 30–36px) |
| **Data Initialization** | Hardcoded demo patients on every start | **Opt-in demo data** (`carequeue.seed-demo-data: false` default), production-ready empty state handling, and safe demo cleanup scripts |
| **Test Coverage** | 47 backend / 13 frontend tests | **62 backend JUnit/Mockito tests** + **18 frontend Vitest tests** covering tokens, similarity algorithms, and pagination |

---

### 1.3 Technology Stack

| Layer | Technologies | Version / Notes |
|---|---|---|
| **Backend Core** | Java 21 LTS, Maven 3.9+ | Modern LTS release with records, pattern matching, and Virtual Thread readiness |
| **Backend Framework** | Spring Boot 3.3.5, Spring Web, Spring Data JPA | REST API, Hibernate ORM, Bean Validation |
| **DSA Package** | Custom `LinkedPatientQueue`, `RecentCallsStack<T>`, `StringUtil` | **0% standard library collection shortcuts** for core queue and stack |
| **Database & Migrations** | PostgreSQL 16 (H2 file/memory fallback), Flyway | Flyway schema migrations `V1__init_schema.sql` and `V2__department_daily_tokens.sql` |
| **Frontend Framework** | Next.js 14.2 (App Router), React 18 | TypeScript strict mode, server-side pre-rendering |
| **Styling & Theme** | Tailwind CSS 3.4, Vanilla CSS variables, Lucide React | Modern healthcare SaaS design system: deep navy/charcoal dark mode, teal accents |
| **Form Handling & Validation** | React Hook Form, Zod schema validation | Real-time debounced similarity lookups, client-side character bounding |
| **Testing Suite** | JUnit 5, Mockito, SpringBootTest, MockMvc, Vitest, React Testing Library | 100% automated test execution on every build |

---

## Section 2 — System Architecture & Workflow

The following flowchart documents the complete patient lifecycle, similarity validation, queue execution, and stack synchronization:

```mermaid
flowchart TD
    A([Patient Arrives at Reception]) --> B[Staff Opens Registration Dialog]
    B --> C[Staff Types Patient Full Name]
    
    C --> D{Debounced Search ~300ms\nGET /api/patients/similar}
    D -- Matches Found --> E[Display Possible Existing Records Card\nTop 5 Bounded Matches]
    E --> F{Staff Review}
    F -- Active WAITING Match Found --> G[Display Warning & Require Explicit Confirmation]
    F -- Legitimate New Patient --> H[Proceed with Registration]
    D -- No Matches --> H
    
    H --> I[Submit Registration\nPOST /api/patients]
    I --> J{Spring Boot Transaction\n@Transactional}
    
    J --> K[DepartmentTokenService.getNextToken\nAtomic Row-Locking SELECT FOR UPDATE]
    K --> L[Generate Daily Token e.g. GEN-001\nAsia/Kolkata Calendar Date]
    L --> M[(Insert into PostgreSQL\npatients + department_daily_tokens)]
    M --> N[LinkedPatientQueue.enqueue\nTail Insertion O(1)]
    N --> O[Refresh Dashboard & Waiting Queue UI]
    
    O --> P{Doctor or Triage Nurse Action}
    
    P -- Cancel Ticket --> Q[Confirm Cancellation Modal]
    Q --> R[LinkedPatientQueue.removeById\nSingly Linked Deletion O(n)]
    R --> S[(Update DB status = CANCELLED)]
    S --> T[Remove from Waiting View]
    
    P -- Call Next Patient --> U[LinkedPatientQueue.dequeue\nHead Removal O(1)]
    U --> V[(Update DB status = CALLED\nRecord calledTime)]
    V --> W[RecentCallsStack.push\nTop Insertion O(1)]
    W --> X[Display in Consultation Panel\nTrigger Voice Announcement]
    
    X --> Y{Consultation Outcome}
    Y -- Repeat Announcement --> Z[RecentCallsStack.peek\nO(1) Inspection - No State Mutation]
    Z --> X
    
    Y -- Mark Consultation Completed --> AA[Confirm Completion Modal]
    AA --> AB[(Update DB status = COMPLETED\nRecord completedTime)]
    AB --> AC[Update Real Daily Statistics\nRecalculate Average Wait Time]
```

---

## Section 3 — DSA Concepts & Implementation Proofs

CareQueue strictly fulfills academic DSA requirements through self-contained Java source files. No standard library collection shortcuts (such as `java.util.LinkedList`, `java.util.Queue`, or `java.util.Stack`) are used for queue and stack mechanics.

### 3.1 The First-In, First-Out (FIFO) Queue
A Queue is a linear collection governed by the principle that the first element added is the first element removed. In a hospital waiting room, fairness dictates that the patient who registered earliest must be attended to before subsequent arrivals.

#### Node Structure and Pointers
`com.carequeue.dsa.LinkedPatientQueue` manages a singly linked list with two external pointers:
- `head`: Points to the front of the queue (the patient who has waited longest).
- `tail`: Points to the end of the queue (the most recently registered patient).
- `size`: An integer maintaining the exact count of waiting patients.

```
       [ Head ]                                           [ Tail ]
          │                                                  │
          ▼                                                  ▼
      ┌───────────┐      ┌───────────┐      ┌───────────┐
      │ Patient 1 │ ───► │ Patient 2 │ ───► │ Patient 3 │ ───► null
      │ (GEN-001) │ next │ (DER-001) │ next │ (GEN-002) │ next
      └───────────┘      └───────────┘      └───────────┘
```

#### Actual Java Source Code: `enqueue` and `dequeue`
```java
// Location: backend/src/main/java/com/carequeue/dsa/LinkedPatientQueue.java

public synchronized void enqueue(Patient patient) {
    Objects.requireNonNull(patient, "Patient cannot be null when enqueueing.");
    Node newNode = new Node(patient);

    if (isEmpty()) {
        head = newNode;
        tail = newNode;
    } else {
        tail.next = newNode;
        tail = newNode;
    }
    size++;
}

public synchronized Patient dequeue() {
    if (isEmpty()) {
        throw new QueueEmptyException("Cannot dequeue from an empty queue.");
    }

    Patient dequeuedPatient = head.patient;
    head = head.next;
    size--;

    if (size == 0) {
        // Queue is now empty; reset tail pointer to maintain invariant
        head = null;
        tail = null;
    }

    return dequeuedPatient;
}
```

#### Safe Middle / Tail Node Removal (`removeById`)
When a waiting patient cancels their visit, they may be located anywhere in the linked list. `removeById(String patientId)` traverses the chain using two pointers (`prev` and `current`):
- If target is at `head`, `head` advances to `head.next`.
- If target is at `tail`, `tail` points to `prev`.
- If target is between two nodes, `prev.next = current.next`, splicing out the node cleanly.
- If queue had only 1 patient, both `head` and `tail` reset to `null`.

---

### 3.2 The Last-In, First-Out (LIFO) Stack
A Stack is a linear collection where insertions and removals occur at the same endpoint, called the `top`.

In CareQueue, calling the next patient pushes their record onto `RecentCallsStack<T>`. This allows hospital staff to see which patient was called most recently and repeat announcements.

```
                [ Top ]
                   │
                   ▼
             ┌───────────┐
             │ Patient 3 │ (Called at 10:15) - Newest
             └─────┬─────┘
                   │ next
                   ▼
             ┌───────────┐
             │ Patient 2 │ (Called at 10:05)
             └─────┬─────┘
                   │ next
                   ▼
             ┌───────────┐
             │ Patient 1 │ (Called at 09:50) - Oldest
             └─────┬─────┘
                   │ next
                   ▼ null
```

#### Why `peek()` is Appropriate for Repeating an Announcement
Calling `pop()` would remove the patient from history. However, repeating an announcement simply needs to inspect who is currently at the top of the stack without modifying history. Therefore, `peek()` is O(1) constant time, non-destructive, and idempotent:

```java
// Location: backend/src/main/java/com/carequeue/dsa/RecentCallsStack.java

public synchronized T peek() {
    if (isEmpty()) {
        throw new StackEmptyException("Cannot peek into an empty stack.");
    }
    return top.item;
}
```

---

### 3.3 Dynamic Programming Levenshtein Distance & Similarity Search
In `com.carequeue.service.PatientSimilarityService`, CareQueue applies dynamic programming string similarity algorithms to protect registration desks from accidental duplicates:

1. **Whitespace Normalization:** Redundant repeated spaces are collapsed (`name.replaceAll("\\s+", " ").trim()`).
2. **Case Normalization:** `name.toLowerCase(Locale.ROOT)` eliminates casing differences.
3. **Exact & Substring Matching:** Fast-path exact and substring checks identify variations like "Maya" vs "Maya Lin".
4. **Levenshtein Distance Dynamic Programming Matrix:**
   Computes the minimum edit operations (insertions, deletions, substitutions) required to transform string $s_1$ into $s_2$:
   $$D(i, j) = \min \begin{cases} 
   D(i-1, j) + 1 & \text{(deletion)} \\
   D(i, j-1) + 1 & \text{(insertion)} \\
   D(i-1, j-1) + \text{cost} & \text{(substitution)}
   \end{cases}$$
5. **Contextual Score Bounding:** Candidates are scored between 0.0 and 1.0 based on edit distance, substring overlap, and matching department/age. Results are strictly bounded to the top 5 matches.

---

### 3.4 Complexity Analysis Table

| Component | Operation | Time Complexity | Space Complexity | Rationale & Code Invariant |
|---|---|---|---|---|
| **LinkedPatientQueue** | `enqueue()` | **O(1)** | O(1) | Pointer assignment directly at `tail.next = newNode; tail = newNode;` |
| **LinkedPatientQueue** | `dequeue()` | **O(1)** | O(1) | Head pointer advancement: `head = head.next;` |
| **LinkedPatientQueue** | `peek()` | **O(1)** | O(1) | Reads `head.patient` directly without traversing nodes |
| **LinkedPatientQueue** | `size()` / `isEmpty()` | **O(1)** | O(1) | Maintained via integer counter incremented/decremented on mutations |
| **LinkedPatientQueue** | `findById()` | **O(n)** | O(1) | Linear traversal from `head` checking `patientId.equals(...)` |
| **LinkedPatientQueue** | `removeById()` | **O(n)** | O(1) | Linear traversal with two pointers to splice the target node |
| **LinkedPatientQueue** | `snapshot()` | **O(n)** | O(n) | Traverses all nodes to build an unmodifiable snapshot list |
| **RecentCallsStack** | `push()` | **O(1)** | O(1) | Prepends to `top`: `this.top = new Node<>(item, this.top);` |
| **RecentCallsStack** | `pop()` | **O(1)** | O(1) | Removes from `top`: `this.top = this.top.next;` |
| **RecentCallsStack** | `peek()` | **O(1)** | O(1) | Direct read of `top.item` |
| **RecentCallsStack** | `toListNewestFirst()` | **O(n)** | O(n) | Traverses top-to-bottom yielding LIFO sequence snapshot |
| **PatientSimilarityService**| `calculateLevenshtein()`| **O(m · n)** | O(m · n) | 2D dynamic programming edit distance matrix computation |
| **DepartmentTokenService** | `getNextToken()` | **O(1)** | O(1) | Pessimistic write-locked index lookup on `(queue_date, department_code)` |

---

## Section 4 — Department-Specific Daily Token System

In CareQueue V2, tokens are generated through a centralized, department-specific daily numbering system.

### 4.1 Token Format
`PREFIX-NNN`

- Prefix: 3-letter uppercase department code.
- Sequence: 3-digit zero-padded number starting at `001` each day.

#### Department Mapping Table
| Department Name | Prefix Code | First Token of Day |
|---|---|---|
| General Medicine | `GEN` | `GEN-001` |
| Dermatology | `DER` | `DER-001` |
| Pediatrics | `PED` | `PED-001` |
| Orthopedics | `ORT` | `ORT-001` |
| Cardiology | `CRD` | `CRD-001` |
| Emergency | `EMG` | `EMG-001` |

*(Any unrecognized department safely defaults to `GEN`)*.

### 4.2 Daily Reset & Timezone Invariant
1. Sequence numbers reset to `001` at `00:00:00` in the **`Asia/Kolkata`** timezone (`ZoneId.of("Asia/Kolkata")`).
2. Even if the backend server runs in UTC or another timezone, the queue date is always derived in `Asia/Kolkata`:
   ```java
   LocalDate queueDate = LocalDate.now(ZoneId.of("Asia/Kolkata"));
   ```
3. Tokens are never reused on the same date: even if `GEN-001` is completed or cancelled, the next patient receives `GEN-002`.
4. While tokens are department-specific, queue processing remains strictly FIFO across the whole hospital based on registration timestamp.

---

## Section 5 — Smart Registration & Similarity Detection

To prevent accidental duplicate registrations (e.g., receptionists re-registering an already waiting patient), CareQueue V2 features real-time similarity detection.

### 5.1 Registration Workflow
1. When entering a patient name with 2 or more characters, the input is debounced by 300ms.
2. The frontend queries `GET /api/patients/similar?name=...&department=...&age=...`.
3. If matches are found, a **"Possible existing records"** warning panel appears above the submit button.
4. If an existing record is in **`WAITING`** status, the system flags an **Active Queue Duplicate** and asks staff to confirm whether they genuinely want to register another patient with the same name.
5. Staff can click **"View Details"** to inspect the existing patient's historical visit record before submitting.

### 5.2 Technical Safeguards
- Non-blocking: Legitimate patients with identical names can still be registered upon confirmation.
- Privacy-preserving: Clinical notes and sensitive information are never displayed in the similarity panel.
- Bounded: The backend returns at most the 5 highest-confidence matches.

---

## Section 6 — Patient Registry & Database Management

The Patient Registry (`/registry`) provides full visibility across all historical hospital records.

### 6.1 Server-Side Pagination & Filtering
- **Endpoint:** `GET /api/patients/paged`
- **Page Sizes:** 10, 25, or 50 records per page.
- **Search:** Case-insensitive substring match across name, token number, and department.
- **Filters:** Status pills (`ALL`, `WAITING`, `CALLED`, `COMPLETED`, `CANCELLED`), Department dropdown, and Date Range.
- **Sorting:** Sort by `registrationTime`, `name`, `tokenNumber`, `department`, or `status` in `ASC` or `DESC` order.
- **Preserved Invariant:** Sorting the registry never modifies the FIFO order of the active waiting queue.

### 6.2 Patient Detail Modal
Clicking **"Details"** on any row opens a comprehensive modal displaying:
- Large queue token and current status badge.
- Patient name, age, and department.
- Registration, call, and completion timestamps.
- Visit notes.

---

## Section 7 — Design System, Dark Mode & UI Manual

### 7.1 Modern Healthcare SaaS Design System
CareQueue V2 uses a clean, professional aesthetic tailored for clinical environments:
- **Light Theme:** Cool slate-50 canvas, crisp white cards, slate-200 borders, deep navy typography.
- **Dark Theme:** Deep slate-950 canvas, slate-900 surface cards, slate-800 borders, slate-100 high-contrast typography.
- **Brand Accent:** High-contrast Teal (`teal-600` in light, `teal-500` in dark).
- **Status Colors:**
  - `WAITING`: Amber / Yellow badge.
  - `CALLED`: Blue / Sky badge.
  - `COMPLETED`: Emerald / Green badge.
  - `CANCELLED`: Rose / Red badge.

### 7.2 Complete Dark Mode & Zero-Flash Implementation
- **Theme Selector:** Located in the top bar with options: **Light**, **Dark**, and **System**.
- **Persistence:** Saved in `localStorage` under key `carequeue-theme`.
- **Zero-Flash Execution:** An inline script in `app/layout.tsx` checks `localStorage` and system media query `(prefers-color-scheme: dark)` before React hydrates, preventing any white flash on dark mode page reload.

### 7.3 Typography Scale
| Element | Font Size | Font Weight | Tailwind Class |
|---|---|---|---|
| Main Page Heading | 28–32 px | SemiBold (600) | `text-2xl sm:text-3xl font-semibold` |
| Secondary Heading | 21–24 px | SemiBold (600) | `text-xl sm:text-2xl font-semibold` |
| Section / Card Heading | 17–20 px | Medium / SemiBold | `text-lg sm:text-xl font-medium` |
| Body Text | 16 px | Regular (400) | `text-base` |
| Table Content | 15–16 px | Regular / Medium | `text-sm sm:text-base` |
| Form Labels | 14–16 px | Medium (500) | `text-sm font-medium` |
| Prominent Queue Token | 30–40 px | Bold (700) Monospace | `text-3xl sm:text-4xl font-mono font-bold` |
| Dashboard Statistics | 30–36 px | Bold (700) | `text-3xl font-bold` |

---

## Section 8 — Backend and REST API Reference

All endpoints return standard JSON payloads and appropriate HTTP status codes.

### 8.1 Health & Dashboard

#### `GET /api/health`
- **Purpose:** Service health check and current waiting count.
- **Response:** `200 OK`
```json
{
  "status": "UP",
  "service": "carequeue-backend",
  "version": "2.0.0",
  "waitingCount": 3
}
```

#### `GET /api/dashboard/stats`
- **Purpose:** Real-time analytics computed from start of local day (`Asia/Kolkata`).
- **Response:** `200 OK`
```json
{
  "waitingCount": 2,
  "calledTodayCount": 5,
  "completedTodayCount": 4,
  "averageWaitTimeMinutes": 12.3
}
```

---

### 8.2 Queue Operations (Custom DSA)

#### `GET /api/queue/waiting`
- **Purpose:** Snapshot of all waiting patients in strict FIFO order from `LinkedPatientQueue`.
- **Response:** `200 OK`

#### `POST /api/queue/call-next`
- **Purpose:** Dequeues the head patient from `LinkedPatientQueue`, updates database status to `CALLED`, and pushes onto `RecentCallsStack`.
- **Response:** `200 OK` (returns called patient DTO).
- **Error:** `404 Not Found` (`QUEUE_EMPTY`) if no patients are waiting.

#### `GET /api/queue/recent-calls`
- **Purpose:** Returns recent calls ordered newest-first from `RecentCallsStack`.
- **Response:** `200 OK`

#### `POST /api/queue/repeat-last-call`
- **Purpose:** Calls `RecentCallsStack.peek()` to retrieve the top patient for re-announcement without mutating queue or stack.
- **Response:** `200 OK`
- **Error:** `404 Not Found` (`STACK_EMPTY`) if no calls exist.

---

### 8.3 Patient Lifecycle & V2 Operations

#### `POST /api/patients`
- **Purpose:** Registers a patient, assigns department daily token (`PREFIX-NNN`), persists to PostgreSQL, and enqueues at queue tail.
- **Request Body:**
```json
{
  "name": "Maya Lin",
  "age": 32,
  "department": "General Medicine",
  "notes": "Mild seasonal allergic rhinitis"
}
```
- **Response:** `201 Created`
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tokenNumber": "GEN-001",
  "name": "Maya Lin",
  "age": 32,
  "department": "General Medicine",
  "registrationTime": "2026-10-29T03:45:00Z",
  "status": "WAITING",
  "calledTime": null,
  "completedTime": null,
  "notes": "Mild seasonal allergic rhinitis",
  "queuePosition": 1,
  "waitDurationSeconds": 0
}
```

#### `GET /api/patients/similar`
- **Purpose:** Debounced similarity check during registration.
- **Query Params:** `?name=Maya%20Lin&department=General%20Medicine&age=32`
- **Response:** `200 OK`
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "tokenNumber": "GEN-001",
    "name": "Maya Lin",
    "department": "General Medicine",
    "age": 32,
    "status": "WAITING",
    "registrationTime": "2026-10-29T03:45:00Z",
    "similarityScore": 1.0,
    "matchReason": "Exact name match"
  }
]
```

#### `GET /api/patients/paged`
- **Purpose:** Server-side paginated, filtered, and sorted patient registry query.
- **Query Params:** `?page=0&size=10&search=maya&department=General%20Medicine&status=WAITING&sortBy=registrationTime&sortDirection=desc`
- **Response:** `200 OK`
```json
{
  "content": [ ... ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 1,
  "totalPages": 1,
  "isFirst": true,
  "isLast": true
}
```

#### `PATCH /api/patients/{id}/complete`
- **Purpose:** Transitions a `CALLED` patient to `COMPLETED` and records `completedTime`.
- **Response:** `200 OK`

#### `DELETE /api/patients/{id}`
- **Purpose:** Cancels a `WAITING` patient's ticket, removes them from `LinkedPatientQueue`, and marks status `CANCELLED`.
- **Response:** `200 OK`

---

## Section 9 — Database Schema, Concurrency & Migration

### 9.1 Relational Schema & Flyway Migrations
PostgreSQL schema is version-controlled with Flyway:

#### `V1__init_schema.sql`
```sql
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY,
    token_number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    age INTEGER,
    department VARCHAR(50) NOT NULL,
    registration_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    called_time TIMESTAMP WITH TIME ZONE,
    completed_time TIMESTAMP WITH TIME ZONE,
    notes VARCHAR(250)
);

CREATE INDEX idx_patient_status ON patients (status);
CREATE INDEX idx_patient_registration_time ON patients (registration_time);
CREATE INDEX idx_patient_token_number ON patients (token_number);
```

#### `V2__department_daily_tokens.sql`
```sql
-- Track department-specific daily sequences atomically
CREATE TABLE IF NOT EXISTS department_daily_tokens (
    queue_date DATE NOT NULL,
    department_code VARCHAR(10) NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (queue_date, department_code)
);

-- Add sequence audit columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS queue_date DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS department_code VARCHAR(10);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS sequence_number INT;

CREATE INDEX IF NOT EXISTS idx_patients_queue_date_dept 
ON patients (queue_date, department_code);
```

### 9.2 Concurrency & Thread-Safety Design
To guarantee that two staff members registering patients at the exact same millisecond never receive duplicate tokens:
1. `DepartmentTokenService.getNextToken()` executes inside an isolated transaction.
2. It queries `DepartmentDailyTokenRepository.findByQueueDateAndDepartmentCode(queueDate, departmentCode)` using **`@Lock(LockModeType.PESSIMISTIC_WRITE)`**.
3. Under PostgreSQL, this translates to `SELECT ... FOR UPDATE`, obtaining an exclusive row-level lock on the counter.
4. The counter increments atomically and commits before the second registration can acquire the sequence.

### 9.3 Demo Data Policy & Safe Cleanup
- **Default Policy:** `carequeue.seed-demo-data: false` prevents automatic test patient injection on production startup.
- **Opt-In Demo Seeding:** Set `CAREQUEUE_SEED_DEMO_DATA=true` when initializing an empty database for demonstration.
- **Safe Cleanup Script:** To remove explicitly tagged development demo records without affecting legitimate patients:
```sql
-- Safe Demo Data Cleanup: Run manually if demo records are no longer needed
DELETE FROM patients 
WHERE notes IN (
    'Initial triage - high blood pressure',
    'Routine skin allergy checkup',
    'Follow-up for joint pain'
) AND registration_time < '2026-10-30';
```

---

## Section 10 — Environment Variables & Configuration

| Variable | Description | Service | Default Value (Dev) | Secret? |
|---|---|---|---|---|
| `POSTGRES_DB` | PostgreSQL database name | PostgreSQL / Backend | `carequeue_db` | No |
| `POSTGRES_USER` | PostgreSQL user | PostgreSQL / Backend | `carequeue_user` | No |
| `POSTGRES_PASSWORD` | PostgreSQL password | PostgreSQL / Backend | `carequeue_secret_dev` | **Yes (in prod)** |
| `POSTGRES_PORT` | PostgreSQL host port | PostgreSQL | `5432` | No |
| `SERVER_PORT` | Backend listening port | Spring Boot Backend | `8080` | No |
| `SPRING_DATASOURCE_URL` | JDBC connection URL | Spring Boot Backend | `jdbc:postgresql://localhost:5432/carequeue_db` | No |
| `SPRING_DATASOURCE_USERNAME`| JDBC connection user | Spring Boot Backend | `carequeue_user` | No |
| `SPRING_DATASOURCE_PASSWORD`| JDBC connection password | Spring Boot Backend | `carequeue_secret_dev` | **Yes (in prod)** |
| `CORS_ALLOWED_ORIGINS` | Permitted browser origins | Spring Boot Backend | `http://localhost:3000,http://127.0.0.1:3000` | No |
| `CAREQUEUE_SEED_DEMO_DATA` | Opt-in fictional seed records | Spring Boot Backend | `false` | No |
| `NEXT_PUBLIC_API_BASE_URL` | Public backend API URL | Next.js Frontend | `http://localhost:8080/api` | No |

---

## Section 11 — How to Run the System Locally

### Option A: One-Click Startup (PowerShell)
From the project root (`CareQueue`):
```powershell
.\start-dev.ps1
```
This automatically launches both the Spring Boot backend on `localhost:8080` and the Next.js frontend on `localhost:3000` in dedicated windows. To stop both services at any time, run:
```powershell
.\stop-dev.ps1
```

---

### Option B: Step-by-Step Manual Startup

#### Step 1: Start PostgreSQL (Optional if using H2)
```powershell
docker compose up -d
```
*(If Docker is not running, the backend seamlessly falls back to embedded H2 in PostgreSQL compatibility mode).*

#### Step 2: Start Spring Boot Java Backend
```powershell
cd backend

# On Windows PowerShell:
.\mvnw.cmd spring-boot:run

# On Linux / macOS:
./mvnw spring-boot:run
```
Wait for log confirmation:
```text
INFO ... c.c.service.PatientQueueService : CareQueue startup initialization complete.
INFO ... c.carequeue.CareQueueApplication : Started CareQueueApplication in 3.4 seconds
```

#### Step 3: Start Next.js Frontend
Open a second terminal window:
```powershell
cd frontend
npm install
npm run dev
```

#### Step 4: Open Browser
- **Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Health Endpoint:** [http://localhost:8080/api/health](http://localhost:8080/api/health)

---

## Section 12 — Testing Manual & Automated Test Results

CareQueue includes 100% automated test suites for both backend and frontend.

### 12.1 Backend Tests (Java / JUnit 5 / Mockito)
Execute all backend tests:
```powershell
cd backend
.\mvnw.cmd test
```

#### Verified Test Breakdown (62 Passed, 0 Failures):
- **`com.carequeue.service.TokenSystemTest` (4 tests passed):**
  1. Department daily sequence generation (`GEN-001`, `GEN-002`).
  2. Distinct department counters start independently (`DER-001`).
  3. Tokens never reused after patient completion or cancellation.
  4. Concurrent registration thread safety under pessimistic write locks.
- **`com.carequeue.service.PatientSimilarityServiceTest` (7 tests passed):**
  1. Exact name matching.
  2. Case-insensitive matching.
  3. Repeated whitespace and padding normalization.
  4. Minor spelling variation detection (Levenshtein distance).
  5. Distinction between distinct patients with identical names.
  6. Empty / sub-threshold query rejection.
  7. Result set bounded to top 5 matches.
- **`com.carequeue.service.PatientRegistryPaginationTest` (4 tests passed):**
  1. Paginated queries with custom page size (10, 25, 50).
  2. Multi-field search across patient names and tokens.
  3. Status and department filtering.
  4. Dynamic sorting without modifying queue FIFO order.
- **`com.carequeue.dsa.LinkedPatientQueueTest` (15 tests passed):**
  - FIFO head/tail invariant, empty queue safety, middle-node deletion splicing, size tracking, null element rejection.
- **`com.carequeue.dsa.RecentCallsStackTest` (10 tests passed):**
  - LIFO push/pop, non-destructive `peek()`, stack size consistency, newest-first snapshot list.
- **`com.carequeue.dsa.StringUtilTest` (9 tests passed):**
  - Unicode character preservation, whitespace stripping, Locale.ROOT normalization, length limits.
- **`com.carequeue.service.PatientQueueServiceTest` (8 tests passed):**
  - Full lifecycle service tests and startup queue reconstruction.
- **`com.carequeue.controller.QueueControllerIntegrationTest` (5 tests passed):**
  - MockMvc HTTP testing of REST endpoints and validation errors.

---

### 12.2 Frontend Tests (Vitest & React Testing Library)
Execute all frontend component tests:
```powershell
cd frontend
npx vitest run
```

#### Verified Test Breakdown (18 Passed, 0 Failures):
- `tests/ThemeToggle.test.tsx` (4 tests passed) — Light, Dark, System switching and `localStorage` persistence.
- `tests/RegisterPatientDialog.test.tsx` (4 tests passed) — Field rendering, validation errors, debounced similarity panel, duplicate confirmation.
- `tests/PatientRegistryTable.test.tsx` (4 tests passed) — Paginated table rendering, search query firing, status filter pills, detail view opening.
- `tests/WaitingQueueTable.test.tsx` (3 tests passed) — FIFO list rendering, next patient call action, cancel ticket modal.
- `tests/RecentCallsStackPanel.test.tsx` (3 tests passed) — LIFO stack order, STACK TOP badge, repeat last call action.

---

### 12.3 Frontend Strict Linting & Typecheck
```powershell
cd frontend
npm run typecheck    # Exits 0: Strict TypeScript check passed
npm run lint         # Exits 0: ESLint check passed with zero warnings
npm run build        # Exits 0: Next.js production build succeeded
```

---

## Section 13 — Deployment Manual (Vercel & Render)

### 13.1 Deploying the Java Backend on Render
1. Push your repository to GitHub.
2. In [Render](https://render.com), create a new **PostgreSQL Database** named `carequeue-db`.
3. Create a new **Web Service**, select your repo, and set:
   - Root Directory: `backend`
   - Environment: `Docker` (Render utilizes `backend/Dockerfile`)
4. Configure Environment Variables:
   - `SPRING_DATASOURCE_URL`: PostgreSQL JDBC connection URL.
   - `SPRING_DATASOURCE_USERNAME`: Render database user.
   - `SPRING_DATASOURCE_PASSWORD`: Render database password.
   - `CORS_ALLOWED_ORIGINS`: `https://<your-app>.vercel.app`.
   - `CAREQUEUE_SEED_DEMO_DATA`: `false`.
5. Deploy service. It will expose your backend at `https://carequeue-backend.onrender.com`.

---

### 13.2 Deploying the Next.js Frontend on Vercel
1. In [Vercel](https://vercel.com), import your GitHub repository.
2. Set Root Directory to `frontend`.
3. Configure Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://carequeue-backend.onrender.com/api`.
4. Click **Deploy**. Vercel will build and deploy the production Next.js app to global edge locations.

---

## Section 14 — Troubleshooting Guide

### 1. Database Connection Failure
- **Symptoms:** `Connection to localhost:5432 refused`.
- **Solution:** Ensure Docker Desktop is active and run `docker compose up -d`. If testing locally without Docker, the backend automatically uses embedded H2 in PostgreSQL compatibility mode.

### 2. Frontend Displays "Backend Disconnected"
- **Symptoms:** Red status indicator in the top bar.
- **Solution:**
  1. Verify the Java backend is active on port 8080 (`http://localhost:8080/api/health`).
  2. Verify `frontend/.env.local` contains `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api`.
  3. If hosted on Render free tier, allow 30–45 seconds for cold-start wake-up.

### 3. Theme Flash on Page Reload
- **Symptoms:** Brief white background flash before switching to dark mode.
- **Solution:** CareQueue V2 prevents this using an inline execution script in `frontend/app/layout.tsx`. Ensure JavaScript is enabled in the browser.

---

## Section 15 — Viva and Project Demonstration

### 15.1 Elevator Pitch for Professors & Examiners
> *"CareQueue V2 is a full-stack hospital patient queue management system engineered to demonstrate fundamental Data Structures and Algorithms in a production-style architecture. Rather than relying on generic Java collections, we built custom, thread-safe linked-node structures from first principles: `LinkedPatientQueue` for O(1) FIFO patient queueing and `RecentCallsStack` for O(1) LIFO call history and announcements. CareQueue V2 introduces department-specific daily tokens (`PREFIX-001`) with pessimistic write-locking concurrency, real-time debounced similarity detection using dynamic programming Levenshtein distance, a full-width paginated patient registry, and a complete dark mode design system."*

### 15.2 3–5 Minute Practical Demonstration Sequence
1. **Theme & Dashboard (30s):** Open [http://localhost:3000](http://localhost:3000). Toggle between Light, Dark, and System modes to show instant, persistent styling.
2. **Similarity Detection & Token Allocation (60s):** Click "Register Patient". Type "Maya Lin" and observe the debounced (~300ms) similarity check finding existing records. Proceed to register and show token `GEN-001` generated. Register a Dermatology patient to show independent sequence `DER-001`.
3. **Queue Calling & LIFO Stack (60s):** Call the next patient. Show the head node dequeued from `LinkedPatientQueue` in O(1) time and pushed onto `RecentCallsStack`. Demonstrate "Repeat Announcement" using O(1) stack `peek()`.
4. **Patient Registry & Details (60s):** Navigate to "Patient Registry". Demonstrate server-side pagination (10/25/50), multi-field search, status filtering, and open the comprehensive Patient Detail Modal.
5. **Persistence & Restart Proof (30s):** Restart the backend and show terminal logs verifying that `LinkedPatientQueue` and `RecentCallsStack` are reconstructed from database records.

---

### 15.3 18 Viva Questions and Concise Answers

#### Q1: What is a Queue, and which principle does it follow?
**Answer:** A Queue is a linear data structure that follows the **First-In, First-Out (FIFO)** principle. Elements are inserted at the rear (`tail`) and removed from the front (`head`).

#### Q2: Why did you use a singly linked list for the Queue instead of an Array?
**Answer:** In a standard array-based queue, dequeueing from index 0 requires shifting all remaining elements to the left, resulting in **O(n)** time complexity. With a singly linked list, maintaining `head` and `tail` pointers allows both `enqueue` and `dequeue` to execute in **O(1)** constant time.

#### Q3: What is a Stack, and which principle does it follow?
**Answer:** A Stack is a linear data structure following the **Last-In, First-Out (LIFO)** principle. Elements are pushed and popped at a single endpoint called the `top`.

#### Q4: Why is `peek()` used for the "Repeat Last Call" action instead of `pop()`?
**Answer:** `pop()` removes and returns the top element from the stack. `peek()` retrieves the top element without removing it, allowing repeated announcements while preserving call history.

#### Q5: How are department-specific daily tokens formatted and generated in V2?
**Answer:** Tokens follow `PREFIX-NNN` (e.g. `GEN-001`, `DER-001`). Department codes are mapped from department names, and sequences reset to `001` daily at midnight in the `Asia/Kolkata` timezone.

#### Q6: How do you prevent race conditions when two patients register simultaneously?
**Answer:** `DepartmentTokenService` uses PostgreSQL pessimistic write locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`). This executes `SELECT ... FOR UPDATE` on the `(queue_date, department_code)` row, ensuring atomic counter increments.

#### Q7: How does the Smart Registration similarity check work?
**Answer:** It combines whitespace normalization, case-folding, substring checks, and a dynamic programming Levenshtein distance matrix ($O(m \cdot n)$ edit distance) to score candidates between 0.0 and 1.0, bounding output to the top 5 matches.

#### Q8: Does sorting the Patient Registry affect the waiting queue order?
**Answer:** No. The Patient Registry is a historical database query using Spring Data JPA Specifications. The active waiting queue remains strictly ordered by arrival timestamp in `LinkedPatientQueue`.

#### Q9: What happens when the only patient in the queue is dequeued or cancelled?
**Answer:** Both `head` and `tail` pointers are explicitly set to `null` and `size` is decremented to 0. This prevents memory leaks and stale references.

#### Q10: How do you handle concurrency in your custom data structures?
**Answer:** Methods in `LinkedPatientQueue` and `RecentCallsStack` are declared `synchronized`. This guarantees mutually exclusive access across concurrent HTTP threads in the single-instance backend.

#### Q11: How does CareQueue handle non-English or accented names?
**Answer:** Java Strings use UTF-16 internally. Our validation preserves Unicode characters without lossy conversion, allowing names like "José García" or "आरव शर्मा" to be stored and displayed accurately.

#### Q12: What happens to in-memory data structures when the server restarts?
**Answer:** On boot, the `@PostConstruct initializeQueueState()` method queries the database for all persistent `WAITING` patients in chronological order and re-enqueues them into `LinkedPatientQueue`.

#### Q13: In what order do you reconstruct the RecentCallsStack after boot?
**Answer:** Historical calls are queried in **oldest-to-newest** chronological order. Pushing each onto the stack ensures that the most recent call ends up at the `top` of the LIFO stack.

#### Q14: How does the system calculate average wait time?
**Answer:** In `PatientQueueService.getQueueStats()`, the difference between `registrationTime` and `calledTime` is calculated for all patients called today using `Duration.between()`, and the average is computed in minutes.

#### Q15: What prevents a patient from being cancelled after they are already called?
**Answer:** The `PatientStatus.canTransitionTo()` state machine rejects invalid transitions. Cancelling is only permitted for patients in `WAITING` status; attempting to cancel a `CALLED` or `COMPLETED` patient throws `InvalidStatusTransitionException` (`409 Conflict`).

#### Q16: How is Zero-Flash Dark Mode achieved?
**Answer:** An inline script runs in `<head>` before Next.js/React mounts. It reads `localStorage.getItem("carequeue-theme")` or checks `window.matchMedia('(prefers-color-scheme: dark)')` and adds the `'dark'` class to `<html>` synchronously.

#### Q17: Why is horizontal multi-pod scaling a limitation of this project?
**Answer:** Because `LinkedPatientQueue` lives in the JVM heap of a single instance. If two backend instances ran behind a load balancer without a distributed queue, their in-memory queues would diverge. Scaling would require Redis Streams or a distributed message broker.

#### Q18: What is the total automated test count for CareQueue V2?
**Answer:** 80 automated tests: 62 backend JUnit 5 / Mockito tests (covering token concurrency, similarity detection, registry pagination, custom queue/stack, and REST controllers) and 18 frontend Vitest tests.

---

### End of CareQueue V2 Master Documentation Manual
*CareQueue V2 — Hospital Patient Queue Management System · Academic DSA Capstone Deliverable*
