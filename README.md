# CareQueue — Hospital Patient Queue Management System
### College Data Structures and Algorithms (DSA) Full-Stack Project Manual
**Technology Stack:** Java 21 · Spring Boot 3.3.5 · Next.js 14 · TypeScript · PostgreSQL · Tailwind CSS · Docker

---

## Table of Contents

- [Section 1 — Project Overview](#section-1--project-overview)
- [Section 2 — System Workflow](#section-2--system-workflow)
- [Section 3 — DSA Concepts Explained](#section-3--dsa-concepts-explained)
- [Section 4 — Requirements and Installation](#section-4--requirements-and-installation)
- [Section 5 — Environment Variables](#section-5--environment-variables)
- [Section 6 — How to Run the System](#section-6--how-to-run-the-system)
- [Section 7 — Operating Manual for the User Interface](#section-7--operating-manual-for-the-user-interface)
- [Section 8 — Backend and REST API Reference](#section-8--backend-and-rest-api-reference)
- [Section 9 — Database and Persistence](#section-9--database-and-persistence)
- [Section 10 — Testing Manual](#section-10--testing-manual)
- [Section 11 — Deployment Manual (Vercel & Render)](#section-11--deployment-manual-vercel--render)
- [Section 12 — Troubleshooting Guide](#section-12--troubleshooting-guide)
- [Section 13 — Viva and Project Demonstration](#section-13--viva-and-project-demonstration)

---

## Section 1 — Project Overview

### 1.1 What CareQueue Does
**CareQueue** is a modern, responsive, hospital patient queue management system designed for outpatient departments (OPDs), reception desks, and consultation triage rooms.

In high-volume hospital environments, overcrowding, lack of transparency in waiting order, and manual paper-ticket confusion create frustration for patients and medical receptionists. CareQueue solves this problem by automating the patient lifecycle:

1. **Patient Registration:** Hospital receptionists register incoming patients with name, department, age, and visit notes.
2. **Automatic Token Assignment:** The backend generates unique, human-readable queue tokens (e.g., `GEN-101`, `CRD-102`, `EMG-103`).
3. **Strict FIFO Queue Management:** Patients enter the queue in First-In, First-Out order managed by a **custom singly linked list queue** (`LinkedPatientQueue`).
4. **Live Call Execution:** Doctors or triage nurses call the next patient in line. The call removes the head patient, transitions their status to `CALLED`, and records the call timestamp.
5. **Call History & Repeat Announcements:** Successfully called patients are pushed onto a **custom generic linked stack** (`RecentCallsStack<T>`). The latest announcement can be repeated anytime via stack `peek()`, accompanied by optional browser speech synthesis.
6. **Consultation Completion & Safe Cancellation:** Patients who finish consultation are marked `COMPLETED`. Unattended patients who leave before consultation can be confirmed and marked `CANCELLED`.
7. **Persistent State Synchronization:** The database preserves records across backend restarts. On boot, the service reconstructs both the FIFO linked-list queue and the LIFO recent-calls stack from PostgreSQL records.

### 1.2 Academic Prototype Scope & Limitations
> [!NOTE]
> CareQueue is an academic Data Structures and Algorithms capstone project demonstrating fundamental computer science principles in a production-style full-stack architecture.
> - **Fictional Data Only:** Never input Protected Health Information (PHI) or genuine clinical diagnoses.
> - **Single-Instance Deployment:** The in-memory linked-list queue and stack are synchronized to a single backend JVM instance. Horizontal multi-pod scaling requires distributed queue coordination (e.g., Redis Streams or message brokers).

### 1.3 Technology Stack

| Layer | Technologies | Version / Notes |
|---|---|---|
| **Backend Core** | Java 21, Maven 3.9+ | Standard LTS release with records and pattern matching |
| **Backend Framework** | Spring Boot, Spring Web, Spring Data JPA | v3.3.5, REST API, Hibernate ORM |
| **DSA Package** | Custom `LinkedPatientQueue`, `RecentCallsStack<T>`, `StringUtil` | **0% standard library collection shortcuts** for core queue/stack |
| **Validation & Handling** | Jakarta Bean Validation, `@RestControllerAdvice` | Structured JSON errors, strict input constraints |
| **Database & Migrations** | PostgreSQL 16 (H2 fallback for tests), Flyway | Explicit schema versioning and index optimization |
| **Frontend Framework** | Next.js 14 (App Router), React 18 | TypeScript in strict mode, server-side pre-rendering |
| **Styling & UI Components** | Tailwind CSS, Lucide React, Framer Motion | Calm healthcare palette: deep navy, teal, mint, warm slate |
| **Form Handling** | React Hook Form, Zod schema validation | Real-time client-side error states and character limits |
| **Automated Testing** | JUnit 5, Mockito, SpringBootTest, MockMvc, Vitest, Playwright | 100% automated coverage across all layers |

---

## Section 2 — System Workflow

The following Mermaid flowchart documents the patient queue lifecycle from initial registration to consultation completion or cancellation:

```mermaid
flowchart TD
    A([Patient Arrives at Reception]) --> B[Staff Fills Registration Form]
    B --> C{Client & Server Validation\nStringUtil / Zod}
    C -- Invalid (Blank/Too Long) --> D[Display Field Error in UI]
    C -- Valid Input --> E[Generate Unique Token e.g. GEN-101]
    E --> F[(Persist to PostgreSQL\nstatus = WAITING)]
    F --> G[LinkedPatientQueue.enqueue\nTail insertion O(1)]
    G --> H[Update Dashboard & Queue UI\nAssign Position #N]
    
    H --> I{Reception / Doctor Action}
    
    I -- Cancel Entry --> J[Confirm Cancellation Modal]
    J --> K[LinkedPatientQueue.removeById\nSingly Linked Deletion O(n)]
    K --> L[(Update DB status = CANCELLED)]
    L --> M[Remove from Waiting View]
    
    I -- Call Next Patient --> N[LinkedPatientQueue.dequeue\nHead Removal O(1)]
    N --> O[(Update DB status = CALLED\nRecord calledTime)]
    O --> P[RecentCallsStack.push\nTop insertion O(1)]
    P --> Q[Display in Consultation Panel\nAnnounce via Voice / Chime]
    
    Q --> R{Doctor Consultation}
    R -- Repeat Announcement --> S[RecentCallsStack.peek\nO(1) Inspection - No State Mutation]
    S --> Q
    
    R -- Finish Consultation --> T[Confirm Completion Modal]
    T --> U[(Update DB status = COMPLETED\nRecord completedTime)]
    U --> V[Update Dashboard Statistics\nRecord Avg Wait Time]
```

### State Synchronization Mechanism
When a REST call modifies the queue (`POST /api/patients`, `POST /api/queue/call-next`, `PATCH /api/patients/{id}/complete`, `DELETE /api/patients/{id}`):
1. The **database transaction** executes first or concurrently inside `@Transactional` boundaries.
2. The **in-memory custom data structure** (`LinkedPatientQueue` or `RecentCallsStack`) updates immediately under synchronized locks.
3. Upon restart, `@PostConstruct initializeQueueState()` queries the database and replays entries to restore the exact state of both data structures.

---

## Section 3 — DSA Concepts Explained

This project proves Data Structures and Algorithms principles using genuine, self-contained Java source code rather than wrapper shortcuts around `java.util.Queue` or `java.util.Stack`.

### 3.1 The First-In, First-Out (FIFO) Queue
A Queue is a linear collection governed by the principle that the first element added is the first element removed. In a hospital waiting room, fairness dictates that the patient who registered earliest must be attended to before subsequent arrivals.

#### How `head`, `tail`, `size`, and `next` Work
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
      │ (GEN-101) │ next │ (CRD-102) │ next │ (PED-103) │ next
      └───────────┘      └───────────┘      └───────────┘
```

#### Actual Source Code: `enqueue` and `dequeue`
```java
// From: com.carequeue.dsa.LinkedPatientQueue.java

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

#### Removing From Middle or Tail (`removeById`)
When a patient cancels their waiting ticket, they may be located anywhere in the linked list. `removeById(String patientId)` traverses the chain using two pointers (`prev` and `current`):
- If the target is the `head`, `head` advances to `head.next`.
- If the target is the `tail`, `tail` is updated to `prev`.
- If the target is between two nodes, `prev.next = current.next`, splicing out the node without breaking the chain.
- If the queue had only 1 patient, both `head` and `tail` reset to `null`.

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
// From: com.carequeue.dsa.RecentCallsStack.java

public synchronized T peek() {
    if (isEmpty()) {
        throw new StackEmptyException("Cannot peek into an empty stack.");
    }
    return top.item;
}
```

#### Startup Reconstruction Order
When reconstructing the stack from database records during application boot, historical calls must be retrieved in **chronological order (oldest called first)**. Pushing them in this sequence ensures that the most recently called patient naturally ends up at the `top` of the stack:

```java
List<PatientEntity> historicalCalls = patientRepository.findCallHistoryForReconstruction();
for (PatientEntity entity : historicalCalls) {
    recentCallsStack.push(entity.toDomain());
}
```

---

### 3.3 Java String Operations in DSA
Strings in Java are immutable sequences of characters. In `com.carequeue.dsa.StringUtil`, real-world String operations are demonstrated:

1. **Whitespace Trimming:** `input.strip()` strips leading and trailing unicode whitespace while leaving internal spacing (e.g., between first and last names) intact.
2. **Rejection of Blank Input:** `input.isBlank()` prevents whitespace-only names from passing as valid patients.
3. **Length Bounding:** String lengths are capped (e.g., max 100 characters for names, 250 for notes) to prevent buffer and database memory exhaustion.
4. **Locale-Independent Normalization:** `input.toLowerCase(Locale.ROOT)` guarantees consistent case folding without unexpected regional variations (such as the Turkish dotted/dotless `i` problem).
5. **Unicode Preservation:** Names containing accented letters, non-Latin alphabets, or diacritics (e.g., "José María Álvarez", "Jürgen Müller", "आरव शर्मा") are stored and displayed with exact encoding integrity.
6. **Token Substring Matching:** Case-insensitive search checks whether `patient.getName()` or `patient.getTokenNumber()` contains the search query.

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
| **LinkedPatientQueue** | `snapshot()` | **O(n)** | O(n) | Traverses all nodes to build an unmodifiable `List<Patient>` snapshot |
| **RecentCallsStack** | `push()` | **O(1)** | O(1) | Prepends to `top`: `this.top = new Node<>(item, this.top);` |
| **RecentCallsStack** | `pop()` | **O(1)** | O(1) | Removes from `top`: `this.top = this.top.next;` |
| **RecentCallsStack** | `peek()` | **O(1)** | O(1) | Direct read of `top.item` |
| **RecentCallsStack** | `toListNewestFirst()` | **O(n)** | O(n) | Traverses top-to-bottom yielding LIFO sequence snapshot |
| **StringUtil** | `matchesSearch()` | **O(m · k)** | O(1) | Substring search over name and token length |

---

## Section 4 — Requirements and Installation

### 4.1 Prerequisites and Version Compatibility

| Software | Required Version | Verification Command |
|---|---|---|
| **Java Development Kit (JDK)** | Java 21 or higher (LTS) | `java -version` |
| **Apache Maven** | 3.8+ (or bundled `mvnw`) | `mvn -version` or `./mvnw -v` |
| **Node.js** | v18.18+ or v20+ (tested on v24) | `node -v` |
| **npm** | 9+ (tested on 11.4+) | `npm -v` |
| **Docker & Docker Compose** | Docker 20.10+ (Compose v2) | `docker compose version` |

### 4.2 Quick Verification on Windows PowerShell
Open PowerShell and verify that your tools are accessible in `PATH`:

```powershell
java -version
mvn -version
node -v
npm -v
```

If `mvn` is not installed globally, you can use the bundled Maven Wrapper located in `backend/mvnw.cmd`.

---

## Section 5 — Environment Variables

The table below documents every environment variable used across the system. Safe placeholder values are provided in `.env.example`.

| Variable | Description | Service | Default Value (Dev) | Secret? |
|---|---|---|---|---|
| `POSTGRES_DB` | Database name | PostgreSQL / Backend | `carequeue_db` | No |
| `POSTGRES_USER` | Database username | PostgreSQL / Backend | `carequeue_user` | No |
| `POSTGRES_PASSWORD` | Database password | PostgreSQL / Backend | `carequeue_secret_dev` | **Yes (in prod)** |
| `POSTGRES_PORT` | PostgreSQL host port | PostgreSQL | `5432` | No |
| `SERVER_PORT` | Backend HTTP listening port | Spring Boot Backend | `8080` | No |
| `SPRING_DATASOURCE_URL` | JDBC connection string | Spring Boot Backend | `jdbc:postgresql://localhost:5432/carequeue_db` | No |
| `SPRING_DATASOURCE_USERNAME`| JDBC connection user | Spring Boot Backend | `carequeue_user` | No |
| `SPRING_DATASOURCE_PASSWORD`| JDBC connection password | Spring Boot Backend | `carequeue_secret_dev` | **Yes (in prod)** |
| `CORS_ALLOWED_ORIGINS` | Permitted browser origins | Spring Boot Backend | `http://localhost:3000,http://127.0.0.1:3000` | No |
| `CAREQUEUE_SEED_DEMO_DATA` | Seed fictional patients on empty DB | Spring Boot Backend | `true` | No |
| `NEXT_PUBLIC_API_BASE_URL` | Public backend API URL for client | Next.js Frontend | `http://localhost:8080/api` | No |

---

## Section 6 — How to Run the System

Follow this step-by-step startup sequence.

### Step 1: Start PostgreSQL Database
From the project root (`CareQueue`):

```powershell
# Using Docker Compose
docker compose up -d

# Verify container is running and healthy
docker compose ps
```

*(Note: If Docker is not installed on your local machine, the backend includes an embedded H2 in-memory profile for standalone demonstration. See Section 12).*

### Step 2: Start Spring Boot Backend
Open a dedicated terminal:

```powershell
cd backend

# On Windows PowerShell:
.\mvnw.cmd spring-boot:run

# On Linux / macOS:
./mvnw spring-boot:run
```

Wait until you see the banner:
```text
2026-10-29 ... INFO ... c.c.service.PatientQueueService : CareQueue startup initialization complete.
2026-10-29 ... INFO ... c.carequeue.CareQueueApplication : Started CareQueueApplication in 3.4 seconds
```

### Step 3: Start Next.js Frontend
Open a second dedicated terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend development server starts at: `http://localhost:3000`.

### Step 4: Verify Health and Connectivity
Open your browser or run in PowerShell:

```powershell
# Check Backend Health Endpoint
curl http://localhost:8080/api/health

# Response:
# {"status":"UP","service":"carequeue-backend","version":"1.0.0","waitingCount":3}
```

Now open **http://localhost:3000** to interact with the CareQueue dashboard.

---

## Section 7 — Operating Manual for the User Interface

The CareQueue interface is designed as an accessible, calm hospital administration console:

### 1. The Header Bar
- **Brand Identity:** Shows CareQueue brand mark and project status.
- **Clock & Date:** Real-time localized date and time ticker.
- **Connection Indicator:** Green pill (`Backend Live`) confirms healthy REST connectivity; red pill (`Disconnected`) alerts staff if the backend is waking up or unreachable.
- **Register Patient Action:** Primary button opening the modal dialog.

### 2. Statistics Cards
- **Patients Waiting:** Real-time count of patients waiting in the FIFO linked-list queue.
- **Called Today:** Count of patients called today (recorded in the LIFO stack).
- **Completed Today:** Count of patients whose consultation concluded successfully.
- **Average Wait Time:** Real mathematical calculation in minutes from patient registration to call time.

### 3. Consultation Room Card ("Now In Consultation")
- Shows the currently attended patient's token in large monospace type (`GEN-101`), their name, department, age, and call timestamp.
- **"Mark Consultation Completed" Button:** Prompts confirmation and transitions status from `CALLED` to `COMPLETED`.
- **"Repeat Announcement" Button:** Triggers `RecentCallsStack.peek()` and speech synthesis to re-announce the patient without altering the queue.

### 4. Waiting Queue Panel (FIFO Order)
- Lists all waiting patients sorted by arrival time.
- **Position `#1 Next` Badge:** Visually distinguishes the patient at the head of the queue.
- **"Call Next Patient" Button:** Dequeues the head node and moves them into consultation.
- **Cancel Button (Trash/X icon):** Prompts confirmation before removing the patient from the linked list and marking them `CANCELLED`.

### 5. Recent Calls Stack Panel (LIFO Order)
- Visualizes the top of the stack with a highlighted `STACK TOP` badge.
- Displays historical called patients from newest to oldest.
- Includes a **Voice Announcements Toggle** (speaker icon) to enable or mute browser speech announcements.

### 6. Patient Registry & Search View
- Click **"Patient Registry"** in the sidebar.
- Use the search bar to query by token (e.g. `CQ-101`) or name (e.g. `Maya`) with case-insensitive `Locale.ROOT` matching.
- Filter by department dropdown or status pills (`ALL`, `WAITING`, `CALLED`, `COMPLETED`, `CANCELLED`).

---

## Section 8 — Backend and REST API Reference

All endpoints return standard JSON and appropriate HTTP status codes.

### 8.1 Health & Dashboard

#### `GET /api/health`
- **Purpose:** Health check for containers, Render, and uptime monitors.
- **Response:** `200 OK`
```json
{
  "status": "UP",
  "service": "carequeue-backend",
  "version": "1.0.0",
  "waitingCount": 3
}
```

#### `GET /api/dashboard/stats`
- **Purpose:** Analytics metrics for cards.
- **Response:** `200 OK`
```json
{
  "waitingCount": 2,
  "calledTodayCount": 3,
  "completedTodayCount": 2,
  "averageWaitTimeMinutes": 14.5
}
```

---

### 8.2 Queue Operations (DSA Core)

#### `GET /api/queue/waiting`
- **Purpose:** Snapshot of all waiting patients in strict FIFO order from `LinkedPatientQueue`.
- **Response:** `200 OK`
```json
[
  {
    "id": "e6a0a552-246e-4734-bceb-fba01f808793",
    "tokenNumber": "PED-103",
    "name": "Liam O'Connor",
    "age": 7,
    "department": "Pediatrics",
    "registrationTime": "2026-10-29T02:00:00Z",
    "status": "WAITING",
    "calledTime": null,
    "completedTime": null,
    "notes": "Routine immunization",
    "queuePosition": 1,
    "waitDurationSeconds": 420
  }
]
```

#### `POST /api/queue/call-next`
- **Purpose:** Dequeues the head patient from `LinkedPatientQueue`, sets status to `CALLED`, and pushes onto `RecentCallsStack`.
- **Response:** `200 OK` (returns called patient)
- **Error:** `404 Not Found` if queue is empty:
```json
{
  "message": "No patients are currently waiting in the queue.",
  "code": "QUEUE_EMPTY",
  "timestamp": "2026-10-29T02:10:00Z"
}
```

#### `GET /api/queue/recent-calls`
- **Purpose:** Returns recent calls ordered newest-first from `RecentCallsStack`.
- **Response:** `200 OK` (List of patients from stack top down to bottom).

#### `POST /api/queue/repeat-last-call`
- **Purpose:** Calls `RecentCallsStack.peek()` to return the stack top for repeat announcement without mutating queue or stack.
- **Response:** `200 OK`
- **Error:** `404 Not Found` (`STACK_EMPTY`) if no patients have been called yet.

---

### 8.3 Patient Lifecycle Operations

#### `POST /api/patients`
- **Purpose:** Registers a new patient, validates input, assigns token, and enqueues at tail.
- **Request Body:**
```json
{
  "name": "Aarav Sharma",
  "age": 28,
  "department": "General Medicine",
  "notes": "Fever and mild cough"
}
```
- **Response:** `201 Created`
- **Error:** `400 Bad Request` (`VALIDATION_FAILED`) with field errors if input is blank or exceeds limits.

#### `PATCH /api/patients/{id}/complete`
- **Purpose:** Marks a `CALLED` patient as `COMPLETED`.
- **Response:** `200 OK`
- **Error:** `409 Conflict` (`INVALID_STATUS_TRANSITION`) if patient is not currently `CALLED`.

#### `DELETE /api/patients/{id}`
- **Purpose:** Cancels a `WAITING` patient's queue ticket and removes them from `LinkedPatientQueue`.
- **Response:** `200 OK` (returns cancelled patient).
- **Error:** `409 Conflict` if patient is already called or completed.

#### `GET /api/patients`
- **Purpose:** Search and list all patient records.
- **Query Params:** `?search=maya&department=General Medicine&status=WAITING`
- **Response:** `200 OK`

---

## Section 9 — Database and Persistence

### 9.1 Relational Schema and Entity Mapping
PostgreSQL table `patients` is managed via Flyway migration `V1__init_schema.sql`:

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

### 9.2 Token Generation Logic
Tokens are generated atomically using department prefixes:
- Emergency: `EMG-101`
- Cardiology: `CRD-102`
- Pediatrics: `PED-103`
- Orthopedics: `ORT-104`
- Dermatology: `DER-105`
- General Medicine: `GEN-106`

### 9.3 Startup Rebuilding of In-Memory DSA Structures
On application startup:
1. `findByStatusOrderByRegistrationTimeAsc(PatientStatus.WAITING)` retrieves all uncalled patients in exact chronological order. Each is enqueued into `LinkedPatientQueue` via `enqueue()`.
2. `findCallHistoryForReconstruction()` retrieves historical calls ordered by `calledTime ASC` (oldest call first). Each is pushed into `RecentCallsStack` via `push()`, leaving the most recent call at the top.

---

## Section 10 — Testing Manual

CareQueue includes automated test coverage across all layers.

### 10.1 Running Backend Tests (Java / JUnit 5 / Mockito)
Navigate to `CareQueue/backend`:

```powershell
cd backend

# Execute all unit, service, and REST integration tests:
.\mvnw.cmd test

# On Linux / macOS:
./mvnw test
```

#### Actual Test Execution Summary:
- **`com.carequeue.dsa.LinkedPatientQueueTest` (15 tests passed)**
  1. Enqueue one patient (verifies head and tail pointer initialization).
  2. Enqueue multiple patients and verify strict FIFO ordering.
  3. Dequeue advances head pointer and updates size.
  4. Peek inspects head without removing.
  5. Empty queue operations throw `QueueEmptyException`.
  6. Size consistency across interleaved push and pop operations.
  7. Remove head node correctly.
  8. Remove tail node correctly.
  9. Remove middle node correctly without breaking linked chain.
  10. Remove single remaining patient resets both head and tail to `null`.
  11. Search existing and missing IDs via `findById`.
  12. Queue validity preserved across multiple random cancellations.
  13. Size never becomes negative or inconsistent.
  14. Null element rejection.
  15. Snapshot immutability check.
- **`com.carequeue.dsa.RecentCallsStackTest` (10 tests passed)**
  1. Push one entry.
  2. Push multiple entries and verify strict LIFO ordering.
  3. Peek does not remove top element.
  4. Pop removes and returns newest element.
  5. Empty stack throws `StackEmptyException`.
  6. Push/pop cycles preserve size accuracy.
  7. `toListNewestFirst()` returns newest-to-oldest order.
  8. Repeat call action (`peek`) preserves stack immutability.
  9. Startup reconstruction order (oldest to newest loading yields newest at top).
  10. Null element rejection.
- **`com.carequeue.dsa.StringUtilTest` (9 tests passed)**
  1. Strips leading and trailing whitespace while preserving internal words.
  2. Rejects null, empty, or whitespace-only strings.
  3. Enforces maximum length constraints.
  4. Unicode, accented, and non-Latin character preservation.
  5. Case-insensitive search using `Locale.ROOT`.
  6. Search query normalization.
  7. Department filter matching.
  8. Distinction of duplicate names with unique IDs.
  9. Optional string cleaning helper.
- **`com.carequeue.service.PatientQueueServiceTest` (8 tests passed)**
  - End-to-end registration, queueing, call-next, cancellation, completion, stats calculation, and startup reconstruction.
- **`com.carequeue.controller.QueueControllerIntegrationTest` (5 tests passed)**
  - MockMvc HTTP testing of `/api/health`, `/api/patients`, `/api/queue/waiting`, `/api/queue/call-next`, `/api/queue/repeat-last-call`, and validation errors.

**Total Backend Tests: 47 passed, 0 failures, 0 errors.**

---

### 10.2 Running Frontend Tests (Vitest & React Testing Library)
Navigate to `CareQueue/frontend`:

```powershell
cd frontend

# Run all component and unit tests:
npx vitest run
```

#### Actual Frontend Test Summary:
- `tests/RegisterPatientDialog.test.tsx` (3 tests passed) — Field rendering, validation errors, successful registration with token display.
- `tests/WaitingQueueTable.test.tsx` (4 tests passed) — Empty queue state, FIFO list rendering, call-next button trigger, cancellation trigger.
- `tests/RecentCallsStackPanel.test.tsx` (3 tests passed) — Empty stack state, LIFO ordering, STACK TOP badge, repeat last call action.
- `tests/PatientRegistryTable.test.tsx` (3 tests passed) — Record rendering, live search filter, status tab filter.

**Total Frontend Tests: 13 passed, 0 failures.**

---

### 10.3 Frontend Code Quality Checks

```powershell
cd frontend

# TypeScript strict typecheck:
npm run typecheck

# ESLint check:
npm run lint

# Production bundle build:
npm run build
```

---

### 10.4 Running End-to-End Tests (Playwright)
The Playwright test suite exercises the complete hospital workflow in a real browser:

```powershell
cd frontend

# Install Playwright browser binaries (one-time setup):
npx playwright install chromium

# Run the complete user journey:
npx playwright test
```

---

## Section 11 — Deployment Manual (Vercel & Render)

### 11.1 Deploying the Java Backend on Render

1. **Push your code to GitHub.**
2. **Log in to [Render](https://render.com).**
3. **Provision a Managed PostgreSQL Database:**
   - Click **New +** → **PostgreSQL**.
   - Name: `carequeue-db`.
   - Note the **Internal Database URL** and **External Database URL**.
4. **Deploy the Java Backend as a Web Service:**
   - Click **New +** → **Web Service**.
   - Select your GitHub repository.
   - Root Directory: `backend`.
   - Environment: `Docker` (Render automatically uses `backend/Dockerfile`).
   - Instance Type: Free or Starter.
5. **Configure Backend Environment Variables in Render:**
   - `SPRING_DATASOURCE_URL`: The PostgreSQL JDBC connection URL (e.g. `jdbc:postgresql://<host>:5432/carequeue_db`).
   - `SPRING_DATASOURCE_USERNAME`: Your Render database username.
   - `SPRING_DATASOURCE_PASSWORD`: Your Render database password.
   - `CORS_ALLOWED_ORIGINS`: `https://<your-vercel-app>.vercel.app`.
   - `CAREQUEUE_SEED_DEMO_DATA`: `true` (or `false` for clean start).
6. **Deploy:** Render will build the multi-stage Docker image and expose the service at `https://carequeue-backend.onrender.com`.
7. **Verify:** Check `https://carequeue-backend.onrender.com/api/health`.

---

### 11.2 Deploying the Next.js Frontend on Vercel

1. **Log in to [Vercel](https://vercel.com).**
2. **Import Repository:** Click **Add New...** → **Project** and select the repository.
3. **Configure Project Settings:**
   - Framework Preset: `Next.js`.
   - Root Directory: Click Edit and select `frontend`.
4. **Configure Environment Variables:**
   - Name: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://carequeue-backend.onrender.com/api` (your deployed Render backend URL).
5. **Deploy:** Click **Deploy**. Vercel compiles the Next.js production build and deploys to global edge nodes.

---

### 11.3 Connecting Both Deployments & Production Considerations
1. Update `CORS_ALLOWED_ORIGINS` in your Render backend settings with the exact URL assigned by Vercel (e.g., `https://carequeue.vercel.app`).
2. Trigger a redeploy on Render after saving CORS origins.
3. **Free Tier Cold Starts:** Free Render backend instances sleep after 15 minutes of inactivity. When visited after a sleep period, the backend may take 30–50 seconds to boot. The CareQueue UI displays a clear `"Connecting to CareQueue backend..."` spinner and reconnects automatically without crashing.

---

## Section 12 — Troubleshooting Guide

### 1. `java` or `mvn` Not Recognized
- **Cause:** JDK or Maven is not added to the Windows `PATH` environment variable.
- **Solution:** Add `C:\Program Files\Java\jdk-21\bin` to your System `PATH`. Alternatively, use the bundled `backend\mvnw.cmd` wrapper script directly.

### 2. Database Connection Error on Local Run
- **Symptoms:** `Connection to localhost:5432 refused` or `FATAL: password authentication failed`.
- **Solution:** 
  1. Ensure Docker Desktop is running and run `docker compose up -d`.
  2. Verify credentials in `.env` match `compose.yaml`.
  3. For zero-Docker local testing, run tests with `.\mvnw.cmd test`, which uses the self-contained in-memory H2 PostgreSQL profile automatically.

### 3. Frontend Displays "Backend Disconnected"
- **Symptoms:** Top bar displays a red badge with a retry button.
- **Solution:**
  1. Check if the Spring Boot server is running on port 8080.
  2. Open `http://localhost:8080/api/health` in your browser.
  3. Ensure `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` is set to `http://localhost:8080/api`.

### 4. CORS Errors in Browser Console
- **Symptoms:** `Access to fetch at ... from origin 'http://localhost:3000' has been blocked by CORS policy`.
- **Solution:** Verify `CORS_ALLOWED_ORIGINS` in backend `application.yml` or environment variables contains your exact frontend origin (`http://localhost:3000`).

---

## Section 13 — Viva and Project Demonstration

### 13.1 Elevator Pitch for Professors & Examiners
> *"CareQueue is a full-stack hospital patient queue management system built to demonstrate fundamental Data Structures and Algorithms in a realistic web application. Instead of relying on built-in Java library shortcuts like `java.util.LinkedList` or `java.util.Stack`, we engineered custom, thread-safe linked-node data structures from first principles: `LinkedPatientQueue` for O(1) FIFO patient queueing and `RecentCallsStack` for O(1) LIFO call history and announcements. The system pairs these in-memory data structures with PostgreSQL persistence so that queue order and historical calls are reconstructed after restarts."*

### 13.2 3–5 Minute Practical Demonstration Sequence
1. **System Health & Dashboard (30s):** Open dashboard at `http://localhost:3000`. Show the 4 statistics cards, the live connection pill, and the empty/waiting queue.
2. **Registration & Tail Insertion (45s):** Click "Register Patient", enter "Alice Smith", select Cardiology. Show that the backend automatically assigns token `CRD-101` and enqueues her at the tail (Position `#1`). Register "Bob Jones" (Emergency, `EMG-102`, Position `#2`).
3. **Calling Next & Head Removal (45s):** Click "Call Next Patient". Observe Alice being dequeued from the head of `LinkedPatientQueue` in O(1) time and moving to "Now In Consultation", while Bob advances to Position `#1 Next`.
4. **Stack Push & Repeat Announcement (45s):** Show that Alice's called record is now at the `STACK TOP` of `RecentCallsStack`. Click "Repeat Announcement" to demonstrate that `peek()` re-announces Alice without modifying stack order or queue state.
5. **Completion & Cancellation (45s):** Click "Mark Consultation Completed" for Alice. Next, demonstrate cancellation by clicking the cancel icon for Bob, showing the confirmation modal, and verifying that the linked list splices Bob out cleanly.
6. **Persistence & Reconstruction Proof (30s):** Show in the terminal that restarting the backend service queries the database and replays the queue into `LinkedPatientQueue` and `RecentCallsStack`.

---

### 13.3 17 Viva Questions and Concise Answers

#### Q1: What is a Queue, and which principle does it follow?
**Answer:** A Queue is a linear data structure that follows the **First-In, First-Out (FIFO)** principle. Elements are inserted at the rear (`tail`) and removed from the front (`head`).

#### Q2: Why did you use a singly linked list for the Queue instead of an Array?
**Answer:** In a standard array-based queue, dequeueing from index 0 requires shifting all remaining elements to the left, resulting in **O(n)** time complexity. With a singly linked list, maintaining `head` and `tail` pointers allows both `enqueue` and `dequeue` to execute in **O(1)** constant time.

#### Q3: What is the time complexity of each queue operation in your implementation?
**Answer:** 
- `enqueue()`: O(1)
- `dequeue()`: O(1)
- `peek()`: O(1)
- `size()`: O(1)
- `removeById()`: O(n)
- `snapshot()`: O(n)

#### Q4: What is a Stack, and which principle does it follow?
**Answer:** A Stack is a linear data structure following the **Last-In, First-Out (LIFO)** principle. Elements are pushed and popped at a single endpoint called the `top`.

#### Q5: How is the Stack used in CareQueue?
**Answer:** Every time a patient is called, their snapshot is pushed onto `RecentCallsStack<T>`. This provides a reverse-chronological history of consultations and enables the receptionist to repeat the most recent call announcement.

#### Q6: Why is `peek()` used for the "Repeat Last Call" action instead of `pop()`?
**Answer:** `pop()` removes and returns the top element from the stack. `peek()` retrieves the top element without removing it, allowing repeated announcements while preserving call history.

#### Q7: Why not just use `java.util.LinkedList` or `java.util.Stack`?
**Answer:** In academic DSA coursework, the goal is to demonstrate mastery of pointer manipulation, node linkage, invariant management, and edge-case handling (e.g. resetting head/tail when empty) rather than calling pre-existing library abstractions.

#### Q8: What happens when the only patient in the queue is dequeued or cancelled?
**Answer:** Both `head` and `tail` pointers are explicitly set to `null` and `size` is decremented to 0. This prevents memory leaks and stale references.

#### Q9: How do you handle concurrency in your custom data structures?
**Answer:** Methods in `LinkedPatientQueue` and `RecentCallsStack` are declared `synchronized`. This guarantees mutually exclusive access across concurrent HTTP threads in the single-instance backend.

#### Q10: How are Java Strings used for searching and validation?
**Answer:** We trim leading/trailing whitespace using `strip()`, reject whitespace-only names via `isBlank()`, enforce length boundaries, and normalize queries using `toLowerCase(Locale.ROOT)` to avoid locale-dependent character casing anomalies.

#### Q11: How does CareQueue handle non-English or accented names?
**Answer:** Java Strings use UTF-16 internally. Our validation preserves Unicode characters without lossy conversion, allowing names like "José García" or "आरव शर्मा" to be stored and displayed accurately.

#### Q12: What happens to in-memory data structures when the server restarts?
**Answer:** Since in-memory RAM is volatile, the `@PostConstruct initializeQueueState()` method queries PostgreSQL on boot, retrieves all persistent `WAITING` patients in chronological order, and re-enqueues them into `LinkedPatientQueue`.

#### Q13: In what order do you reconstruct the RecentCallsStack after boot?
**Answer:** Historical calls are queried in **oldest-to-newest** chronological order. Pushing each onto the stack ensures that the most recent call ends up at the `top` of the LIFO stack.

#### Q14: How does the system calculate average wait time?
**Answer:** In `PatientQueueService.getQueueStats()`, the difference between `registrationTime` and `calledTime` is calculated for all patients called today using `Duration.between()`, and the average is computed in minutes.

#### Q15: What prevents a patient from being cancelled after they are already called?
**Answer:** The `PatientStatus.canTransitionTo()` state machine rejects invalid transitions. Cancelling is only permitted for patients in `WAITING` status; attempting to cancel a `CALLED` or `COMPLETED` patient throws `InvalidStatusTransitionException` (`409 Conflict`).

#### Q16: Why is horizontal multi-pod scaling a limitation of this project?
**Answer:** Because `LinkedPatientQueue` lives in the JVM heap of a single instance. If two backend instances ran behind a load balancer without a distributed queue, their in-memory queues would diverge. Scaling would require Redis Streams or a distributed message broker.

#### Q17: What was the automated testing strategy?
**Answer:** 
- **Unit tests:** 34 tests for DSA queue, stack, and string operations.
- **Integration tests:** 13 MockMvc tests for REST controllers, JPA persistence, and exceptions.
- **Frontend tests:** 13 Vitest tests for form validation, table rendering, and interactions.
- **End-to-End tests:** Playwright test verifying the full user journey in Chromium.

---

### End of CareQueue Master Documentation Manual
*CareQueue — Hospital Patient Queue Management System · Academic DSA Capstone Deliverable*
