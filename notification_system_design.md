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


## Stage 3: Query Performance Analysis & Indexing Strategy

### 3.1 The Original Query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### 3.2 Is this query accurate?

**Partially — but it has issues:**

1. **Schema mismatch (assuming single-table design):** If the developer used a single `notifications` table with `studentID` embedded, the query is structurally correct. However, in our Stage 2 normalized schema, `studentID` and `isRead` live in `student_notifications`, not in `notifications`. The query would need a JOIN.

2. **`SELECT *` is wasteful:** It returns every column, including potentially large `message` bodies and internal metadata that the front-end doesn't need. This increases I/O, network transfer, and memory usage.

3. **`ORDER BY createdAt ASC`:** This returns **oldest first**. Students typically expect **newest notifications first** (`DESC`). This may be a functional bug.

4. **No pagination:** Without `LIMIT`, this returns *all* unread notifications at once. A student with 500 unread notifications gets all 500 in a single response — slow and wasteful.

### 3.3 Why is it slow at 50,000 students / 5,000,000 notifications?

| Cause | Explanation |
|-------|-------------|
| **Full table scan** | Without a composite index on `(studentID, isRead, createdAt)`, PostgreSQL must scan all 5 million rows, filter by `studentID`, then filter by `isRead`, then sort. |
| **`SELECT *`** | Fetches all columns. If the table has a large `TEXT` message column, each row is heavy. The DB cannot use an index-only scan. |
| **No LIMIT** | Returns unbounded rows. Even with an index, returning 1,000 rows is slower than 20. |
| **Sort on unindexed column** | `ORDER BY createdAt ASC` requires an in-memory or on-disk sort (filesort) if no index covers it. At 5M rows, this is expensive. |
| **Disk I/O** | Large result sets overflow the buffer pool, causing disk reads. |

**Estimated cost without index:** Full scan of 5M rows → filter → sort → return. **O(N)** where N = total rows.

### 3.4 Optimized Query

```sql
SELECT n.id, n.type, n.title, n.message, n.priority, sn.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = 'uuid-of-student-1042'
  AND sn.is_read = FALSE
ORDER BY sn.created_at DESC
LIMIT 20;
```

**With this composite index:**

```sql
CREATE INDEX idx_student_unread_partial
    ON student_notifications (student_id, created_at DESC)
    WHERE is_read = FALSE;
```

**Cost with index:** The query performs an **index scan** on the partial index → finds only unread rows for that student → returns them already sorted → stops after 20 rows. **O(log N + K)** where K = 20 (the LIMIT).

| Before | After |
|--------|-------|
| Full table scan: O(N) = O(5,000,000) | Index seek: O(log N + K) ≈ O(20) |
| In-memory sort of all matching rows | No sort needed (index is pre-sorted) |
| Returns all columns, all rows | Returns 6 columns, 20 rows |
| ~seconds to tens of seconds | ~1-5 milliseconds |

### 3.5 "Index every column" — Is this effective?

> *Another developer on your team suggests adding indexes on every column to be safe.*

**No. This is bad advice.** Here's why:

| Concern | Explanation |
|---------|-------------|
| **Write performance degrades** | Every `INSERT`, `UPDATE`, or `DELETE` must update *every* index. With 50,000 inserts for a "Notify All" operation, each extra index multiplies the write cost. |
| **Disk space bloat** | Each index is a separate B-Tree stored on disk. Indexing every column of a 5M-row table can double or triple storage requirements. |
| **Index maintenance overhead** | `VACUUM` and `ANALYZE` take longer. Auto-vacuum may struggle to keep up. |
| **Query planner confusion** | With too many indexes, the query planner may choose a suboptimal index or waste time evaluating all possibilities. |
| **Low-cardinality columns** | Indexing `is_read` (only `TRUE`/`FALSE`) alone is nearly useless — the index doesn't narrow the search sufficiently. A **partial index** (`WHERE is_read = FALSE`) is far better. |
| **Unused indexes waste resources** | An index on `message` (TEXT) is almost never used for lookups and is extremely expensive to maintain. |

