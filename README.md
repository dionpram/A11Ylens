# Access Lens

**A welcoming, independent, contribution-supported single-page accessibility checker.**

Access Lens is a locally runnable Next.js starter with a real Playwright + axe-core scanning endpoint, a branded results UI, a conservative contrast before/after preview generator, and a free print-to-PDF report. It is a **development MVP**, not production security-hardened software or a legal compliance certificate.

## What works

- Enter one public HTTP(S) URL and perform an actual browser-based axe-core scan.
- See failed, passed, inconclusive and not-applicable rule counts and results.
- View detailed failure selectors, descriptions and related WCAG tags.
- For a supported simple color contrast violation, capture the element, calculate a candidate color fix, apply it in a temporary browser context, recheck it and display before/after screenshots + CSS.
- Save all the details, passing rules, review items, and caveats via **Save as PDF** (opens the native browser Print / Save as PDF dialog).
- Optional donation link appears only if you configure `NEXT_PUBLIC_SUPPORT_URL`; the report never gates access.
- "Take a look at a sample report" opens an **explicitly labeled fictional sample**, useful before connecting a live scanner.

## Requirements

- Node.js 22 or later and npm
- Chromium browser dependencies supported by Playwright

## Run locally

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Paste a public webpage URL such as `https://www.w3.org/`.

If the bundled browser doesn't run and you already have a compatible Chromium installation:

```env
CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium
```

You can optionally set a real external payment link:

```env
NEXT_PUBLIC_SUPPORT_URL=https://your-payment-link.example
```

This must be your own actual payment page. No payment processor is provisioned by this starter.

## Architecture

```text
app/page.tsx                Landing page and scan state
app/globals.css             Responsive design system + print styles
app/api/scan/route.ts       POST scan endpoint with basic per-process rate limit
components/Report.tsx       Interactive results, details, sample preview, print report
lib/scanner.ts              Playwright + axe integration and screenshot fixes
lib/contrast.ts             WCAG contrast calculations and color search
lib/safety.ts               Conservative URL / DNS screening
lib/demo.ts                 Clearly labeled fictional sample data
docs/PRD.md                 Product specification
docs/ROADMAP.md             Launch hardening, backlog and acceptance checks
```

### Automated score methodology

**This is NOT a WCAG compliance score or a Lighthouse score.** We calculate a transparent **automated rule pass rate**: `passed rule IDs / (passed + failed rule IDs) × 100`, with failing rule IDs taking precedence and inconclusive ones excluded. Passing a rule does not prove a related WCAG criterion or an entire page conforms. Check the separate failures, successes, manual-review notes and complete scan coverage.

### Supported dynamic visuals

Version 0.1 generates at most one verified candidate for certain simple `color-contrast` findings in the main document. It skips cases our CSS/pixel model cannot safely handle (e.g. gradients, alpha overlays, iframe content, images). It checks its candidate against axe-core but still requires a human review of interactions and all component states. Future versions could add focus appearance, controls, responsive states and AI-generated alternatives.

### Public deployment — critical warning

**Do not expose this server to arbitrary internet users without hardening.** Browsing third-party URLs is a server-side request forgery (SSRF) and resource-exhaustion risk. The code validates schemes/ports and screens DNS-resolved IPs; request routing blocks obvious unsafe subrequests. These checks do not prevent DNS rebinding or protect against a compromised browser. A production setup needs:

1. An isolated unprivileged browser worker/container with **outbound network firewall** denying private IPs, loopback, cloud metadata endpoints and internal networks at the network layer, even across redirects and DNS rebinding.
2. External durable job queue, globally enforced concurrency quotas, per-user/IP rate limits at a trusted edge, hard time/memory limits and appropriate logs. This starter's in-memory counter is not distributed and `x-forwarded-for` can be spoofed absent a trusted proxy.
3. Request size and response size bounds, robust browser sandbox, no persistent browser credentials, no local filesystem mounts, abuse handling and blocked download/PDF/SSRF tests.
4. Privacy policy, short retention, transparency about scanned pages, handling of third-party content and lawful security practices before public launch.

Deploy the Next.js UI separately from the scanner worker. Serverless frontend hosting alone is not a reliable environment for spawning full browsers.

## Notes

- Some sites block automated browsing or require logins/cookie consent; those aren't supported yet.
- Axe analysis runs on a single rendered 1365×900 desktop viewport, not every responsive size, interaction, or route.
- PDF export is the browser's Print dialog, not a hosted one-click PDF file service.
- The project currently uses deterministic fixing, **not a connected AI API**. This avoids hallucinated fixes and operating costs until the core scanner is validated.
- Sample report is entirely fictional and is clearly labeled as such throughout.

## Next actions

Read `docs/PRD.md` and `docs/ROADMAP.md`. Start with a local install and test a public page. Once the end-to-end scan is verified, add design refinements, deployment isolation, metrics and optional checkout setup.

## GitHub setup

This starter includes a GitHub Actions workflow that runs tests, typechecking and a build on push and pull requests. For repository creation, connector access, and the alternative Git CLI method, see [docs/GITHUB-SETUP.md](docs/GITHUB-SETUP.md).

## Site pages

This version includes a full informational website alongside the scanner:

- `/` — homepage, single-page scan form and sample report
- `/how-it-works` — the complete user journey and what results mean
- `/methodology` — axe-core scoring, reported states, test scope and limitations
- `/about` — purpose, design principles and optional-support model
- `/faq` — common product and accessibility questions
- `/privacy` — current MVP data-handling notes (not a final legal privacy notice)

The shared header includes a keyboard-accessible mobile menu. Informational pages
have route-specific metadata and share a responsive footer. The homepage's scanner
and print-to-PDF report flow remain intact. The existing backend should **not**
be deployed for unrestricted public scanning before the security work described
above is completed.


## Working with a Google Stitch design

The visual layout can be replaced without changing the scanner API. See [Engine, API contract and Stitch handoff](docs/ENGINE.md) for the request/response format, how to connect an exported Stitch page, and required security hardening before launch.

The GitHub Actions workflow includes a controlled end-to-end smoke test of the real browser scan after Chromium is installed; run it locally with `npm run test:e2e` after `npm install` and `npx playwright install chromium`.
