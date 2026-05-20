# Anti-Pattern Investigation Report

Issue: `COL-10`
Date: 2026-05-20

## Scope and approach

The repository is minimal and most executable code is concentrated under `.opencode/tool/` and `.opencode/plugins/`. This report focuses on maintainability, security, observability, and correctness anti-patterns with concrete file evidence.

## Key findings

### 1) Excessive startup/debug logging in production paths (High)

- Evidence: `.opencode/tool/create-pull-request.js:15`, `.opencode/tool/create-pull-request.js:16`, `.opencode/tool/create-pull-request.js:20`, `.opencode/tool/create-pull-request.js:24`, `.opencode/tool/create-pull-request.js:89`, `.opencode/tool/create-pull-request.js:97`, `.opencode/tool/create-pull-request.js:98`, `.opencode/tool/create-pull-request.js:99`
- Anti-pattern: unconditional `console.log` calls at module load and runtime in a tool that handles auth/session data.
- Why it matters:
  - Increases log noise and makes signal extraction harder during incidents.
  - Risks exposing operational metadata (session ID presence, auth token state, endpoint details).
  - Couples normal execution with ad hoc diagnostics.
- Recommendation:
  - Replace raw logs with structured logger calls gated by log level (`debug`/`trace`).
  - Redact or avoid auth/session-related fields entirely.
  - Keep one concise info log per major action with stable keys.

### 2) Inconsistent error handling contract across tools (High)

- Evidence: `.opencode/tool/slack-notify.js:34` to `.opencode/tool/slack-notify.js:42`, `.opencode/tool/slack-notify.js:127`, `.opencode/tool/spawn-task.js:50`, `.opencode/tool/cancel-task.js:30`, `.opencode/tool/get-task-status.js:33`, `.opencode/tool/create-pull-request.js:147`
- Anti-pattern: some tools return plain strings, while `slack-notify` returns JSON-serialized envelopes.
- Why it matters:
  - Callers must special-case parsing behavior per tool.
  - Error handling logic is duplicated and brittle in orchestration layers.
  - Harder to build consistent UX and telemetry.
- Recommendation:
  - Define one shared result shape (`{ ok, reason, message, data? }`) for all tools.
  - Use helper utilities in `_bridge-client.js` to normalize HTTP and transport errors.
  - Keep user-facing rendering separate from machine-facing return structure.

### 3) Module-level hard failure on missing environment (Medium)

- Evidence: `.opencode/tool/_bridge-client.js:11` to `.opencode/tool/_bridge-client.js:13`
- Anti-pattern: throwing during module import when `SANDBOX_AUTH_TOKEN` is missing.
- Why it matters:
  - A single env misconfiguration can crash all dependent tool loading before graceful fallback.
  - Prevents partial system functionality and clear per-call error reporting.
- Recommendation:
  - Defer validation to request-time (`bridgeFetch`) and return typed actionable errors.
  - If startup validation is required, centralize it and emit one controlled health signal.

### 4) Repeated session parsing and bridge config logic (Medium)

- Evidence: `.opencode/tool/create-pull-request.js:34` to `.opencode/tool/create-pull-request.js:46`, `.opencode/tool/_bridge-client.js:17` to `.opencode/tool/_bridge-client.js:26`, `.opencode/plugins/codex-auth-plugin.js:34` to `.opencode/plugins/codex-auth-plugin.js:41`
- Anti-pattern: duplicated environment/session parsing behavior across files.
- Why it matters:
  - Drift risk: changes to session schema or fallback behavior can diverge silently.
  - Higher maintenance cost and duplicated bug surface.
- Recommendation:
  - Move session/config resolution to a shared utility module.
  - Standardize return type and failure semantics.
  - Add unit tests for malformed/missing `SESSION_CONFIG`.

### 5) Mutable provider model map and broad side effects (Medium)

- Evidence: `.opencode/plugins/codex-auth-plugin.js:118` to `.opencode/plugins/codex-auth-plugin.js:122`, `.opencode/plugins/codex-auth-plugin.js:125` to `.opencode/plugins/codex-auth-plugin.js:149`, `.opencode/plugins/codex-auth-plugin.js:152` to `.opencode/plugins/codex-auth-plugin.js:158`
- Anti-pattern: in-place mutation of `provider.models` and blanket cost overrides.
- Why it matters:
  - Side effects depend on call order and shared object identity.
  - Harder to reason about compatibility with other plugins/middleware.
  - Potentially masks intended model metadata from upstream sources.
- Recommendation:
  - Build a new normalized model object and assign once.
  - Restrict transformations to explicit model IDs and document policy boundaries.
  - Add regression tests for model catalog behavior.

### 6) Fallback to localhost control plane URL in shared client (Low/Medium)

- Evidence: `.opencode/tool/_bridge-client.js:8`, `.opencode/tool/create-pull-request.js:30`
- Anti-pattern: defaulting to `http://localhost:8787` when `CONTROL_PLANE_URL` is absent.
- Why it matters:
  - Can route calls to unintended local services in misconfigured environments.
  - Makes failures less explicit and harder to diagnose quickly.
- Recommendation:
  - Require explicit `CONTROL_PLANE_URL` in runtime environments.
  - If fallback is retained for local dev, gate by `NODE_ENV` and emit explicit warning once.

### 7) Sparse project-level quality guardrails (Low)

- Evidence: `.opencode/package.json:1`
- Anti-pattern: no scripts for lint/test/typecheck, no quality gates documented in repo root.
- Why it matters:
  - Increases chance of regressions and inconsistent style/error handling.
  - Slows onboarding and repeatability for future contributors.
- Recommendation:
  - Add `lint`, `test`, and `check` scripts.
  - Add minimal CI workflow enforcing those checks.

## Prioritized remediation plan

1. Standardize tool return envelopes and centralize HTTP error normalization.
2. Remove or gate diagnostic logging and redact sensitive operational context.
3. Consolidate session/env parsing into shared utilities with tests.
4. Refactor provider model transformations to immutable, explicit mapping.
5. Add project guardrails (lint/test/check + CI).

## Expected impact after remediation

- More predictable tool integration and simpler orchestrator logic.
- Lower operational risk from logging and env misconfiguration.
- Better maintainability through reduced duplication and clearer contracts.
- Faster and safer future changes with baseline quality checks.
