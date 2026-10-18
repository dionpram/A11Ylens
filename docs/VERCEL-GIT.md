# Vercel deployment status and workflow

## GitHub source of truth

The application code is maintained in [dionpram/A11Ylens](https://github.com/dionpram/A11Ylens). The Vercel project is named **a11ylens**.

The owner connected this repository under Vercel Project Settings → Git. After this change lands on `main`, verify a new deployment appears in Vercel's Deployments tab with Git commit metadata. A connection shown in the settings is not by itself proof that builds are triggered successfully.

## Website preview

A manually uploaded protected preview was built successfully at:

- https://a11ylens-165xi6dh3-superfine3.vercel.app

This address is only a preview; it is **not** evidence of an automatically deployed Git build or an active public scanning service.

## Safety boundary

The Next.js website can be safely previewed without a scanner worker. A production frontend should set `SCANNER_MODE=proxy` and configure the worker URL and a secret only after the worker is isolated and tested. Without a configured worker, scanning must remain disabled; this is intentional.

Do **not** set `ALLOW_LOCAL_SCANS=true` in production. Do not deploy the Playwright scanner as an unrestricted public Vercel Function. Browser-based URL retrieval needs isolated container execution, private/metadata network egress denial, bounded resources, server-side authentication, a real shared rate limiter, and security testing.

## Before inviting testers

1. Confirm a Git-triggered Vercel deployment is READY and tied to the intended commit.
2. Check that homepage navigation, sample report and Print / Save as PDF work.
3. Confirm that requests to `POST /api/scan` do **not** start Chromium in the public frontend.
4. Configure an appropriately isolated scanner worker and rate limits.
5. Test the full flow on known safe public websites before enabling broader access.

The project's GitHub Actions workflow tests the app build and the controlled browser scan in CI. CI success does not replace a protected, real-world deployment test.
