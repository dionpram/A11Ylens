# Managed browser beta for A11Ylens

## Why
The Google PageSpeed Insights keyless preview is frequently rate-limited. This branch does **not** depend on Google's accessibility API. We reuse our own existing Playwright + axe-core engine (already validated in GitHub CI). Browserless supplies only a remote Chromium process.

## Cost/limits
Browserless has a free tier at the time of writing, with 1000 units/month and 2-minute session cap; check its live pricing before upgrading. No credentials or service are required to build this branch, but real remote scans require a private Browserless token.

## Activate preview (not production)
1. Create a Browserless account at https://www.browserless.io/ and retrieve its API token.
2. In the Vercel A11Ylens project, set **Preview**, scoped to branch `remote-browser-beta`:
   - `MANAGED_BROWSER_ENABLED=true` (plain)
   - `BROWSERLESS_TOKEN` (sensitive/encrypted)
   - `SCAN_BETA_ALLOWED_HOSTS=pramadion.com,www.pramadion.com,example.com` (plain)
3. Redeploy the branch after variables are present.
4. In the protected preview, test `https://pramadion.com/` and `https://example.com/`.
5. Confirm positive/negative findings, visual previews if a supported failing element exists, and export.

Keep PageSpeed disabled on this branch. If neither the token nor a worker is configured, scanning must stay disabled rather than falling back to Google's API.

## Safety and limitations
- Vercel never launches local Chromium in this mode; it connects to a fixed Browserless Amsterdam WebSocket endpoint via Playwright's CDP client.
- Access to scanning is explicitly allowlisted. Exact host names only; no wildcards.
- URL/DNS private-address checks and per-resource request checks remain in code. These are **not** a substitute for network restrictions in a self-hosted worker.
- This is an authenticated testing preview, not an anonymous public website scanner. Before public launch: durable per-visitor rate limiting, hard concurrency/expense caps, private/metadata egress protection, limits on redirects/response bytes and monitoring.
- Browserless usage consumes your plan's limited browser time/units. End sessions when done.
- This branch must not be merged into production or opened to unrestricted domains until proper protection and a real end-to-end scan are verified.

## Long-term replacement
The same `scanWebsite` engine can run in an isolated self-hosted worker by leaving `MANAGED_BROWSER_ENABLED` off and configuring `SCAN_WORKER_URL` in Vercel. Use host-level egress blocking and resource quotas when running arbitrary websites.

## Expanded URL testing (protected preview only)

The optional `SCAN_BETA_ANY_PUBLIC_HOSTS=true` switch permits arbitrary public **HTTPS** domains on Vercel's authenticated `remote-browser-beta` Preview only. `allowAnyPublicBetaHost()` refuses to enable it on `main`, in Production, or when the security hold is active. Redirect navigation and subresources still undergo `validatePublicUrl()` DNS / private-address checks; WebSockets are blocked and the scanner retains request and rate limits.

**Security boundary:** Browserless operates a remotely isolated browser (not in the Vercel container), but A11Ylens has not verified its private-network deny rules at the actual outbound socket. Application checks are not a full SSRF defense. This mode is for the authenticated owner to evaluate ordinary public sites; it is not approval for an unrestricted public product. The hardened local Docker worker remains the path for a fully isolated public scanning service. Never scan private, signed, credential-bearing or login-only URLs.
