import { randomUUID } from "node:crypto";
import { chromium, type Browser, type Page } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import type { ScanReport, Rule, ContrastPreview, Impact } from "./types";
import { validatePublicUrl } from "./safety";
import { contrast, findAccessibleColor, readRGB, toHex } from "./contrast";
import { recommendationForRule } from "./recommendations";

type AxeRule = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"][number];
const wcagTags = (tags: string[]) => tags.filter(t => /^wcag\d/.test(t));

function formatRule(rule: AxeRule, includeNodes = false): Rule {
  return {
    id: rule.id,
    title: rule.help,
    description: rule.description,
    recommendation: recommendationForRule(rule.id),
    helpUrl: rule.helpUrl,
    impact: (rule.impact ?? "unknown") as Impact,
    wcag: wcagTags(rule.tags),
    count: rule.nodes.length,
    ...(includeNodes ? {
      nodes: rule.nodes.slice(0, 30).map(node => ({
        target: node.target.join(" → "),
        html: node.html.slice(0, 350),
        summary: (node.failureSummary || "Review this element.").slice(0, 800),
      })),
    } : {}),
  };
}

async function extractStyle(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((element) => {
    const view = element.ownerDocument.defaultView!;
    const own = view.getComputedStyle(element);
    const ownBg = own.backgroundColor;
    let bg = ownBg;
    let ancestor: Element | null = element;
    while (ancestor && (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)")) {
      ancestor = ancestor.parentElement;
      if (ancestor) bg = view.getComputedStyle(ancestor).backgroundColor;
    }
    const fontSize = parseFloat(own.fontSize) || 16;
    const weight = parseInt(own.fontWeight) || 400;
    const large = fontSize >= 24 || (fontSize >= 18.67 && weight >= 700);
    return {
      color: own.color,
      background: bg && bg !== "transparent" ? bg : "rgb(255, 255, 255)",
      ownBackground: ownBg,
      isLarge: large,
      originalInlineColor: (element as HTMLElement).style.getPropertyValue("color"),
      originalInlineBg: (element as HTMLElement).style.getPropertyValue("background-color"),
      originalInlineColorPriority: (element as HTMLElement).style.getPropertyPriority("color"),
      originalInlineBgPriority: (element as HTMLElement).style.getPropertyPriority("background-color"),
    };
  });
}

async function makeContrastPreview(page: Page, violations: AxeRule[]): Promise<ContrastPreview | null> {
  const colorRule = violations.find(v => v.id === "color-contrast");
  if (!colorRule) return null;

  for (const node of colorRule.nodes.slice(0, 8)) {
    // First iteration handles ordinary CSS selectors in the main document.
    // Cross-origin iframes, gradients, transparency, and images require more work.
    if (node.target.length !== 1) continue;
    const selector = node.target[0];
    if (typeof selector !== "string" || !selector || selector.length > 240) continue;
    const locator = page.locator(selector).first();
    try {
      if (!(await locator.isVisible({ timeout: 1200 }))) continue;
      const style = await extractStyle(page, selector);
      const fg = readRGB(style.color);
      const bg = readRGB(style.background);
      if (!fg || !bg) continue;
      const threshold = style.isLarge ? 3 : 4.5;
      const beforeRatio = contrast(fg, bg);
      // If our simplified pixel estimate disagrees with axe (e.g. gradient/overlay),
      // do not claim a recommendation is safe.
      if (beforeRatio >= threshold) continue;
      const hasOwnBg = !!readRGB(style.ownBackground);
      const property: "background-color" | "color" = hasOwnBg ? "background-color" : "color";
      const chosen = findAccessibleColor(hasOwnBg ? bg : fg, hasOwnBg ? fg : bg, threshold);
      if (!chosen) continue;
      const previous = hasOwnBg ? bg : fg;
      const afterRatio = hasOwnBg ? contrast(fg, chosen) : contrast(chosen, bg);
      if (afterRatio < threshold) continue;
      const originalValue = hasOwnBg ? style.originalInlineBg : style.originalInlineColor;
      const originalPriority = hasOwnBg ? style.originalInlineBgPriority : style.originalInlineColorPriority;
      const beforeBuffer = await locator.screenshot({ animations: "disabled", timeout: 2500 });
      if (beforeBuffer.byteLength > 250000) continue;
      const suggestion = toHex(chosen);
      let afterBuffer: Buffer;
      let confirmedByRescan = false;
      try {
        await locator.evaluate((element, change) => {
          (element as HTMLElement).style.setProperty(change.property, change.value, "important");
        }, { property, value: suggestion });
        afterBuffer = await locator.screenshot({ animations: "disabled", timeout: 2500 });
        const check = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
        confirmedByRescan = !check.violations.some(violation => violation.nodes.some(item => item.target.includes(selector)));
      } finally {
        await locator.evaluate((element, change) => {
          const style = (element as HTMLElement).style;
          if (change.value) style.setProperty(change.property, change.value, change.priority);
          else style.removeProperty(change.property);
        }, { property, value: originalValue, priority: originalPriority }).catch(() => {});
      }
      if (afterBuffer!.byteLength > 250000) continue;
      return {
        ruleId: colorRule.id,
        target: selector,
        property,
        beforeValue: toHex(previous),
        afterValue: suggestion,
        beforeRatio: Math.round(beforeRatio * 100) / 100,
        afterRatio: Math.round(afterRatio * 100) / 100,
        threshold,
        beforeImage: `data:image/png;base64,${beforeBuffer.toString("base64")}`,
        afterImage: `data:image/png;base64,${afterBuffer!.toString("base64")}`,
        confirmedByRescan,
        css: `${selector} {\n  ${property}: ${suggestion};\n}`,
      };
    } catch {
      // Incomplete/missing visual preview should not invalidate the whole report.
      continue;
    }
  }
  return null;
}

