export type Impact = "critical" | "serious" | "moderate" | "minor" | "unknown";

export type Rule = {
  id: string;
  title: string;
  description?: string;
  recommendation?: string;
  partiallyPassing?: boolean;
  helpUrl?: string;
  impact?: Impact;
  wcag: string[];
  count: number;
  nodes?: Array<{ target: string; summary: string; html: string }>;
};

export type ContrastPreview = {
  ruleId: string;
  target: string;
  property: "color" | "background-color";
  beforeValue: string;
  afterValue: string;
  beforeRatio: number;
  afterRatio: number;
  threshold: number;
  beforeImage: string;
  afterImage: string;
  confirmedByRescan: boolean;
  css: string;
};

export type ScanReport = {
  id: string;
  inputUrl: string;
  finalUrl: string;
  pageTitle: string;
  scannedAt: string;
  durationMs: number;
  score: number | null;
  scoreMethod: string;
  environment: { viewport: string; browser: string; engine: string };
  counts: {
    failedRules: number;
    affectedElements: number;
    passedRules: number;
    reviewRules: number;
    notApplicableRules: number;
  };
  failures: Rule[];
  passes: Rule[];
  review: Rule[];
  previews: ContrastPreview[];
  demo?: boolean;
  notes: string[];
};
