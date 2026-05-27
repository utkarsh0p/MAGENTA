# AGENTS.md

## Project

This repository is the backend workspace for `HumanTouch`.

HumanTouch is a company agent management webapp where an admin can create,
assign, and manage AI agents for employees. The sibling frontend lives at
`../FRONTEND` and should consume this backend as the source of truth for users,
companies, roles, agents, assignments, sessions, provider connections, and
permissions.

This backend should be built as a focused product API and agent runtime, not as
a generic platform or a copy of a larger parent app.

## Current Rebuild Status

This workspace is being rebuilt from scratch based on the prior
`/home/utkarsh_singh/Desktop/Human_Touch` project direction.

The current `BACKEND/package.json` does not yet include Prisma or PostgreSQL
dependencies. Prisma and the database schema described in `SCHEMA.md` are target
architecture for the rebuild unless and until they are implemented here.

When database work starts:

- put Prisma under `BACKEND/prisma/`
- keep product tables in the `humantouch` PostgreSQL schema
- keep LangGraph checkpoint tables in the `langgraph` PostgreSQL schema
- do not model LangGraph checkpoint tables in Prisma
- prefer Prisma migrations for HumanTouch product table changes

## Backend Scope

Build the backend around:

- Fastify APIs
- PostgreSQL persistence
- Prisma-managed product tables once Prisma is added
- LangGraph execution
- LangGraph checkpoint persistence
- Google Gemini model execution
- SSE chat streaming
- company-scoped authorization
- provider integration state and OAuth flows

Keep the backend simple enough for one developer to understand and operate, but
structured enough that the frontend can rely on clear contracts.

## Product Model

The intended product assumptions are:

- one seeded demo company
- one seeded admin user
- one built-in `Admin` agent
- admin-created custom agents
- direct user assignments and role-based assignments
- multiple chat sessions per user
- per-session employee `user_prompt`
- backend-generated and stored `system_prompt` per agent

Keep agent definitions, assignments, session metadata, and conversation messages
as separate concepts in the data model and API surface.

## Backend Responsibilities

The backend owns:

- request user context
- HumanTouch authentication and session validation
- company scoping
- authorization and role checks
- agent visibility and assignment rules
- tool access validation
- provider token storage and connection state
- LangGraph runtime state construction
- model execution through Google Gemini
- chat session and message persistence
- SSE stream lifecycle and error handling
- LangGraph checkpoint persistence

Do not rely on prompts as the only access control layer. Prompt text can guide
agent behavior, but permission-sensitive actions must be enforced in backend
code before any tool or mutation runs.

## Frontend Contract

The frontend is in `../FRONTEND`.

Expose stable, small route contracts for:

- current authenticated user
- agents
- agent assignments
- sessions
- session messages and history
- SSE chat streaming
- provider connection state
- provider connect and disconnect flows

Prefer boring JSON shapes, explicit IDs, and predictable status codes. Treat
`thread_id` as the chat session identifier where chat/runtime compatibility
requires it.

The frontend should not need to duplicate backend authorization logic beyond
basic UI visibility. Backend responses should make allowed actions and denied
states clear enough for the UI to render loading, empty, unauthorized, and error
states cleanly.

Update `ROUTES.md` in the same change when adding, renaming, or removing
backend routes.

## Auth And Provider Integrations

Keep HumanTouch app login separate from connected external provider accounts.

HumanTouch auth identifies the app user and controls workspace access, agent
permissions, sessions, and company scoping.

Provider integrations such as Google, GitHub, LinkedIn, and Meta are external
tool connections, not necessarily login methods.

Provider backend rules:

- store provider connection state per HumanTouch user and provider
- never assume the HumanTouch login email matches the provider email
- return connected provider accounts as provider-specific identities
- connect routes should start the provider OAuth flow
- disconnect routes should revoke or clear stored tokens where supported
- do not expose provider tokens to the frontend
- support both local `humantouch_session` cookie users and NextAuth-compatible
  callers only where an integration route explicitly requires that bridge

## Agent Runtime Guidelines

Keep runtime construction explicit:

- load the authenticated user and company context first
- resolve the requested session and agent through backend authorization
- build system prompt state from persisted agent configuration
- include per-session `user_prompt` only for that user's session
- validate tool access before exposing tools to the graph
- persist user and assistant messages consistently
- stream user-visible progress and final output over SSE
- keep checkpoint keys stable and tied to `thread_id`

Do not bake broad admin power into the runtime by default. Admin-only tools must
still require admin authorization at execution time.

The main workflow should remain the single graph entrypoint. Route admin and
employee behavior into separate subgraphs when that distinction exists, while
keeping selected-agent execution dynamic and database-driven.

## API And Data Guidelines

When implementing backend data access:

- prefer Prisma for product tables once database work is added
- keep database writes transactional when a workflow spans related tables
- prefer backend IDs over display names for mutations
- make company scoping part of queries, not an afterthought
- return explicit unauthorized or forbidden responses instead of empty success
  when permissions fail
- keep route contracts small and easy to evolve during early development
- avoid MongoDB-specific assumptions anywhere in naming or persistence design
- keep secrets, OAuth tokens, and API keys out of logs and responses

Use migrations and seeds deliberately. Seed data should make local development
easy without becoming hidden production behavior.

## Database Schema Direction

`SCHEMA.md` is the canonical backend database-design reference.

The intended PostgreSQL ownership boundary is:

- `humantouch`: HumanTouch product tables managed by Prisma
- `langgraph`: LangGraph checkpoint tables created and maintained by
  LangGraph's `PostgresSaver`
- `public`: default PostgreSQL schema; not the HumanTouch app-table target

Product tables should cover real companies, users, local auth sessions,
connected provider accounts, agents, assignments, session metadata, and
SQL-readable message history.

Keep app tables separate from LangGraph checkpoint tables. The checkpointer is
for runtime graph state and resumability; it is not the only source of truth for
the product model, access control, or UI session list.

## Suggested Backend Shape

As this rebuild grows, keep boundaries clear:

- `src/server.ts` for server construction and startup
- `src/routes/` for HTTP route modules
- `src/auth/` for app auth, sessions, and request user context
- `src/db/` and `prisma/` for Prisma client, schema, migrations, and seeds
- `src/agents/` for agent definitions, prompt building, and assignment logic
- `src/chat/` for sessions, messages, SSE streaming, and runtime orchestration
- `src/graph/` for LangGraph nodes, state, checkpoints, and execution helpers
- `src/providers/` for OAuth providers and connected-account state
- `src/permissions/` for shared authorization checks

Do not add abstraction layers before the code needs them. Keep modules small,
named for product concepts, and easy to inspect.

## Current Non-Goals

Do not add these unless explicitly requested:

- multi-provider model abstraction
- MCP integrations
- vector search or RAG
- additional built-in agents beyond `Admin`
- full multi-agent delegation workflows
- background job dashboards
- websocket infrastructure when SSE is sufficient
- premature multi-tenant platform abstractions
- prompt-only authorization
- a separate backend source of truth that conflicts with the frontend contract

## Guardrails

- no sensitive external action without approval
- never rely on prompts as the only access control layer
- keep role-based access control visible in the product model
- keep v1 small and extensible
- keep backend permissions aligned with frontend visibility
- keep HumanTouch auth distinct from provider OAuth connections
- avoid leaking secrets, tokens, prompts, or internal graph state in responses
- prefer clear interfaces between API routes, authorization, persistence, and
  runtime execution

## Local Working Rules

- Read this file before making product or architecture decisions in this repo.
- Read `SCHEMA.md` before making database, auth/access, assignments, sessions,
  prompt storage, message history, or checkpoint changes.
- Check `../FRONTEND/AGENTS.md` when backend changes affect frontend contracts.
- Keep changes scoped to the requested backend behavior.
- Do not invent frontend requirements when an API contract is unknown; inspect
  the frontend or ask for the route contract.
- Run relevant checks before finishing when a project structure and scripts
  exist.
- If the backend is empty or partially scaffolded, scaffold conservatively and
  document any assumptions in code or setup notes.