**The correct strategy:** Create **targeted composite indexes** that match your actual query patterns. Use `EXPLAIN ANALYZE` to verify each index is used.

### 3.6 Query: Students who got a Placement notification in the last 7 days

```sql
SELECT DISTINCT u.id, u.name, u.email
FROM users u
JOIN student_notifications sn ON sn.student_id = u.id
JOIN notifications n ON n.id = sn.notification_id
WHERE n.type = 'Placement'
  AND sn.created_at >= NOW() - INTERVAL '7 days'
ORDER BY u.name;
```

**Supporting index:**

```sql
CREATE INDEX idx_placement_last7d
    ON notifications (type, created_at DESC);
```

This uses the existing `idx_notification_type` index defined in Stage 2. The `student_notifications` join leverages the `idx_student_unread` index on `student_id`.

---

## Stage 4: Caching & Performance Optimization

### 4.1 The Problem

Notifications are fetched on **every page load** for **every student**. With 50,000 students, even a modest 10 page-loads per student per day yields **500,000 DB queries/day** — and during peak hours (results announcements, placement season), this can spike by 10×.

### 4.2 Solution Architecture

```
┌──────────┐       ┌──────────────┐       ┌──────────┐       ┌────────────┐
│  Client  │──────►│   API Server │──────►│  Redis   │──────►│ PostgreSQL │
│ (React)  │◄──────│  (Express)   │◄──────│  Cache   │◄──────│     DB     │
└──────────┘       └──────────────┘       └──────────┘       └────────────┘
     │                    │
     │    WebSocket/SSE   │
     └────────────────────┘
```

### 4.3 Strategy 1: Redis Caching Layer

**How it works:**
- On first fetch, query the DB and store the result in Redis with a TTL (e.g., 60 seconds).
- Subsequent requests within the TTL are served from Redis (sub-millisecond).
- When a new notification arrives or a notification is read, **invalidate** the affected student's cache key.

**Cache key design:**

```
notifications:{student_id}:page:{page}:type:{type}  →  JSON payload (TTL: 60s)
notifications:{student_id}:unread_count              →  integer    (TTL: 30s)
```

**Pseudocode:**

```python
def get_notifications(student_id, page, type_filter):
    cache_key = f"notifications:{student_id}:page:{page}:type:{type_filter}"
    
    # 1. Try cache first
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)         # Cache HIT — ~0.5ms
    
    # 2. Cache MISS — query DB
    result = db.query("""
        SELECT n.id, n.type, n.title, n.message, sn.is_read, sn.created_at
        FROM student_notifications sn
        JOIN notifications n ON n.id = sn.notification_id
        WHERE sn.student_id = %s
        ORDER BY sn.created_at DESC
        LIMIT 20 OFFSET %s
    """, [student_id, (page - 1) * 20])
    
    # 3. Store in cache
    redis.setex(cache_key, 60, json.dumps(result))
    return result
```

| Pros | Cons |
|------|------|
| Reduces DB load by 90%+ for read-heavy workloads | Adds Redis as a dependency (infrastructure complexity) |
| Sub-millisecond reads from cache | Cache invalidation is non-trivial; stale data possible for TTL duration |
| Simple to implement | Memory cost — though notification payloads are small (~1KB per page) |

---

### 4.4 Strategy 2: Server-Sent Events (SSE) / WebSocket for Real-Time Push

**How it works:**
- Instead of polling the DB on every page load, the client opens a persistent connection.
- When a new notification is created, the server pushes it to connected clients instantly.
- The client maintains a local list and only fetches historical data once.

**Flow:**

```
1. Client opens WebSocket: wss://api/ws/notifications?token=<jwt>
2. Server registers the connection for student_id
3. On new notification → server pushes to all connected clients
4. Client prepends the new notification to its local list
5. No page-reload DB query needed
```

| Pros | Cons |
|------|------|
| True real-time — zero latency for new notifications | Persistent connections consume server memory (~10KB per WebSocket) |
| Eliminates polling entirely | 50,000 concurrent connections need horizontal scaling (WebSocket-aware load balancer) |
| Great UX — instant updates | Requires connection management (heartbeat, reconnection logic) |
| Reduces DB reads dramatically | More complex server-side implementation |

