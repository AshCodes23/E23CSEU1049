# Campus Notification Platform

This repository contains the complete, multi-stage implementation of a real-time Campus Notification Platform designed for scalability, performance, and user engagement.

## Project Structure

The project is divided into several logical components as per the design requirements:

### 1. System & Database Design (`notification_system_design.md`)
A comprehensive technical document outlining:
- REST API contracts (JSON schemas, endpoints, response headers)
- Real-time WebSocket communication design
- Relational Database schema (PostgreSQL) with indexing strategies
- Query optimization and computational cost analysis
- Caching strategies (Redis) to mitigate database load
- Bulk notification architecture using asynchronous message queues (RabbitMQ)

### 2. Priority Inbox Algorithm (`priority_inbox/`)
- Contains a standalone Python implementation (`priority_inbox.py`) of a Min-Heap based algorithm to efficiently calculate and maintain the top N most important notifications based on weight (Placement > Result > Event) and recency.
- Includes output screenshots demonstrating the sorting logic.

### 3. Backend Service (`notification_app_be/`)
- A production-grade Node.js / Express backend server.
- Exposes a `GET /api/priority-inbox` endpoint that executes the Min-Heap priority algorithm.
- Includes a global **Logging Middleware** utilizing `winston` and `morgan` to capture structured logs, HTTP methods, status codes, and response times.

### 4. Frontend Application (`notification_app_fe/`)
- A responsive, high-performance web application built with **React, TypeScript, Vite, and Material UI**.
- Features a premium dark-themed "glassmorphism" UI.
- Implements tabs to filter notifications by type (Placement, Result, Event).
- Integrates the Priority Inbox feature with a dynamic slider to adjust the Top N notifications displayed.
- Tracks "New" vs "Viewed" notifications using local storage persistence.

## How to Run

### Backend
1. Navigate to `notification_app_be/`
2. Install dependencies: `npm install`
3. Start the server: `node server.js` (Runs on `http://localhost:4000`)

### Frontend
1. Navigate to `notification_app_fe/`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev` (Runs on `http://localhost:3000`)

## Screenshots & Demonstration
- Output screenshots of the Priority Inbox algorithm can be found in `priority_inbox/screenshots/`.
- A video demonstration of the React frontend application is located at `notification_app_fe/video_recording.webp`.
