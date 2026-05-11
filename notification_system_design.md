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