---

### 4.5 Strategy 3: HTTP Conditional Requests (ETag / If-Modified-Since)

**How it works:**
- On first request, server returns notifications with an `ETag` header (hash of the response).
- On subsequent requests, client sends `If-None-Match: <etag>`.
- If data hasn't changed, server returns `304 Not Modified` (no body, minimal cost).

```
Client:  GET /notifications  →  200 OK, ETag: "abc123"
Client:  GET /notifications, If-None-Match: "abc123"  →  304 Not Modified
```

| Pros | Cons |
|------|------|
| No extra infrastructure (no Redis needed) | Still hits the server on every request (just cheaper) |
| HTTP-native, easy to implement | DB query still runs to compute the ETag (unless ETag is cached) |
| Saves bandwidth (no body on 304) | Doesn't eliminate DB load, only reduces data transfer |

---

### 4.6 Strategy 4: Pagination with Cursor + Client-Side Cache

**How it works:**
- Use cursor-based pagination (`?after=<timestamp>`) instead of offset.
- Client caches previously loaded pages locally (localStorage / IndexedDB).
- On revisit, client requests only notifications newer than the last known timestamp.

```
GET /notifications?after=2026-05-10T09:30:00Z&limit=20
```

| Pros | Cons |
|------|------|
| Minimal data transfer — only new items | Client-side storage has limits (5MB localStorage) |
| DB query is fast (index on `created_at`) | Complexity in syncing read-status changes |
| Works well with infinite scroll UIs | Doesn't solve the "50,000 students all loading at once" problem |

---

### 4.7 Recommended Combination

For production, **combine strategies 1 + 2**:

1. **Redis cache** for API responses (handles page-load bursts, protects the DB)
2. **WebSocket push** for real-time delivery (eliminates polling for active users)
3. **Cursor-based pagination** to keep queries efficient

This gives us: real-time delivery, fast page loads, and DB protection.

---

## Stage 5: Bulk Notification — "Notify All" Redesign

### 5.1 The Original Pseudocode

```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)     # calls Email API
        save_to_db(student_id, message)     # DB insert
        push_to_app(student_id, message)    # real-time push
```

### 5.2 Shortcomings of This Implementation

| # | Problem | Detail |
|---|---------|--------|
| 1 | **Sequential processing** | 50,000 students processed one-by-one. If each iteration takes 200ms (email API + DB + push), total time = 50,000 × 200ms = **~2.8 hours**. |
| 2 | **No error handling** | If `send_email` fails for student #25,001, the loop either crashes (leaving 24,999 students un-notified) or silently skips. |
| 3 | **No retry mechanism** | The 200 failed emails are permanently lost. No dead-letter queue, no retry logic. |
| 4 | **Tight coupling** | Email, DB, and push are synchronous and coupled. If the email API is slow (rate-limited), it blocks DB writes and push notifications. |
| 5 | **No idempotency** | If the process crashes and restarts, there's no way to know which students were already processed — leading to duplicate emails/notifications. |
| 6 | **Single point of failure** | Runs on one server thread. If the server crashes at student #30,000, everything stops. |
| 7 | **DB connection exhaustion** | 50,000 individual INSERT statements (not batched) can exhaust connection pools. |
| 8 | **No backpressure** | Floods the email API with 50,000 requests — likely triggers rate limiting. |

### 5.3 The 200 Failed Emails — What Now?

The logs indicate `send_email` failed for 200 students. With the current implementation:

- **We don't know which 200 students failed** (no structured logging of failures).
- **We can't retry** without re-running the entire function (risking 49,800 duplicate emails).
- **DB and push may or may not have succeeded** for those 200 — the state is inconsistent.

**Immediate remediation:**
1. Parse logs to extract the 200 failed student IDs.
2. Manually re-run `send_email` for those IDs only.
3. Verify DB and push state for those students.

**This is exactly why we need a redesign.**

### 5.4 Should DB Save and Email Happen Together?

**No. They should be decoupled.** Here's why:

