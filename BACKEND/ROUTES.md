# ROUTES.md

This file tracks the backend HTTP routes exposed by HumanTouch.

When adding, renaming, or removing a route, update this file in the same change
so another agent can quickly understand the API surface and the preferred route
contract.

## Routes

### `GET /health`

Simple health check for the Fastify server.

Use this route to verify that the backend process is running and accepting
requests. It does not validate external dependencies such as Gemini,
PostgreSQL, or LangGraph checkpoint storage.

Response:

```json
{
  "ok": true,
  "service": "humantouch-backend"
}
```

### `POST /api/auth/signup`

Creates a local HumanTouch user in PostgreSQL and starts a browser session with
the `humantouch_session` HttpOnly cookie.

Request body:

```json
{
  "name": "HumanTouch Admin",
  "email": "admin@example.com",
  "password": "password123"
}
```

Responses:

- `201`: `{ "user": { ... } }`
- `409`: email is already registered
- `400`: invalid request body

The backend stores the user in the configured app database schema and stores only
a server-side hash of the browser session token.

### `POST /api/auth/login`

Validates local HumanTouch credentials from PostgreSQL and starts a browser
session with the `humantouch_session` HttpOnly cookie.

Request body:

```json
{
  "email": "admin@humantouch.local",
  "password": "password123"
}
```

Responses:

- `200`: `{ "user": { ... } }`
- `401`: invalid email or password
- `400`: invalid request body

### `GET /api/auth/me`

Returns the current authenticated HumanTouch user for the
`humantouch_session` cookie.

Responses:

- `200`: `{ "user": { ... } }`
- `401`: unauthorized

### `POST /api/auth/logout`

Deletes the current local auth session and clears the browser cookie.

Response:

```json
{
  "ok": true
}
```

### `POST /api/workflows/chat/stream`

Primary SSE route for the current chat workflow.

This is the preferred route name for the initial LangGraph workflow phase. The
workflow is chat-only today, but the route is namespaced under `workflows` so the
backend can grow into additional LangGraph workflow routes without making the
API naming feel temporary.

Request body:

```json
{
  "message": "Hello",
  "thread_id": "demo-thread",
  "system_prompt": "Optional system prompt",
  "user_prompt": "Optional user preference prompt"
}
```

Fields:

- `message`: required user message to send through the chat workflow.
- `thread_id`: optional chat session/workflow thread identifier. Defaults to
  `demo-thread` in the current initial implementation.
- `system_prompt`: optional temporary system prompt override.
- `user_prompt`: optional per-session user preference prompt.

SSE events:

- `start`: emitted when the stream opens.
- `token`: emitted for streamed model text chunks.
- `done`: emitted when the workflow completes.
- `error`: emitted when the workflow stream fails after the SSE response starts.

### `POST /api/chat/stream`

Backward-compatible alias for `POST /api/workflows/chat/stream`.

Keep this route while the frontend or local callers still use the older chat
route name. New callers should prefer `/api/workflows/chat/stream`.
