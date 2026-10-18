# Scanner safety: development gate

The Vercel frontend deliberately does **not** run arbitrary website scans until an isolated worker is configured.

Application protections include: URL scheme/credential/port validation; DNS address checks for each request; rejection of private, metadata, local, reserved, IPv4-mapped, 6to4 and Teredo destinations; request count cap (180); and worker token authentication. See `lib/safety.ts`, `lib/scanner.ts`, and `lib/scan-gateway.ts`.

These checks are **not sufficient to safely serve arbitrary websites**. DNS rebinding/connection races and browser behavior require a host-level deny-by-default egress policy for private/metadata networks, including redirects. Before public release, isolate Chromium in a non-root worker with CPU/RAM/PID/time/network limits, size limits, inbound restrictions, durable rate limiting and monitoring. Do not inject host credentials. Verify on harmless authorized public websites and adversarial test cases. Never enable `ALLOW_LOCAL_SCANS` in production.

The scanner output is an automated snapshot, not a WCAG compliance certificate or legal opinion.