| Together (synchronous) | Separated (async) |
|------------------------|-------------------|
| If email fails, do we rollback the DB insert? The student should still see the in-app notification even if email fails. | DB write is fast and reliable (~5ms). Email is slow and unreliable (~200ms, can timeout). |
| One slow email blocks the entire pipeline. | Each channel can retry independently. |
| All-or-nothing: either everything succeeds or the student gets nothing. | Partial delivery is acceptable — in-app notification is the primary channel; email is supplementary. |

**The in-app notification (DB + push) is the primary delivery channel. Email is a best-effort secondary channel.** They have different reliability requirements and should be processed independently.

### 5.5 Redesigned Architecture

```
                                  ┌───────────────────┐
                                  │  Message Queue     │
                                  │  (RabbitMQ/Redis)  │
                                  └──┬──────┬──────┬──┘
                                     │      │      │
                              ┌──────┘      │      └──────┐
                              ▼             ▼             ▼
                     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
HR clicks            │  DB Worker   │ │  Email   │ │  Push Worker │
"Notify All"         │  (batch      │ │  Worker  │ │  (WebSocket) │
    │                │   insert)    │ │  (batch  │ │              │
    ▼                └──────────────┘ │   send)  │ └──────────────┘
┌──────────┐                          └──────────┘
│  API     │──► Enqueue 50,000 jobs       │
│  Server  │    (batched in 1,000s)       ▼
└──────────┘                         ┌──────────┐
                                     │  Dead    │
                                     │  Letter  │
                                     │  Queue   │
                                     └──────────┘
```

### 5.6 Revised Pseudocode

```python
# ─────────────────────────────────────────────
# STEP 1: API Handler — Enqueue the broadcast job
# ─────────────────────────────────────────────
function notify_all_handler(request):
    message = request.body.message
    notification_type = request.body.type
    
    # Create the notification template in DB (single row)
    notification_id = db.insert(
        "INSERT INTO notifications (type, title, message, priority, created_by) "
        "VALUES (%s, %s, %s, %s, %s) RETURNING id",
        [notification_type, request.body.title, message, request.body.priority, request.user.id]
    )
    
    # Fetch all student IDs
    student_ids = db.query("SELECT id FROM users WHERE role = 'student'")
    
    # Batch into chunks of 1,000
    batches = chunk(student_ids, 1000)
    
    for batch in batches:
        # Enqueue each batch as a separate job
        message_queue.publish("notification.db_insert", {
            "notification_id": notification_id,
            "student_ids": batch,
            "idempotency_key": generate_uuid()   # Prevents duplicate processing
        })
        message_queue.publish("notification.send_email", {
            "notification_id": notification_id,
            "student_ids": batch,
            "message": message,
            "idempotency_key": generate_uuid()
        })
        message_queue.publish("notification.push_realtime", {
            "notification_id": notification_id,
            "student_ids": batch,
            "message": message
        })
    
    return { "status": "accepted", "notification_id": notification_id, "total_recipients": len(student_ids) }


# ─────────────────────────────────────────────
# STEP 2: DB Worker — Batch insert
# ─────────────────────────────────────────────
function db_worker(job):
    try:
        # Bulk insert using a single query (not 1,000 individual inserts)
        values = [(sid, job.notification_id) for sid in job.student_ids]
        db.bulk_insert(
            "INSERT INTO student_notifications (student_id, notification_id) VALUES %s "
            "ON CONFLICT DO NOTHING",   # Idempotent — safe to retry
            values
        )
        job.acknowledge()   # Remove from queue
    except Exception as e:
        log.error(f"DB batch insert failed: {e}", job=job)
        job.retry(max_retries=3, backoff="exponential")
        # After 3 retries, move to Dead Letter Queue


# ─────────────────────────────────────────────
# STEP 3: Email Worker — Batch send with retry
# ─────────────────────────────────────────────
function email_worker(job):
    failed_ids = []
    
    for student_id in job.student_ids:
        try:
            send_email(student_id, job.message)
        except EmailAPIError as e:
            log.warn(f"Email failed for {student_id}: {e}")
            failed_ids.append(student_id)
    
    if failed_ids:
        # Re-enqueue only the failed ones for retry
        message_queue.publish("notification.send_email", {
            "notification_id": job.notification_id,
            "student_ids": failed_ids,
            "message": job.message,
            "retry_count": job.retry_count + 1,
            "idempotency_key": job.idempotency_key
        })
    
    if job.retry_count >= 3:
        # Move permanently failed emails to Dead Letter Queue
        dead_letter_queue.publish({
            "type": "email_failure",
            "student_ids": failed_ids,
            "notification_id": job.notification_id,
            "error": "Max retries exceeded"
        })
        alert_ops_team(f"Email delivery failed for {len(failed_ids)} students after 3 retries")
    
    job.acknowledge()


# ─────────────────────────────────────────────
# STEP 4: Push Worker — Real-time via WebSocket
# ─────────────────────────────────────────────
function push_worker(job):
    notification = db.get_notification(job.notification_id)
    
    for student_id in job.student_ids:
        connection = websocket_manager.get_connection(student_id)
        if connection and connection.is_alive():
            connection.send({
                "event": "NEW_NOTIFICATION",
                "data": {
                    "id": notification.id,
                    "type": notification.type,
                    "title": notification.title,
                    "message": notification.message,
                    "createdAt": notification.created_at
                }
            })
        # If student is offline, they'll see it on next page load (DB is source of truth)
    
    job.acknowledge()
```