export async function scanWebsite(inputUrl: string): Promise<ScanReport> {
  const started = Date.now();
  const url = await validatePublicUrl(inputUrl);
  let browser: Browser | undefined;
  try {
    if (process.env.MANAGED_BROWSER_ENABLED === "true") {
      // Browserless supplies Chromium only. axe-core, rule evaluation,
      // visual fixes and output format remain under A11Ylens's control.
      // Never log this URL; it contains the server-only provider credential.
      const { browserlessEndpoint } = await import("./browserless");
      const endpoint = browserlessEndpoint(process.env.BROWSERLESS_TOKEN);
      try {
        browser = await chromium.connectOverCDP(endpoint, { timeout: 12000 });
      } catch {
        throw new Error("The managed browser could not start. Please try again later.");
      }
    } else {
      browser = await chromium.launch({
        headless: true,
        ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
      });
    }
    const context = await browser.newContext({
      viewport: { width: 1365, height: 900 },
      deviceScaleFactor: 1,
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    // Cap intercepted requests to avoid unbounded work from an untrusted page.
    // This does not replace container-level CPU, RAM, network and time limits.
    let requestCount = 0;
    let requestLimitHit = false;
    const MAX_BROWSER_REQUESTS = 180;
    await context.route("**/*", async route => {
      const candidate = route.request().url();
      requestCount++;
      if (requestCount > MAX_BROWSER_REQUESTS) requestLimitHit = true;
      if (requestLimitHit || !/^https?:/i.test(candidate)) {
        await route.abort().catch(() => {});
        return;
      }
      try {
        await validatePublicUrl(candidate);
        await route.continue();
      } catch {
        await route.abort();
      }
    });

    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 22000 });
    if (!response || !response.ok()) throw new Error(`The page returned HTTP ${response?.status() ?? "unknown"}.`);
    await page.waitForTimeout(700);
    if (requestLimitHit) throw new Error("The page requested too many resources to scan reliably.");
    const finalUrl = await validatePublicUrl(page.url());
    const result = await new AxeBuilder({ page }).analyze();
    const failures = result.violations.map(rule => formatRule(rule, true));
    const failedIds = new Set(failures.map(r => r.id));
    const review = result.incomplete.map(rule => formatRule(rule, true));
    const reviewIds = new Set(review.map(r => r.id));
    const passes = result.passes.filter(rule => !reviewIds.has(rule.id)).map(rule => ({
      ...formatRule(rule),
      partiallyPassing: failedIds.has(rule.id),
    }));
    const fullyPassedRules = passes.filter(rule => !rule.partiallyPassing).length;
    const denominator = fullyPassedRules + failures.length;
    const preview = await makeContrastPreview(page, result.violations);
    if (requestLimitHit) throw new Error("The page requested too many resources to scan reliably.");

    return {
      id: randomUUID(),
      inputUrl: url,
      finalUrl,
      pageTitle: (await page.title()).slice(0, 160) || new URL(finalUrl).hostname,
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      score: denominator > 0 ? Math.round(100 * fullyPassedRules / denominator) : null,
      scoreMethod: "Percentage of applicable automated axe rule IDs with no detected failures; excludes inconclusive rules. Passing element instances from partially failing rules are listed separately. Not a Lighthouse score, WCAG score, or compliance certification.",
      environment: { viewport: "1365 × 900", browser: "Chromium", engine: "axe-core" },
      counts: {
        failedRules: failures.length,
        affectedElements: failures.reduce((sum, v) => sum + v.count, 0),
        passedRules: fullyPassedRules,
        reviewRules: review.length,
        notApplicableRules: result.inapplicable.length,
      },
      failures,
      passes,
      review,
      previews: preview ? [preview] : [],
      notes: [
        "Only the rendered state of this single public page was tested; cookie choices, logged-in views and full user journeys were not tested.",
        "Automated tests cannot establish full WCAG conformance. Keyboard, screen-reader, meaningful alternative text, and other checks require human review.",
        "A contrast preview is proposed CSS, not a modification to the original website. Verify all component states, overlays, and brand constraints before implementation.",
      ],
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
