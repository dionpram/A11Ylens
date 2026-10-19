# Scanner safety: development gate

The Vercel frontend deliberately does **not** run arbitrary website scans until an isolated worker is configured.

Application protections include: URL scheme/credential/port validation; DNS address checks for each request; rejection of private, metadata, local, reserved, IPv4-mapped, 6to4 and Teredo destinations; request count cap (180); and worker token authentication. See `lib/safety.ts`, `lib/scanner.ts`, and `lib/scan-gateway.ts`.

These checks are **not sufficient to safely serve arbitrary websites**. DNS rebinding/connection races and browser behavior require a host-level deny-by-default egress policy for private/metadata networks, including redirects. Before public release, isolate Chromium in a non-root worker with CPU/RAM/PID/time/network limits, size limits, inbound restrictions, durable rate limiting and monitoring. Do not inject host credentials. Verify on harmless authorized public websites and adversarial test cases. Never enable `ALLOW_LOCAL_SCANS` in production.

The scanner output is an automated snapshot, not a WCAG compliance certificate or legal opinion.

## Temporary security hold — 2026-10-19

The preview is suspended during a review of scanner networking, abuse and credentials. In the `remote-browser-beta` Preview environment, `SCANNER_SECURITY_HOLD=true` forces `scanMode()` to `disabled` regardless of worker URLs or Browserless tokens. The `POST /api/scan` endpoint refuses requests *before* parsing or fetching website URLs. `MANAGED_BROWSER_ENABLED=false` is a second independent off-switch. The build smoke tests skip remote sessions while held. This intentionally prevents paid browser usage from the current preview.

The security hold only affects **new deployments** that receive the environment variables. Older Vercel deployments may retain previous environment settings; either disable/delete unused preview deployments or revoke the provider token to invalidate them. Never delete or disable a production deployment as part of beta cleanup.

### Reviewed in code
- No Gmail/IMAP/OAuth mailbox integration, no user account database, and no application-level persistent scan history.
- The Browserless secret is configured in Vercel's server-side, branch-scoped, sensitive environment setting.
- Browser sessions use a fresh browser context and `acceptDownloads:false`, `serviceWorkers:"block"`; no logged-in user cookies are injected.
- HTTPS URL scheme, credentials, internal/reserved IP checks, host allowlist for beta, 180 browser request cap and basic in-memory retry limit exist. They do **not** provide guaranteed isolation against DNS races, WebSocket traffic, target-side scripts, all redirects, or distributed abuse.

### Requirements before unpausing public or unrestricted scans
1. Enforce private/metadata IP denial **at the actual outbound connection**, including DNS rebinding/redirect targets, IPv4 and IPv6, independent of JavaScript/Playwright URL validation.
2. Use an isolated, unprivileged browser worker with no access to Vercel/GitHub/Gmail credentials; cap CPU, RAM, runtime, disk, file descriptors, processes, bandwidth and responses.
3. Use a shared persistent rate limit and bounded job queue; set external provider account hard-spend caps.
4. Verify WebSocket/WebRTC and browser protocol egress restrictions, resource redirects and service worker limitations in the chosen worker environment.
5. Add independent security tests using harmless controlled destinations and verify remote scans without exposing secrets in logs.
6. Rotate and scope any compromised credentials, enable MFA for GitHub/Vercel/Browserless/email, review active sessions, and test access controls.
7. Review hosting provider privacy commitments and scan URL log retention; do not enter private, password-protected, or signed personal links.

This review of configuration and source code is **not a penetration test** and cannot prove the absence of prior incidents or all vulnerabilities.
