# Pastebin-Lite

A lightweight Pastebin-like application that allows users to create and share text pastes with optional expiry time and view limits. The project is built as part of a take-home assignment and focuses on clean API design, persistence, and testability.

---

## Features

* Create a paste with plain text content
* Generate a shareable URL for each paste
* Optional **time-to-live (TTL)** for automatic expiration
* Optional **maximum view count**
* View pastes in a browser using an HTML page
* Fetch pastes programmatically using a JSON API
* Deterministic expiry support for automated testing
* Redis-based persistence (not in-memory)

---

## Tech Stack

* **Node.js**
* **Express.js**
* **Redis (Upstash Redis)** for persistence
* Vanilla HTML for browser rendering

---

## API Endpoints

### Health Check

```
GET /api/healthz
```

Returns HTTP 200 and JSON response.
This endpoint also verifies that the application can access Redis, ensuring the persistence layer is available.

Example response:

```json
{ "ok": true }
```

---

### Create a Paste

```
POST /api/pastes
```

Request body:

```json
{
  "content": "Hello world",
  "ttl_seconds": 60,
  "max_views": 3
}
```

* `content` is required
* `ttl_seconds` and `max_views` are optional and must be integers ≥ 1

Response:

```json
{
  "id": "uuid",
  "url": "http://localhost:3000/p/<id>"
}
```

---

### Fetch a Paste (API)

```
GET /api/pastes/:id
```

Returns the original content and metadata in JSON format.

Example response:

```json
{
  "content": "Hello world",
  "remaining_views": 2,
  "expires_at": "2025-01-01T12:00:00.000Z"
}
```

Returns 404 if the paste is expired, not found, or view limit is exceeded.

---

### View a Paste (Browser)

```
GET /p/:id
```

* Returns an **HTML page**
* Content is rendered inside a `<pre>` tag
* Content is safely escaped to prevent XSS
* Intended for human/browser viewing

---

## Persistence Layer

This application uses **Redis (Upstash Redis)** as its persistence layer.

* All pastes are stored in Redis using unique keys
* Redis TTL is used to enforce automatic expiration
* Data survives across requests and server restarts
* Suitable for serverless deployments (e.g., Vercel)

In-memory storage is intentionally avoided.

---

## Deterministic Time for Testing

The application supports deterministic expiry testing.

* When `TEST_MODE=1` is set as an environment variable:

  * The request header `x-test-now-ms` is treated as the current time **for expiry logic only**
* If the header is absent, real system time is used

This allows automated tests to validate TTL behavior without waiting in real time.

---

## Running Locally

### Prerequisites

* Node.js (v18+ recommended)
* Redis instance (Upstash or local)

### Steps

```bash
npm install
node src/server.js
```

The server will start on:

```
http://localhost:3000
```

---

## Notes

* API routes return JSON and are intended for programmatic use
* The `/p/:id` route is intentionally separate and returns HTML for browser viewing
* Validation errors return appropriate HTTP 4xx responses

---

## Summary

This project demonstrates clean backend design with:

* Proper separation of API and UI routes
* External persistence
* Strong input validation
* Deterministic testing support



