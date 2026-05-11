# Campus Notification Platform — System Design

---

## Stage 1: REST API Design & Contract

### 1.1 Overview

This document defines the REST API contract for a Campus Notification Platform. Students receive real-time updates regarding **Placements**, **Events**, and **Results**. The APIs below are designed for a front-end developer to integrate a notification dashboard.

### 1.2 Core Actions

| # | Action | Description |
|---|--------|-------------|
| 1 | **User Authentication** | Login / Logout to obtain a session or JWT token |
| 2 | **Fetch Notifications** | Retrieve paginated notifications for the logged-in student |
| 3 | **Fetch Single Notification** | Retrieve details of one notification |
| 4 | **Mark Notification as Read** | Mark a specific notification as read |
| 5 | **Mark All as Read** | Bulk-mark every unread notification as read |
| 6 | **Get Unread Count** | Quick badge count of unread notifications |
| 7 | **Filter Notifications** | Filter by type (Placement / Event / Result) |
| 8 | **Real-Time Push** | WebSocket/SSE channel for live notification delivery |
| 9 | **Admin — Create Notification** | Admin/HR creates and broadcasts a notification |

### 1.3 Base URL & Versioning

```
Base URL : https://api.campus-notify.example.com/api/v1
WebSocket: wss://api.campus-notify.example.com/ws/notifications
```

### 1.4 Common Headers

#### Request Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Content-Type` | `application/json` | Yes | JSON request body |
| `Authorization` | `Bearer <jwt_token>` | Yes (except login) | JWT authentication token |
| `X-Request-ID` | `uuid-v4` | Optional | Idempotency / tracing key |

#### Response Headers

| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | JSON response body |
| `X-Request-ID` | `uuid-v4` | Echo of request trace ID |
| `X-RateLimit-Remaining` | `integer` | Remaining requests in window |

### 1.5 Notification Type Enum

```json
{
  "notification_type": "Placement" | "Event" | "Result"
}
```

### 1.6 API Endpoints

---

#### 1.6.1 `POST /auth/login`

Authenticate a student and receive a JWT token.

**Request Body**

```json
{
  "email": "student@university.edu",
  "password": "secureP@ss123"
}
```

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 86400,
    "user": {
      "id": "stu_1042",
      "name": "Ashwin Kumar",
      "email": "student@university.edu",
      "role": "student"
    }
  }
}
```

**Response — 401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect."
  }
}
```

---

#### 1.6.2 `GET /notifications`

Fetch paginated notifications for the authenticated student.

**Query Parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `notification_type` | string | — | Filter: `Placement`, `Event`, or `Result` |
| `is_read` | boolean | — | Filter by read status |
| `sort` | string | `desc` | Sort by `createdAt` (`asc` / `desc`) |

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
        "type": "Placement",
        "title": "Google hiring for SDE-1",
        "message": "Google is visiting campus on 15th May for SDE-1 roles.",
        "isRead": false,
        "createdAt": "2026-05-10T09:30:00Z",
        "priority": 3
      },
      {
        "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
        "type": "Result",
        "title": "Mid-Sem Results Published",
        "message": "Check your mid-semester results on the portal.",
        "isRead": true,
        "createdAt": "2026-05-09T14:00:00Z",
        "priority": 2
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalItems": 230,
      "limit": 20
    }
  }
}
```

---

#### 1.6.3 `GET /notifications/:id`

Fetch a single notification by ID.

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "type": "Placement",
    "title": "Google hiring for SDE-1",
    "message": "Google is visiting campus on 15th May for SDE-1 roles.",
    "isRead": false,
    "createdAt": "2026-05-10T09:30:00Z",
    "priority": 3
  }
}
```

**Response — 404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Notification not found."
  }
}
```

---

#### 1.6.4 `PATCH /notifications/:id/read`

Mark a single notification as read.

**Request Body** — _none_

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
    "isRead": true
  }
}
```

---

#### 1.6.5 `PATCH /notifications/read-all`

Mark every unread notification as read for the authenticated student.

**Request Body** — _none_

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "updatedCount": 15
  }
}
```

---

#### 1.6.6 `GET /notifications/unread-count`

Return the count of unread notifications (used for badge display).

**Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "unreadCount": 7
  }
}
```

---

#### 1.6.7 `POST /admin/notifications`

**Admin / HR only** — Create and broadcast a notification to students.

**Request Body**

