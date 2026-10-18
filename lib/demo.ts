import type { ScanReport } from "./types";

export const demoReport: ScanReport = {
  id: "demo-not-an-audit",
  inputUrl: "https://example.com",
  finalUrl: "https://example.com",
  pageTitle: "Example design studio · sample only",
  scannedAt: "2026-10-18T10:00:00.000Z",
  durationMs: 0,
  score: 78,
  scoreMethod: "Illustrative demo score. This dataset was written by hand and is not the result of a scan.",
  environment: { viewport: "1365 × 900", browser: "Sample", engine: "Sample" },
  counts: { failedRules: 3, affectedElements: 7, passedRules: 11, reviewRules: 2, notApplicableRules: 4 },
  failures: [
    { id: "color-contrast", title: "Elements must have sufficient color contrast", impact: "serious", count: 3, wcag: ["wcag143"], description: "Some foreground and background color combinations are difficult to read.", nodes: [{ target: ".btn-primary", html: '<button class="btn-primary">Continue</button>', summary: "Increase the contrast of the button text and its background." }] },
    { id: "button-name", title: "Buttons must have discernible text", impact: "critical", count: 2, wcag: ["wcag412"], description: "Buttons need an accessible name so assistive technology can announce their purpose.", nodes: [{ target: "button.icon-only", html: '<button class="icon-only"><svg>...</svg></button>', summary: "Provide a visible text label or an appropriate accessible name." }] },
    { id: "image-alt", title: "Images must have alternate text", impact: "serious", count: 2, wcag: ["wcag111"], description: "Meaningful images require accurate alternatives.", nodes: [{ target: "img.hero-photo", html: '<img class="hero-photo" src="...">', summary: "Provide context-appropriate alternative text; decorative images may use an empty alt attribute." }] },
  ],
  passes: [
    { id: "html-has-lang", title: "HTML element has a language attribute", count: 1, wcag: ["wcag311"] },
    { id: "document-title", title: "Document has a title", count: 1, wcag: ["wcag242"] },
    { id: "landmark-one-main", title: "Document has one main landmark", count: 1, wcag: ["wcag131"] },
    { id: "link-name", title: "Links have discernible names", count: 12, wcag: ["wcag412"] },
    { id: "label", title: "Form inputs have accessible labels", count: 6, wcag: ["wcag332"] },
    { id: "meta-viewport", title: "Viewport supports zoom and scaling", count: 1, wcag: ["wcag144"] },
    { id: "region", title: "Page content is in landmarks", count: 10, wcag: ["wcag131"] },
    { id: "heading-order", title: "Heading elements follow a logical order", count: 5, wcag: [] },
    { id: "list", title: "Lists are marked up correctly", count: 4, wcag: ["wcag131"] },
    { id: "aria-roles", title: "ARIA roles use valid values", count: 7, wcag: ["wcag412"] },
    { id: "valid-lang", title: "Language value is valid", count: 1, wcag: ["wcag311"] },
  ],
  review: [
    { id: "color-contrast-review", title: "Overlay contrast requires manual inspection", count: 2, wcag: ["wcag143"], description: "Background images and overlays can make some contrast checks inconclusive." },
    { id: "aria-hidden-focus", title: "Hidden interactive elements require review", count: 1, wcag: ["wcag412"], description: "Check focus behavior and assistive technology interaction." },
  ],
  previews: [],
  demo: true,
  notes: ["This is manually constructed sample data. No page was scanned.", "Automated checks do not prove WCAG conformance or legal compliance."],
};
