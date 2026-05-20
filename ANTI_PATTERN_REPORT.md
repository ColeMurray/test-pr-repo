# Anti-Patterns Investigation Report

## Summary
I reviewed the repository and focused on runtime reliability and safety patterns in the OpenCode tool/plugin code. I identified several anti-patterns and made concrete fixes where behavior was clearly risky.

## Investigated Areas
- `.opencode/tool/_bridge-client.js`
- `.opencode/tool/create-pull-request.js`
- `.opencode/plugins/codex-auth-plugin.js`

## Findings and Remediation

1. Module-level exception from configuration assumptions
- **Location:** `.opencode/tool/_bridge-client.js`
- **Pattern:** Throwing during module initialization when `SANDBOX_AUTH_TOKEN` is missing.
- **Why it is an anti-pattern:** Any import of the module fails hard even when the caller could gracefully handle the missing env at runtime.
- **Fix implemented:** Moved token validation into `bridgeFetch()` so the module loads successfully and returns actionable errors only when a request is attempted.

2. Null-unsafe auth checks in authentication plugin
- **Location:** `.opencode/plugins/codex-auth-plugin.js`
- **Pattern:** Accessing `auth.type` and `currentAuth.type` directly without null-safety.
- **Why it is an anti-pattern:** If `getAuth()` returns nullish, plugin execution can crash before making a request.
- **Fix implemented:** Added optional chaining (`auth?.type`, `currentAuth?.type`) before type checks and normalized model handling with a local `providerModels` object.

3. Over-logging and noisy side effects in PR tool
- **Location:** `.opencode/tool/create-pull-request.js`
- **Pattern:** Multiple debug `console.log` calls and duplicated session/env parsing logic.
- **Why it is an anti-pattern:** Logs leak operational internals and can clutter tool output in normal execution.
- **Fix implemented:** Removed startup argument/credential logging, reused shared session resolution from `_bridge-client`, and improved response/error handling.

4. Missing validation before making PR requests
- **Location:** `.opencode/tool/create-pull-request.js`
- **Pattern:** Sending request even when current branch or session cannot be resolved.
- **Why it is an anti-pattern:** It yields unclear control-plane errors and weakens user feedback.
- **Fix implemented:** Added explicit pre-flight checks for session ID and current branch before request; added deterministic non-JSON response handling.

## Remaining Opportunities
- Add unit coverage for `_bridge-client` session resolution and `create-pull-request` validation paths.
- Consolidate duplicated model metadata for injected Codex models behind shared constants to avoid future drift.
