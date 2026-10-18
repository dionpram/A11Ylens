import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright", "playwright-core", "@axe-core/playwright"],

  // Playwright's runtime loads browsers.json from a computed path, which
  // Vercel/Next.js file tracing may otherwise omit from the API function.
  // Include this metadata only in the scanner route's server bundle.
  outputFileTracingIncludes: {
    "/api/scan": ["./node_modules/playwright-core/browsers.json"],
  },
};

export default nextConfig;
