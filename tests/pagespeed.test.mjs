import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPageSpeedRequest, mapPageSpeedReport } from "../lib/pagespeed.ts";

const payload = {
  id: "https://example.com/",
  lighthouseResult: {
    finalUrl: "https://example.com/",
    fetchTime: "2026-10-18T12:00:00.000Z",
    categories: {
      accessibility: {
        score: 0.85,
        auditRefs: [
          { id: "color-contrast", weight: 3 }, { id: "image-alt", weight: 10 },
          { id: "label", weight: 10 }, { id: "aria-allowed-attr", weight: 0 },
          { id: "document-title", weight: 0 },
        ],
      },
    },
    audits: {
      "color-contrast": {
        id: "color-contrast", title: "Background and foreground colors do not have sufficient contrast",
        description: "Text contrast is insufficient.",
        score: 0, scoreDisplayMode: "binary",
        details: { items: [{ node: { selector: ".bad-button", snippet: '<button class="bad-button">Next</button>' } }] },
      },
      "image-alt": { id: "image-alt", title: "Images have alt", score: 1, scoreDisplayMode: "binary" },
      "label": { id: "label", title: "Form labels", score: null, scoreDisplayMode: "manual" },
      "aria-allowed-attr": { id: "aria-allowed-attr", title: "ARIA attributes", score: null, scoreDisplayMode: "notApplicable" },
      "document-title": { id: "document-title", title: "Document title", score: 1, scoreDisplayMode: "binary" },
    },
  },
};

test("maps Google Lighthouse results to honest failure, pass, review and inapplicable buckets", () => {
  const r = mapPageSpeedReport(payload, "https://example.com/");
  assert.equal(r.score, 85);
  assert.match(r.scoreMethod, /Google Lighthouse/);
  assert.equal(r.counts.failedRules, 1);
  assert.equal(r.counts.passedRules, 2);
  assert.equal(r.counts.reviewRules, 1);
  assert.equal(r.counts.notApplicableRules, 1);
  assert.equal(r.failures[0].nodes[0].target, ".bad-button");
  assert.equal(r.previews.length, 0);
  assert.equal(r.environment.engine, "Lighthouse (Google PageSpeed Insights)");
});

test("rejects missing and incomplete provider audits rather than fabricating successful scans", () => {
  assert.throws(() => mapPageSpeedReport({}, "https://example.com/"), /no accessibility audit/);
  assert.throws(() => mapPageSpeedReport({ lighthouseResult: { runtimeError: { message: "failed" }, categories: { accessibility: { score: 1 } }, audits: {} } }, "https://example.com/"), /could not complete/);
  assert.throws(() => mapPageSpeedReport({ lighthouseResult: { categories: { accessibility: { score: null } }, audits: {} } }, "https://example.com/"), /complete accessibility score/);
});

test("creates a correctly encoded Google request with documented lowercase values", () => {
  const url = buildPageSpeedRequest("https://pramadion.com/?topic=design&lang=en");
  assert.equal(url.hostname, "www.googleapis.com");
  assert.equal(url.pathname, "/pagespeedonline/v5/runPagespeed");
  assert.equal(url.searchParams.get("url"), "https://pramadion.com/?topic=design&lang=en");
  assert.equal(url.searchParams.get("category"), "accessibility");
  assert.equal(url.searchParams.get("strategy"), "desktop");
  assert.ok(!url.searchParams.has("key"));
});