```json
{
  "type": "Placement",
  "title": "Microsoft hiring for SDE Intern",
  "message": "Microsoft is visiting campus on 20th May.",
  "targetAudience": "all",
  "priority": 3
}
```

`targetAudience` can be `"all"` or an array of student IDs: `["stu_1042", "stu_1043"]`.

**Response — 201 Created**

```json
{
  "success": true,
  "data": {
    "id": "new-uuid-here",
    "type": "Placement",
    "title": "Microsoft hiring for SDE Intern",
    "message": "Microsoft is visiting campus on 20th May.",
    "createdAt": "2026-05-11T06:00:00Z",
    "recipientCount": 50000
  }
}
```

---

#### 1.6.8 Real-Time Notification Channel (WebSocket)

**Connection**

```
wss://api.campus-notify.example.com/ws/notifications?token=<jwt_token>
```

**Server → Client Push Message**

```json
{
  "event": "NEW_NOTIFICATION",
  "data": {
    "id": "uuid",
    "type": "Event",
    "title": "Tech Fest 2026",
    "message": "Annual tech fest registrations are open.",
    "createdAt": "2026-05-11T06:05:00Z",
    "priority": 1
  }
}
```

**Client → Server Acknowledgement**

```json
{
  "event": "ACK",
  "data": {
    "notificationId": "uuid"
  }
}
```

### 1.7 Error Response Schema (Consistent)

Every error follows this shape:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description."
  }
}
```

### 1.8 HTTP Status Codes Used

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing / invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 429 | Too Many Requests (rate-limited) |
| 500 | Internal Server Error |

---

## Stage 2: Database Design, Schema & Queries

### 2.1 Choice of Database — PostgreSQL (Relational)

**Why PostgreSQL?**

| Factor | Why it suits this project |
|--------|--------------------------|
| **Structured data** | Notifications have a well-defined schema (type, message, timestamps, read status). Relational tables map naturally. |
| **ACID transactions** | When an HR clicks "Notify All", we need atomicity — either all 50,000 inserts succeed within a batch, or none do. |
| **Rich querying** | We need filters (type, read status), pagination (`LIMIT/OFFSET` or cursor-based), sorting, and aggregations — SQL excels here. |
| **Indexing** | B-Tree and partial indexes let us optimise the exact query patterns (unread by student, type filter, date range). |
| **Enum support** | Native `ENUM` type for `notification_type`. |
| **Maturity & Ecosystem** | Proven at scale; excellent tooling (pg_stat_statements, EXPLAIN ANALYZE, logical replication). |
| **JSON support** | `jsonb` column available if we ever need semi-structured metadata without a schema migration. |

### 2.2 Database Schema (DDL)

```sql
-- Enum for notification types
CREATE TYPE notification_type AS ENUM ('Placement', 'Event', 'Result');

-- Enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- ──────────────────────────────────────────────
-- USERS TABLE
-- ──────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL DEFAULT 'student',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- NOTIFICATIONS TABLE  (the broadcast template)
-- ──────────────────────────────────────────────
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            notification_type NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    message         TEXT            NOT NULL,
    priority        SMALLINT        NOT NULL DEFAULT 1,   -- 1=low … 3=high
    created_by      UUID            REFERENCES users(id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- STUDENT_NOTIFICATIONS  (per-student delivery)
-- ──────────────────────────────────────────────
CREATE TABLE student_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID            NOT NULL REFERENCES users(id),
    notification_id UUID            NOT NULL REFERENCES notifications(id),
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────
-- Primary lookup: unread notifications for a student, newest first
CREATE INDEX idx_student_unread
    ON student_notifications (student_id, is_read, created_at DESC);

-- Filter by notification type (join with notifications table)
CREATE INDEX idx_notification_type
    ON notifications (type, created_at DESC);

-- Partial index: only unread rows (smaller, faster)
CREATE INDEX idx_student_unread_partial
    ON student_notifications (student_id, created_at DESC)
    WHERE is_read = FALSE;

-- For unread-count badge
CREATE INDEX idx_unread_count
    ON student_notifications (student_id)
    WHERE is_read = FALSE;
```

### 2.3 Entity-Relationship Diagram

```
┌──────────────┐       ┌───────────────────────┐       ┌────────────────────┐
│    users     │       │  student_notifications │       │   notifications    │
├──────────────┤       ├───────────────────────┤       ├────────────────────┤
│ id (PK)      │◄──────│ student_id (FK)        │       │ id (PK)            │
│ name         │       │ notification_id (FK)───┼──────►│ type               │
│ email        │       │ is_read                │       │ title              │
│ password_hash│       │ read_at                │       │ message            │
│ role         │       │ created_at             │       │ priority           │
│ created_at   │       └───────────────────────┘       │ created_by (FK)────┼──► users
│ updated_at   │                                       │ created_at         │
└──────────────┘                                       └────────────────────┘
```

### 2.4 Problems as Data Volume Increases

| Problem | Detail |
|---------|--------|
| **Table bloat** | `student_notifications` grows to **50,000 × avg_notifications**. At 100 notifications per student, that's 5 million rows; at 200, it's 10 million. |
| **Slow pagination** | `OFFSET`-based pagination degrades linearly; page 500 is much slower than page 1. |
| **Write amplification on "Notify All"** | A single broadcast creates 50,000 inserts in `student_notifications`. |
| **Index maintenance** | Indexes slow down INSERT-heavy workloads as they grow. |
| **Lock contention** | Bulk inserts can block reads and vice versa. |
| **Backup & recovery time** | Larger tables = longer `pg_dump` and restore. |

### 2.5 Solutions to Scale

| Solution | Description |
|----------|-------------|
| **Cursor-based pagination** | Replace `OFFSET` with a `WHERE created_at < :last_seen_timestamp` cursor. O(1) instead of O(n). |
| **Table partitioning** | Range-partition `student_notifications` by `created_at` (monthly). Old partitions can be archived or detached. |
| **Read replicas** | Route read queries (GET notifications) to replicas; keep the primary for writes. |
| **Batch inserts** | For "Notify All", use `INSERT … SELECT` or `COPY` in batches of 1,000–5,000 rows with a message queue. |
| **Archival / TTL** | Move notifications older than 6 months to a `student_notifications_archive` table or cold storage. |
| **Connection pooling** | Use PgBouncer to avoid connection exhaustion under load. |
| **Caching** | Cache unread counts and recent notifications in Redis (detailed in Stage 4). |

### 2.6 SQL Queries Mapped to REST APIs

#### Q1 — `POST /auth/login` → Fetch user by email

```sql
SELECT id, name, email, password_hash, role
FROM users
WHERE email = $1;
```

_(Password verification happens in application code using bcrypt compare.)_

---

#### Q2 — `GET /notifications` → Paginated notifications for student

**With cursor-based pagination and optional type filter:**

```sql
SELECT
    n.id,
    n.type,
    n.title,
    n.message,
    n.priority,
    sn.is_read,
    sn.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1                          -- authenticated user
  AND ($2::notification_type IS NULL OR n.type = $2)  -- optional type filter
  AND ($3::boolean IS NULL OR sn.is_read = $3)        -- optional read filter
  AND sn.created_at < $4                              -- cursor: last seen timestamp
ORDER BY sn.created_at DESC
LIMIT $5;                                            -- page size
```

---

#### Q3 — `GET /notifications/:id` → Single notification

```sql
SELECT
    n.id, n.type, n.title, n.message, n.priority, sn.is_read, sn.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = $1
  AND n.id = $2;
```

---

#### Q4 — `PATCH /notifications/:id/read` → Mark one as read

```sql
UPDATE student_notifications
SET is_read = TRUE, read_at = NOW()
WHERE student_id = $1
  AND notification_id = $2
  AND is_read = FALSE;
```

---

#### Q5 — `PATCH /notifications/read-all` → Mark all unread as read

```sql
UPDATE student_notifications
SET is_read = TRUE, read_at = NOW()
WHERE student_id = $1
  AND is_read = FALSE;
```

Returns `updatedCount` via the affected-rows count.

---

#### Q6 — `GET /notifications/unread-count` → Badge count

```sql
SELECT COUNT(*) AS unread_count
FROM student_notifications
WHERE student_id = $1
  AND is_read = FALSE;
```

---

#### Q7 — `POST /admin/notifications` → Create & broadcast notification

```sql
-- Step 1: Insert the notification template
INSERT INTO notifications (type, title, message, priority, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING id;

-- Step 2: Fan-out to all students (or a subset)
INSERT INTO student_notifications (student_id, notification_id)
SELECT id, $notification_id
FROM users
WHERE role = 'student';
```

---
