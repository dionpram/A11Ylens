# Remote Lighthouse scan preview

This branch is used to test Google PageSpeed Insights (PSI) accessibility scans without executing Chromium on the public Vercel frontend.

## Environments
- `main` / Vercel production: scanning disabled until a worker or remote engine is explicitly configured.
- `pagespeed-preview` / Vercel preview: `PAGESPEED_API_ENABLED=true` (branch-scoped, Vercel), with Google API key omitted for limited validation.

Google accepts unauthenticated API calls according to its official documentation, but availability, quotas and rate limiting depend on the service. Keyless scans can fail; the frontend should display a clear error instead of imaginary results.

Submitting a URL in this preview sends it to Google PageSpeed Insights. The response includes Lighthouse's weighted accessibility score, failures, passes, incomplete/manual checks and no screenshot-based fixes. The independent Playwright scanner is intentionally not deployed.

The Vercel preview remains protected with Vercel Authentication. Do not promote this build or enable public scanning before testing API reliability, configuring shared rate limiting and reviewing privacy disclosures.