### 5.7 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Message queue** | Decouples the API response from actual processing. HR gets instant "accepted" response. |
| **Batching (1,000 per job)** | Reduces queue overhead while keeping individual jobs manageable. |
| **Idempotency keys** | Safe to retry any job without duplicates (`ON CONFLICT DO NOTHING`). |
| **Separate workers per channel** | Email, DB, and push can scale independently. Slow email API doesn't block DB inserts. |
| **Dead Letter Queue** | Permanently failed jobs are captured for manual review — no silent data loss. |
| **Exponential backoff** | Avoids hammering the email API during outages. |
| **DB insert is NOT transactional with email** | In-app notification is guaranteed; email is best-effort. A student should see the notification even if their email bounces. |

---

## Stage 6: Priority Inbox — Implementation & Approach

### 6.1 Problem Statement

Display the top **N** most important unread notifications based on:
- **Weight:** Placement (3) > Result (2) > Event (1)
- **Recency:** More recent notifications rank higher within the same type

### 6.2 Approach — Min-Heap of Size N

We use a **Min-Heap** (Python's `heapq`) capped at size N to efficiently maintain the top N notifications.

**Priority Score Formula:**

```
score = type_weight * 1,000,000 + unix_timestamp
```

This ensures weight is the **primary** sorting factor and recency is the **tiebreaker** within the same type.

### 6.3 Algorithm

```
1. Initialize an empty min-heap of capacity N
2. For each notification in the stream:
   a. Compute its priority_score
   b. If heap.size < N:  push the notification
   c. Else if notification.score > heap.min.score:
      → heapreplace (pop min, push new) — O(log N)
   d. Else: discard — O(1)
3. Extract sorted top-N: sort the heap in descending order — O(N log N)
```

### 6.4 Complexity Analysis

| Operation | Time | Space |
|-----------|------|-------|
| Insert one notification | O(log N) | O(1) |
| Build from M notifications | O(M log N) | O(N) |
| Get sorted top-N | O(N log N) | O(N) |
| Peek at minimum | O(1) | — |

For N=10 and M=100 notifications: ~100 * log(10) ≈ 330 comparisons — extremely fast.

### 6.5 Handling New Incoming Notifications

When a new notification arrives (from WebSocket or API polling):

1. **Compare** its score with the heap's minimum (O(1) peek).
2. If higher → **replace** the minimum with `heapreplace()` → O(log N).
3. If lower → **discard** → O(1).

The top-N is maintained **incrementally** — no need to re-sort all notifications.

### 6.6 Implementation

See [`priority_inbox/priority_inbox.py`](./priority_inbox/priority_inbox.py) for the complete working implementation.

**Output screenshots:** See [`priority_inbox/screenshots/`](./priority_inbox/screenshots/) directory.

---
