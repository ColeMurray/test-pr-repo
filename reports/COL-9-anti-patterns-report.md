# COL-9: Anti-Pattern Investigation Report

## Scope and method

This review focused on the full tracked repository contents in the current branch (`main`) and assessed maintainability, testability, and delivery hygiene.

## Findings

### 1) Missing project purpose and usage documentation

- **Evidence:** `README.md` only contains a one-line title.
- **Anti-pattern:** A placeholder README prevents contributors from understanding intent, setup, and expected behavior.
- **Impact:** Slower onboarding, unclear ownership boundaries, and increased risk of incorrect changes.

### 2) No test strategy or quality gates

- **Evidence:** No test directories/files and no test workflow/configuration in the visible codebase.
- **Anti-pattern:** Shipping without automated verification causes regressions to go undetected.
- **Impact:** Low confidence in changes and manual verification burden for every update.

### 3) Ambiguous and non-descriptive file naming

- **Evidence:** `test-file.txt`, `v2_test.txt`, and `.test_pr` use temporary naming conventions.
- **Anti-pattern:** Generic names and version suffixes (`v2`) encode change history rather than domain meaning.
- **Impact:** Difficult discovery, duplicated artifacts, and uncertain source of truth.

### 4) Hidden dotfiles used as primary content without conventions

- **Evidence:** `.test_pr` and `.v1-slack` appear as top-level hidden files without documented purpose.
- **Anti-pattern:** Dotfiles are typically for tooling/config, not core project artifacts.
- **Impact:** Important files are easy to miss and behavior can become environment-dependent.

### 5) Weak repository structure and domain boundaries

- **Evidence:** Core files are flat at repo root with no domain-oriented directories.
- **Anti-pattern:** Flat repositories do not scale and obscure separation of concerns.
- **Impact:** Higher cognitive load and increasing refactor cost as the project grows.

## Prioritized remediation plan

1. Expand `README.md` with purpose, setup, contribution flow, and validation steps.
2. Introduce a minimal automated test and CI check (even a smoke test) to enforce baseline quality.
3. Rename artifacts to domain-specific names and remove versioned filename suffixes.
4. Move non-configuration data out of hidden dotfiles, or document dotfile intent explicitly.
5. Define a lightweight directory convention (for example: `docs/`, `data/`, `scripts/`, `tests/`).

## Suggested follow-up metrics

- README completeness checklist (purpose, setup, run, test, contribute).
- Percentage of PRs with automated checks passing.
- Number of temporary/versioned filenames at repo root.
- Time for a new contributor to run and validate the project.
