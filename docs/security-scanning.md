# Security scanning (SAST, DAST, supply chain)

> Plan and status of the automated security checks. Workflow: `.github/workflows/security.yml`.
> Requirements: REQ-SEC-003, REQ-SEC-006, REQ-SEC-007, REQ-SEC-009, REQ-PRIV-005.

## Layers

| Layer                    | What                                                    | Where                                       | Runs              | Blocks merge?       |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------- | ----------------- | ------------------- |
| SAST                     | CodeQL `security-extended` for TypeScript and workflows | `security.yml#codeql`                       | PR, main, weekly  | Yes (`security-ok`) |
| Workflow lint            | actionlint, zizmor, pinning policy test                 | `ci.yml#workflow-lint`, `ci-policy.test.ts` | PR                | Yes                 |
| SCA                      | `pnpm audit`, dependency review, Dependabot             | `ci.yml`, `nightly.yml`                     | PR, nightly       | Yes                 |
| DAST, website            | OWASP ZAP baseline against the built site               | `security.yml#zap (website)`                | PR, main, weekly  | Yes (`security-ok`) |
| DAST, extension pages    | ZAP baseline against the static popup and options pages | `security.yml#zap (extension)`              | PR, main, weekly  | Yes (`security-ok`) |
| DAST, extension, runtime | A hostile page attacks the loaded extension in Chromium | `tests/e2e/attack-surface.spec.ts`          | PR (`ci.yml#e2e`) | Yes                 |
| DAST, extension, network | Every e2e test aborts requests to unknown hosts         | `tests/e2e/fixtures.ts` (REQ-PRIV-005)      | PR (`ci.yml#e2e`) | Yes                 |
| Secrets                  | gitleaks over the full git history                      | `security.yml#gitleaks`                     | PR, main, weekly  | Yes (`security-ok`) |
| Supply-chain score       | OpenSSF Scorecard                                       | `security.yml#scorecard`                    | main, weekly      | No                  |

## Why the extension needs its own DAST

ZAP scans HTTP servers. An extension is not one: its pages live on `chrome-extension://` and need
`browser.*`, so ZAP can only read their static markup. The real attack surface is the boundary
between a hostile web page and the running extension, so that is tested in a browser:

- the page cannot fetch extension files (no `web_accessible_resources`);
- the page has no `chrome.runtime.sendMessage` (empty `externally_connectable`);
- crafted `window.postMessage` payloads change nothing: no stored state, no injected markup, no
  prototype pollution;
- existing probes: hostile removal and `hidePopover` loops (REQ-SEC-006), strict CSP and Trusted
  Types pages (REQ-SEC-007), and the network guard (REQ-PRIV-005).

## Gating

`security-ok` (in `security.yml`) needs every other security job and is a required status check
next to `ci-ok`, so a CodeQL or gitleaks failure, or a FAIL-level ZAP alert, blocks the merge. Scorecard
is skipped on pull requests, which `security-ok` accepts. ZAP warnings (exit code 2) are reported in
the `zap-*` artifact but do not fail the job; raise a rule to FAIL in `.zap/rules.tsv` to enforce it.
A CodeQL alert fails its job only through the Security tab ruleset ("Require code scanning results"),
so turn that on as well (docs/repo-setup.md).

## Known limits

- ZAP baseline is passive. An active scan (`zap-full-scan.py`) of a static site finds little; add
  it only if the website ever gets a dynamic part.
- GitHub Pages cannot set response headers, so the website's CSP is a `<meta>` tag and ZAP reports
  the missing headers (`X-Frame-Options`, `X-Content-Type-Options`). Expect those as accepted risks.
- gitleaks scans history in CI. GitHub's own push protection (Settings → Code security) catches secrets earlier, before the push lands; turn it on too.
- Scorecard only works on a public repository.
