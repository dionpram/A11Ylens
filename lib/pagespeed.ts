import { randomUUID } from "node:crypto";
import { validatePublicUrl } from "./safety.ts";
import { recommendationForRule } from "./recommendations.ts";
import { readLimitedJson } from "./scan-gateway.ts";
import type { Impact, Rule, ScanReport } from "./types";

/**
 * A remote, no-browser-in-our-infrastructure first-run option.
 * Our server sends the submitted public URL to the fixed Google API only;
 * Google is responsible for opening the target website.
 *
 * Lighthouse scoring is not equivalent to the in-house axe rule pass rate.
 */
type Audit = {
  id?: string;
  title?: string;
  description?: string;
  displayValue?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  details?: { items?: unknown[] };
};
type PageSpeed = {
  id?: string;
  analysisUTCTimestamp?: string;
  lighthouseResult?: {
    fetchTime?: string;
    finalUrl?: string;
    requestedUrl?: string;
    lighthouseVersion?: string;
    userAgent?: string;
    runWarnings?: unknown[];
    runtimeError?: { message?: string };
    audits?: Record<string, Audit>;
    categories?: {
      accessibility?: { score?: number | null; auditRefs?: { id: string; weight?: number }[] };
    };
  };
};

const wcagTags: Record<string, string[]> = {
  "color-contrast": ["wcag143"],
  "image-alt": ["wcag111"],
  "label": ["wcag332"],
  "button-name": ["wcag412"],
  "link-name": ["wcag244"],
  "html-has-lang": ["wcag311"],
  "document-title": ["wcag242"],
  "meta-viewport": ["wcag144"],
};

function textValue(value: unknown, max = 900): string {
  if (typeof value !== "string") return "";
  return value.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, "$1")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function ruleFromAudit(id: string, audit: Audit, includeNodes: boolean): Rule {
  const items = Array.isArray(audit.details?.items) ? audit.details.items.slice(0, 30) : [];
  const nodes = items.map(item => {
    const obj = item && typeof item === "object" ? item as Record<string, unknown> : {};
    const node = obj.node && typeof obj.node === "object" ? obj.node as Record<string, unknown> : {};
    return {
      target: textValue(node.selector, 300) || textValue(node.path, 300) || "Element not identified",
      html: textValue(node.snippet, 350),
      summary: textValue(node.explanation, 800) || textValue(obj.explanation, 800) || textValue(node.nodeLabel, 150) || "Review this element.",
    };
  }).filter(node => node.target !== "Element not identified" || node.html || node.summary !== "Review this element.");
  return {
    id, title: textValue(audit.title, 160) || id,
    description: textValue(audit.description, 1400),
    recommendation: recommendationForRule(id),
    impact: "unknown" as Impact, // Lighthouse does not return axe's impact classifications.
    wcag: wcagTags[id] ?? [],
    count: includeNodes ? Math.max(1, items.length) : 1,
    ...(includeNodes ? { nodes } : {}),
  };
}

