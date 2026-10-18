# A11Ylens scanner engine — implementation and Stitch handoff

## What works in the source code

The app already defines `POST /api/scan`, a Playwright/Chromium rendering step, an axe-core audit, rule grouping, a rule-pass-rate score, one conservative CSS contrast suggestion when feasible, real before/after element screenshots, and the results UI. A scan is **not** a legal certification.

The scanner has an optional real-browser CI smoke test: `npm run test:e2e`. It starts a controlled local HTML fixture, opens it through the Next.js API using Chromium, and asserts that the response contains axe violations, passing checks, a recommendation, and a dynamic contrast preview.

### Request

`POST /api/scan`

```json
{"url":"https://example.com"}
```

Only public HTTP/HTTPS URLs on standard ports are intended for the public product. The browser opens the *single* supplied page; it does not crawl the rest of the site or authenticate as the visitor.

### Response fields

```ts
{
  id: string;
  inputUrl: string;
  finalUrl: string;
  pageTitle: string;
  scannedAt: string;
  durationMs: number;
  score: number | null;               // axe rule pass rate, NOT WCAG certification
  scoreMethod: string;
  environment: { viewport: string; browser: string; engine: string };
  counts: {
    failedRules: number;
    affectedElements: number;
    passedRules: number;               // only fully passed rules
    reviewRules: number;
    notApplicableRules: number;
  };
  failures: Rule[];                   // includes rule-specific recommendations
  passes: Rule[];                     // includes partiallyPassing: true if mixed
  review: Rule[];                     // inconclusive checks, not a complete manual audit
  previews: ContrastPreview[];        // currently at most one supported real preview
  notes: string[];
}
```

Error responses have an HTTP 4xx/5xx status and `{ "error": "Friendly explanation" }`.

### Connecting Google Stitch to the engine

1. Export the Stitch design as React/HTML or download its code/assets. A Stitch project link alone may not expose its underlying design files to an external service.
2. Integrate the exported layout as a Next.js page/component in this repository, keeping this API route and scanner code intact.
3. On submit, POST `{ url }` to `/api/scan` and display a loading state while awaiting the response.
4. Map `counts`, `failures`, `passes`, `review`, `previews`, `notes` into the new result cards. Render the real `beforeImage`/`afterImage` only when present; otherwise show text guidance. Do not substitute demo results for errors.
5. For error responses, show the returned error text and let the visitor try another URL.
6. Keep free PDF export and optional donations outside the critical scan/report path.

Example client integration:

```ts
const response = await fetch('/api/scan', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ url: submittedUrl }),
});
const data = await response.json();
if (!response.ok) throw new Error(data.error || 'The scan failed');
setReport(data);
```

## Engine internals

1. `lib/safety.ts` validates URL scheme, user info, ports, hostname and resolved IP addresses.
2. `app/api/scan/route.ts` runs locally in development. In production it defaults to **disabled**, proxies to a separate HTTPS worker when `SCAN_WORKER_URL` and `SCAN_WORKER_TOKEN` are configured, or runs only in the explicit `SCAN_WORKER_ENABLED=true` protected worker mode. The gateway rejects unauthorized requests and caps proxy response sizes. In-process throttling is still only a development safeguard; **not sufficient for a scaled public deployment**.
3. `lib/scanner.ts` opens a sandboxed *logical* browser context, intercepts URLs, renders one page, and invokes `@axe-core/playwright`.
4. Results are organized by outcome; the score includes fully passing rules and failing rules, excluding inconclusive rules. Partially passing instances are still documented in `passes`.
5. `lib/recommendations.ts` supplies honest next-step guidance. Detailed rule documentation and element failure summaries come from axe-core.
6. For simple contrast failures, `lib/contrast.ts` calculates a candidate color. `lib/scanner.ts` takes original and temporary-patch screenshots, reruns the color-contrast check, and restores the original inline style. If it cannot do this reliably, no visual example is fabricated.
7. `components/Report.tsx` renders findings and supports browser Print / Save as PDF. PDF export is not a digitally signed audit.

## Deployment modes and security

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the Docker worker, environment variables, and recommended topology. The production frontend cannot execute scans directly without deliberate worker configuration. The `/api/health` route indicates configuration readiness, not worker safety.

## Before any public deployment — non-negotiable safeguards

**Do not publicly expose this scan endpoint as-is.** It loads untrusted external websites and is not yet isolated against every SSRF and browser-exploitation path. URL validation alone cannot prevent DNS rebinding, private-network egress and all redirects. Move the scan into an isolated container/worker with an egress firewall prohibiting metadata, loopback and private networks. Run it with low permissions, bounded CPU/RAM/time, downloads disabled, and limits on request/response size. Put a queue plus persistent rate limits in front of it; in-memory Maps are not durable or reliable across serverless instances.

Disable `ALLOW_LOCAL_SCANS` in production; it is only for controlled test fixtures. Avoid persisting user page screenshots or source code by default, and make the retention policy explicit. Add consent/banner-state documentation, network-error reporting, observability, and a privacy/security review. PDF evidence is a timestamped automated observation, **not proof of legal compliance**.

## Next milestones

- Keep CI type checking, build, unit tests, and local browser fixture passing after every change.
- Deploy the scanner in an isolated container with deny-by-default private-network egress and real time/resource limits.
- Replace in-process throttling with Redis-backed rate limits and a job queue.
- Allow users to test different page states and desktop/mobile viewports (still one URL at a time).
- Extend before/after generation to focus visibility and touch-target issues only when changes can be validated.
- Optionally provide AI-authored alternative explanations, always clearly identified as suggestions and followed by deterministic retesting.
