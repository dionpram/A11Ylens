# A11Ylens deployment blueprint — preview first, security before public scans

This repository provides a frontend, an automated accessibility checker, and a browser-worker container image. **A successful CI browser fixture does not establish public deployment safety.** The Stitch layout can be connected without replacing `/api/scan`.

## Two services, one user experience

```text
Visitor → Next.js frontend → POST /api/scan → authenticated HTTPS request
                                  ↓
                   isolated Chromium worker (same repo/image)
                                  ↓
                  external site → axe-core → result JSON
                                  ↓
                       UI + PDF / print
```

No agent is installed on customer websites. The frontend never runs Chromium in production when a worker is absent.

### 1. Frontend (for example, Vercel)

- Connect the GitHub repository and deploy the Next.js app.
- Set `SCAN_WORKER_URL` to the HTTPS origin of a separately deployed worker.
- Set `SCAN_WORKER_TOKEN` to a cryptographically random secret **at least 32 characters**. Keep it server-only; **do not** prefix it with `NEXT_PUBLIC_`.
- Do **not** set `SCAN_WORKER_ENABLED` on the frontend.
- `/api/scan` proxies submitted URLs to the authenticated worker, with a 55-second request deadline and a 2.5 MB result cap.
- `/api/health` returns availability metadata without credentials.
- Without the worker variables, `/api/scan` deliberately responds with HTTP 503 and a friendly explanation. Sample reports still work.

### 2. Isolated scanner worker (container host)

Build this repository's `Dockerfile`. Provide:

```env
NODE_ENV=production
SCAN_WORKER_ENABLED=true
SCAN_WORKER_TOKEN=<same-long-random-secret-as-frontend>
ALLOW_LOCAL_SCANS=false
```

- **Never set `SCAN_WORKER_URL` on the worker** (it would become a proxy loop).
- Expose HTTPS through a trusted ingress/gateway. The worker's `/api/scan` rejects missing or incorrect tokens before parsing URL input or launching a browser.
- Protect the worker from direct internet use by restricting inbound connections to the frontend/edge proxy, where the host supports it. Shared-secret auth is additional protection, not a substitute for network restrictions.
- **Enforce egress firewall rules at the host/network level.** Explicitly deny loopback, RFC1918 ranges, link-local, cloud metadata addresses, IPv6 private/link-local, multicast and reserved networks. Reject redirects/resolved IPs to those networks. DNS checks in the app are defense in depth; DNS rebinding can defeat them alone. Do not assume a Docker container automatically enforces these policies.
- Run non-root with reduced Linux capabilities, a seccomp profile, bounded CPU/memory/PIDs, disk quota, and ephemeral storage. Set limits for page loads and container concurrency; never give the worker cloud-provider credentials or metadata access.
- Add a network/API gateway with **persistent distributed rate limits**, queue/backpressure, and abuse monitoring before allowing unrestricted public users. The in-process throttle is development-only and can be bypassed across instances or spoofed upstream.
- Test against harmless authorized external pages before launch. Do not scan internal, authenticated or customer-private systems.

### 3. Local development

```sh
npm install
npx playwright install chromium
npm run dev
```

Development defaults to in-process scanning for controlled use. For the integration fixture only, the test sets `ALLOW_LOCAL_SCANS=true` in development. Do not set that for production. Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:e2e` before release.

### 4. Public launch checklist (must be completed by operator)

- [ ] Confirm the host network policy blocks private/metadata egress, including on redirects and DNS changes.
- [ ] Confirm ingress restrictions, TLS, and token rotation/revocation processes.
- [ ] Configure durable rate limiting, queue and concurrency limits (not in this starter).
- [ ] Cap pages, redirects, response sizes, page runtime, and memory use under real load.
- [ ] Establish logging/incident monitoring without storing private page contents or sensitive submitted URLs unnecessarily.
- [ ] Verify real web scans and degraded/error states against a varied test set.
- [ ] Review the privacy notice, provider logs and German/EU legal requirements before launch.
- [ ] Publish an accurate accessibility statement about this tool itself where appropriate.
- [ ] Import the actual exported Google Stitch design while retaining the scan API contract.

No hosting account, domain, secrets or firewall is configured automatically by this repository change. It is infrastructure-ready code, **not a live deployment**.

## Alternative MVP engine: Google PageSpeed Insights

For a lower-infrastructure preview, set `PAGESPEED_API_ENABLED=true` on the Next.js frontend **only after confirming abuse limits and privacy disclosures**. This changes the scan handler to call Google's official PageSpeed Insights API using a server-side request to the fixed Google endpoint. A `PAGESPEED_API_KEY` is optional for limited use, but recommended for frequent automated requests. Both values must be server-only.

The results use Google's Lighthouse weighted accessibility score, and show failing, passing, manual, and not-applicable audits. They do **not** provide site-specific before/after screenshots; that requires the separately isolated Chromium worker. PageSpeed quotas, errors and rate limits apply, and submitted URLs are transferred to Google. The default production mode remains disabled until explicitly enabled.

When a worker is eventually configured, the worker mode takes precedence. Never enable both remote Lighthouse and worker integrations without checking the intended priority.