export function mapPageSpeedReport(payload: unknown, inputUrl: string, durationMs = 0): ScanReport {
  if (!payload || typeof payload !== "object") throw new Error("Google returned an invalid audit.");
  const p = payload as PageSpeed;
  const result = p.lighthouseResult;
  if (!result || !result.categories?.accessibility || !result.audits) {
    throw new Error("Google returned no accessibility audit for this page.");
  }
  if (result.runtimeError) throw new Error("Google could not complete a Lighthouse audit for this page.");

  const category = result.categories.accessibility;
  if (typeof category.score !== "number" || !Number.isFinite(category.score) || !Array.isArray(category.auditRefs)) {
    throw new Error("Google did not provide a complete accessibility score.");
  }

  const failures: Rule[] = [], passes: Rule[] = [], review: Rule[] = [];
  let notApplicable = 0;
  const seen = new Set<string>();
  for (const ref of category.auditRefs) {
    if (!ref || typeof ref.id !== "string" || seen.has(ref.id)) continue;
    seen.add(ref.id);
    const audit = result.audits[ref.id];
    if (!audit) continue;
    const mode = audit.scoreDisplayMode || "";
    if (mode === "notApplicable" || mode === "not_applicable") {
      notApplicable++;
    } else if (mode === "manual" || mode === "informative" || mode === "error" || typeof audit.score !== "number") {
      review.push(ruleFromAudit(ref.id, audit, false));
    } else if (audit.score < 1) {
      failures.push(ruleFromAudit(ref.id, audit, true));
    } else {
      passes.push(ruleFromAudit(ref.id, audit, false));
    }
  }
  const finalUrl = result.finalUrl || p.id || inputUrl;
  // Provider-controlled canonical IDs are not guaranteed to be full URLs.
  let pageTitle: string;
  try { pageTitle = new URL(finalUrl).hostname; }
  catch { pageTitle = new URL(inputUrl).hostname; }
  const titleAudit = result.audits["document-title"];
  if (titleAudit && typeof titleAudit.displayValue === "string") pageTitle = textValue(titleAudit.displayValue, 160) || pageTitle;

  return {
    id: randomUUID(), inputUrl, finalUrl, pageTitle,
    scannedAt: result.fetchTime || p.analysisUTCTimestamp || new Date().toISOString(),
    durationMs,
    score: Math.round(Math.min(1, Math.max(0, category.score)) * 100),
    scoreMethod: "Google Lighthouse's weighted automated accessibility score (PageSpeed Insights, desktop). This is not an axe rule pass rate, proof of WCAG conformance, or a legal certification.",
    environment: { viewport: "Lighthouse desktop emulation", browser: "Google Chromium", engine: "Lighthouse (Google PageSpeed Insights)" },
    counts: {
      failedRules: failures.length,
      affectedElements: failures.reduce((total, rule) => total + rule.count, 0),
      passedRules: passes.length, reviewRules: review.length, notApplicableRules: notApplicable,
    },
    failures, passes, review, previews: [],
    notes: [
      "The submitted URL was sent to the Google PageSpeed Insights service, which ran the Lighthouse analysis.",
      "Lighthouse audit results cover an automated snapshot of one page. Some required accessibility checks need human judgment.",
      "The recorded score is Google's weighted accessibility score; element counts may represent audit detail items rather than a complete affected-element count.",
      "Site-specific before/after screenshots require our separate browser worker; no visual correction was generated by this remote scan.",
      ...(result.runWarnings?.length ? ["Lighthouse returned run warnings; inspect the test environment and verify results."] : []),
    ],
  };
}

/** Build only a trusted Google API URL, never a client-controlled API endpoint. */
export function buildPageSpeedRequest(targetUrl: string, apiKey?: string): URL {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", targetUrl);
  // Use the documented lowercase API parameter values.
  endpoint.searchParams.set("category", "accessibility");
  endpoint.searchParams.set("strategy", "desktop");
  endpoint.searchParams.set("fields", "id,analysisUTCTimestamp,lighthouseResult(fetchTime,finalUrl,lighthouseVersion,userAgent,runWarnings,runtimeError,audits,categories(accessibility))");
  if (apiKey?.trim()) endpoint.searchParams.set("key", apiKey.trim());
  return endpoint;
}

export async function scanWithPageSpeed(inputUrl: string): Promise<ScanReport> {
  // Validate first, even though this application never connects to the target URL.
  const url = await validatePublicUrl(inputUrl);
  const endpoint = buildPageSpeedRequest(url, process.env.PAGESPEED_API_KEY);
  const started = Date.now();
  let response: Response;
  try {
    response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(43_000),
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error("Google's accessibility scan timed out or could not be reached. Please try again.");
  }
  if (response.status === 429) throw new Error("Google is rate-limiting accessibility checks right now. Please try again later.");
  if (response.status === 401 || response.status === 403) throw new Error("Google has declined this scan request. A PageSpeed API key may be needed.");
  if (response.status === 400) throw new Error("Google could not process the submitted URL. Try the site's public homepage, including https://.");
  if (response.status >= 500) throw new Error("Google's scan service is temporarily unavailable. Try again shortly.");
  if (!response.ok) throw new Error("Google could not analyze this page right now. Please try another public URL.");
  const data = await readLimitedJson(response, 8_000_000);
  return mapPageSpeedReport(data, url, Date.now() - started);
}
