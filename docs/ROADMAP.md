# Access Lens — Build and launch plan

## Milestone 1 — Working local proof of concept (included)

- [x] Responsive landing page and sample report
- [x] Single URL input and API
- [x] Real Playwright and axe-core integration in code
- [x] Passed / failed / incomplete / inapplicable categories
- [x] Documented automated rule pass rate
- [x] First real DOM-based contrast before/after fix (supported selectors only)
- [x] Browser Print → Save as PDF
- [x] Optional external contribution placeholder
- [ ] Verify dependencies install and run a real scan on user's machine (not verified in this packaging environment)

## Milestone 2 — Functional QA

- [ ] Install npm dependencies and Chromium, run `npm run typecheck`, `npm run build`
- [ ] Run scanners against curated public test pages covering labels, buttons, WCAG contrast, empty links
- [ ] Confirm before/after actual screenshot is generated on deterministic test fixture
- [ ] Test iframe/complex CSS fallback (no false visual fixes)
- [ ] Audit our own UI with keyboard, zoom, screen reader, mobile viewport
- [ ] Verify PDF includes every category regardless of currently selected tab
- [ ] Test error states, performance, contrast at zoom and reduced motion

## Milestone 3 — Production-readiness (required before making it public)

- [ ] Move scanner into dedicated container with hard network egress deny rules
- [ ] Close DNS rebinding paths; enforce request/response resource caps
- [ ] Add durable queue, Redis rate limits from trusted reverse proxy, telemetry and alerting
- [ ] Add worker timeouts and strict resource/memory limits
- [ ] Run security testing incl. localhost, cloud metadata, redirects, public->private DNS changes
- [ ] Privacy/terms page, data retention and abuse policy
- [ ] Set actual verified creator payment URL; verify optional support never blocks a scan
- [ ] Accessibility audit of all app states and localized error content
- [ ] CI and automated browser tests

## Milestone 4 — User research / improvement

- [ ] Five interviews with freelancers/designers/agency owners
- [ ] Compare same URL in WAVE, Lighthouse, axe and Access Lens
- [ ] Evaluate whether detailed passed-check reporting helps users
- [ ] Study contribution request comprehension and conversion
- [ ] Research small, responsible AI-generated alternatives, all mechanically verified

## Definition of done for public MVP

A user can submit a public URL, receive real verifiable findings and an accurately described score, explore at least one supported before/after contrast recommendation, get a complete PDF without payment, and submit a second page. Scanner must survive abusive input without reaching private network endpoints. All claims and recommendations must accurately describe test coverage.
