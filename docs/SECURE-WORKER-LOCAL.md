# A11Ylens secure worker — zero-subscription development beta

**Status: work in progress. Not yet safe to expose publicly.**

The public A11Ylens homepage stays available with real scans disabled. This
branch supplies a local-only browser worker that can scan public HTTPS sites
without the paid Google or Browserless services.

## Architecture

- Scanner: Chromium and axe-core in a non-root, read-only container on a
  Docker internal network. No direct external network route.
- Egress: a separate Node HTTPS CONNECT proxy with an outbound network
  interface. Only connections to port 443 are allowed. It resolves all DNS
  records, rejects private/reserved/metadata addresses, and connects to a
  **pinned numeric IPv4 address** to avoid DNS rebinding between verification
  and connection.
- The browser gets only the proxy's internal address. Two Docker networks
  separate the browser from the proxy's public-facing network.
- Containers drop Linux capabilities and have CPU, memory, process and
  ephemeral-storage limits.
- Worker API is exposed to 127.0.0.1:3001 **on your own machine only**.
  A 32+ character secret token is required. Never share that token.
- A persistent worker-level file caps new scans to 30 per UTC day in total
  and 4 per visitor in a rolling 10-minute window. Restarts retain the budget.

**Limitations:** HTTPS only, IPv4-capable destinations only, one page per scan,
and no authenticated websites. The local proxy is not a security certificate.
The actual network boundaries must still be verified on the machine running
Docker. Browser vulnerabilities and the proxy process are residual risks.

## Start locally

1. Install Docker Engine / Docker Desktop (personal use where eligible) and
   make sure Docker is running. Obtain this GitHub repository and check out
   the secure-worker-beta branch.
2. Generate a 64-character random secret with Node.js on your own machine:

   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

3. Create an untracked .env file in the repository root:

   SCAN_WORKER_TOKEN=the_random_secret_generated_above

4. Validate configuration, then build and start:

   docker compose -f compose.secure.yaml config --quiet
   docker compose -f compose.secure.yaml up --build

5. In a second terminal, export your local secret from .env:

   set -a; . ./.env; set +a

6. Check the API locally:

   curl -X POST http://127.0.0.1:3001/api/scan -H "Content-Type: application/json" -H "x-a11ylens-worker-token: $SCAN_WORKER_TOKEN" --data '{"url":"https://example.com/"}'

7. For up to 10 diverse public sites, create a local urls.txt containing one
   website per line (no private links, secrets or signed query parameters).
   Then run:

   node scripts/test-public-sites.mjs urls.txt

8. Stop the container without deleting its persistent daily budget:

   docker compose -f compose.secure.yaml down

Note: The web frontend is separate; this local worker is NOT connected to
the public Vercel domain. No Railway deployment or payment is required.

## Release blockers — do not disable the public scanning hold yet

- [ ] Verify Docker is installed, compose configuration parses, images build.
- [ ] Verify worker has no direct external routing even if the proxy is down.
- [ ] Verify attempts to reach local, private, metadata and IPv6-only targets
      are rejected at the outbound proxy; verify redirect/DNS rebinding cases.
- [ ] Independently review container settings and browser escape risks.
- [ ] Exercise 10 different public HTTPS websites with actual results and logs
      stripped of sensitive URLs. Fix failures, not merely rerun tests.
- [ ] Confirm page, CSS, screenshot size, memory, process and time limits.
- [ ] Add a shared public-facing abuse barrier (IP quotas, bot protection,
      limited concurrency). The old Vercel in-memory Map is not enough.
- [ ] Choose a proper always-on host with a verified network firewall and a
      hard spending limit before connecting remote worker to public Vercel.
- [ ] Add privacy/legal text appropriate to running an online business in
      Germany; publish support/contact information.
- [ ] Validate security and report quality on staging before any real public
      release. Keep emergency SCANNER_SECURITY_HOLD switch available.

No hosting costs have been incurred by these code changes. Hosting publicly
may cost money in the future; a personal machine can host tests for no
additional service subscription, but do not expose it from home to the
internet without further review.
