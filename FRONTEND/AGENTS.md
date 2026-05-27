# AGENTS.md

## Project

This repository is the frontend workspace for `HumanTouch`.

HumanTouch is a company agent management webapp where an admin can create,
assign, and manage AI agents for employees. The backend is expected to provide
Fastify APIs, LangGraph execution, PostgreSQL persistence, Prisma-managed
product tables once persistence is implemented, and SSE chat streaming.

Backend Fastify route documentation is maintained in
`../BACKEND/ROUTES.md`. Inspect that file before wiring or changing frontend API
calls. Database and schema direction lives in `../BACKEND/SCHEMA.md`.

This frontend should be built as a focused app UI, not as a marketing site.

## Frontend Scope

Build the frontend around:

- Next.js
- Tailwind CSS
- a simple admin-first product experience
- backend-persisted chat sessions and history
- a current-agent chat surface
- agent creation, editing, and assignment workflows
- provider integration controls for external tool accounts

The UI should assume the backend is the source of truth for users, companies,
roles, agents, assignments, sessions, provider connections, and permissions.

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

Design frontend state so agent definitions, assignments, session metadata, and
conversation messages remain separate concepts.

## Expected UX

The first usable app should prioritize:

- a sidebar for sessions
- a main chat area
- a visible current agent indicator
- clear session creation and session history restoration
- room for future execution/progress state
- admin surfaces for agent management and assignment

Keep the interface useful as the first screen. Do not make a landing page unless
explicitly requested.

## Admin UX

Admin users should be able to:

- view available agents
- create custom agents
- edit custom agents
- assign agents to employees
- assign agents to roles
- access company-scoped session and agent data

Do not imply that prompt-only restrictions are sufficient. Permission-sensitive
actions must rely on backend authorization.

## Employee UX

Normal employees should eventually:

- log in
- see only agents assigned to them
- create and resume chat sessions
- chat with assigned agents
- maintain their own session-level style prompt

Frontend visibility should follow backend permissions. Do not hard-code broad
employee access in the UI.

## Auth And Provider Integrations

Keep HumanTouch app login separate from connected external provider accounts.

HumanTouch auth identifies the app user and controls workspace access, agent
permissions, sessions, and company scoping.

Provider integrations such as Google, GitHub, LinkedIn, and Meta are external
tool connections, not necessarily login methods.

Provider UI rules:

- show the current HumanTouch user email near provider connection controls
- show connected provider accounts as `Connected as <provider email/account id>`
- use an on/off toggle pattern for provider connections
- off/not connected starts the provider OAuth connect flow
- on/connected disconnects the provider and clears stored tokens
- do not imply the HumanTouch login email must match provider emails

Frontend integration proxy routes should support both NextAuth users and local
`humantouch_session` cookie users when the backend requires that compatibility.

## Backend Contract Expectations

Assume the backend exposes stable, simple route contracts for:

- current authenticated user
- agents
- agent assignments
- sessions
- session messages/history
- SSE chat streaming
- provider connection state
- provider connect and disconnect flows

The backend owns:

- request user context
- company scoping
- authorization
- tool access validation
- LangGraph runtime state construction
- model execution through Google Gemini
- PostgreSQL persistence
- LangGraph checkpoint persistence

The frontend should not duplicate backend authorization logic beyond basic UI
visibility and affordance checks.

## API And State Guidelines

When implementing frontend data access:

- keep API wrappers typed and centralized when practical
- model loading, empty, error, and unauthorized states explicitly
- treat `thread_id` as the chat session identifier
- preserve session state from backend data rather than local-only history
- keep optimistic updates conservative for permission-sensitive flows
- prefer backend IDs over display names for mutations
- keep route contracts small and easy to change during early development

## Design Guidelines

Use `style/STYLES.md` for visual direction.

The current HumanTouch style direction is bold, editorial, confident, and
structured while still working as an admin webapp. Prefer high-contrast
full-surface sections and panels, strong color blocking, clear horizontal rules,
uppercase section labels, and large typographic hierarchy where the screen calls
for it.

Keep dense admin controls smaller and more utilitarian. Do not use oversized
display text inside tables, forms, sidebars, buttons, or compact panels.

General frontend rules:

- favor structured Tailwind styling
- use clear navigation and predictable layouts
- keep controls compact and work-focused
- avoid decorative hero sections in the app shell
- avoid nested cards
- avoid one-note color palettes
- use icons from `lucide-react` for action buttons when icons are needed
- ensure text fits across mobile and desktop viewports
- make important state visible without explanatory marketing copy

Build workflows that feel complete enough for an admin to use repeatedly.

## Architecture Direction

Keep the frontend ready for a larger backend integration later:

- do not create a separate frontend-only source of truth for companies, users,
  roles, or permissions
- do not bake in assumptions from one proprietary parent app schema
- keep HumanTouch-specific UI concepts isolated enough to adapt to reused
  parent-app users, roles, and company data
- keep agent management, chat sessions, and provider integrations as distinct
  modules or routes when the app grows

## Current Non-Goals

Do not add these unless explicitly requested:

- `shadcn/ui`
- multi-provider model abstraction
- MCP integrations
- vector search or RAG
- additional built-in agents beyond `Admin`
- full multi-agent delegation workflows
- background job dashboards
- websocket infrastructure when SSE is sufficient
- premature multi-tenant UI abstractions

## Guardrails

- no sensitive external action without approval
- never rely on prompts as the only access control layer
- keep role-based access control visible in the product model
- keep v1 small and extensible
- keep the frontend aligned with backend-owned permissions
- avoid MongoDB-specific assumptions anywhere in naming, copy, or state models
- prefer clear interfaces between UI, API access, and local presentation state

## Local Working Rules

- Read this file before making product or architecture decisions in this repo.
- Pull in backend documentation only when needed for a task.
- Read `../BACKEND/ROUTES.md` before wiring or changing API calls.
- Read `../BACKEND/SCHEMA.md` only when frontend work touches database-backed
  concepts such as users, companies, roles, assignments, sessions, prompts, or
  message history.
- Do not invent backend behavior when an API contract is unknown; inspect the
  backend or ask for the route contract.
- Keep changes scoped to the requested frontend behavior.
- Run relevant checks before finishing when a project structure and scripts
  exist.
