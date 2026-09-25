# Security policy

## Reporting a vulnerability

**Please don't open a public issue for security problems.** Report them privately through
[GitHub private vulnerability reporting](https://github.com/nielsbrakel/SiteMark/security/advisories/new)
(repository → **Security** → **Report a vulnerability**).

Please include the browser and version, the SiteMark version, steps to reproduce and the impact you see.
A proof of concept page is very welcome.

What to expect:

- An acknowledgement within **7 days**.
- An assessment and a fix plan within **30 days**. Fixes ship in a patch release and are credited in the
  advisory, unless you'd rather stay anonymous.
- Please give us reasonable time to release a fix before you disclose publicly (90 days at most).

## Supported versions

SiteMark is pre-1.0. Only the **latest release** in the browser stores receives security fixes.

## Threat model

SiteMark marks web pages you choose so you don't confuse environments (for example production and test).
The full requirements are in [docs/spec.md §5.14](docs/spec.md#514-security--sec) and the reasoning is in
[docs/decisions.md](docs/decisions.md) (D-220, D-221, D-238, D-239).

### Trust boundaries

| Component                           | Trust         | Notes                                                                                                              |
| ----------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Background (service worker)         | **Authority** | The only storage writer (D-220). Validates every message with a schema and takes origin and URL from `sender`.     |
| Popup and options pages             | Trusted       | Extension pages with a strict CSP. They send commands to the background.                                           |
| Content scripts (marker and picker) | Untrusted     | Run next to hostile pages. They only get the render plan for their own URL (D-221) and send narrow intents.        |
| Web pages                           | Hostile       | Can read, hide or restyle anything they can reach, and can see what you type into the in-page picker panel.        |
| Imported JSON files                 | Untrusted     | Parsed with strict schemas and size limits. Control and bidi characters are stripped from user text (REQ-SEC-004). |

### What SiteMark protects

- **Your data stays local.** Site groups live in `storage.local` only. SiteMark makes no network requests of
  its own, loads no remote code and has no analytics (REQ-PRIV-005). The one documented exception is the
  opt-in favicon tint, which loads the site's own favicon (D-217).
- **Least privilege.** No host access at install time. Origins are requested one by one when you add a URL
  pattern, and scripts are registered only for granted origins (REQ-PRIV-001 to 003).
- **Pages can't drive the extension.** Only the background listens for messages; there is no
  `onMessageExternal`, `externally_connectable` is empty and `window.postMessage` isn't used (REQ-SEC-003).
  The picker only accepts trusted user events (REQ-SEC-005, D-240).
- **Untrusted text stays text.** User text is inserted with `textContent` only and colors are validated hex.
- **Supply chain.** Frozen lockfile, SHA-pinned Actions, Dependabot, provenance attestations and checksums for
  release zips, and store credentials behind a protected environment with a required reviewer (REQ-SEC-008, 009).

### Non-goals

SiteMark prevents **accidental** confusion. It is **not a security control** (D-239):

- A hostile or compromised page can always hide, move, spoof or detect marks.
- A page can observe what you type into the in-page picker panel.
- The optional `[PROD]` title prefix is saved in your browser history.
- Export files contain your URL patterns, which may include internal hostnames. Treat them as internal data.

Reports that only show one of the non-goals above are appreciated, but they're not vulnerabilities. Things we
**do** want to hear about include: a page reading or changing your site groups, a page triggering permission
requests or extension actions, script injection through site group data or imports, network requests made by
SiteMark, and anything that grants SiteMark more access than you gave it.
