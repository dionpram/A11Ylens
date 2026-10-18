"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Clipboard, Coffee, Download, ExternalLink, FileCheck2, Info, ListFilter, RefreshCw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import type { Rule, ScanReport, ContrastPreview } from "@/lib/types";

const wcagText = (tag: string) => {
  const clean = tag.replace("wcag", "");
  return clean.length === 3 ? `${clean[0]}.${clean[1]}.${clean[2]}` : tag;
};
const statusTitle = (impact?: string) => (impact || "Review").replace(/^./, c => c.toUpperCase());

function IconMetric({ icon, value, label, type = "neutral" }: { icon: React.ReactNode; value: number; label: string; type?: string }) {
  return <div className={`metric metric-${type}`}><span className="metric-icon">{icon}</span><strong>{value}</strong><span>{label}</span></div>;
}

function Support({ secondary = false }: { secondary?: boolean }) {
  const url = process.env.NEXT_PUBLIC_SUPPORT_URL;
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  if (secondary) return <div className="support-footer"><Coffee size={18} /><span>Found this helpful? Independent tools take care to maintain.</span>{url ? <a href={url} target="_blank" rel="noopener noreferrer">Leave a little thank-you <ArrowRight size={15}/></a> : <span className="muted">Contributions open soon</span>}</div>;
  return <aside className="support-panel" aria-label="Optional support">
    <div className="support-heart"><Coffee size={23} /></div>
    <div className="support-main"><h3>Useful so far? Help keep it free.</h3><p>This is an independent project. Every check and every fix is free; if this report saved you time, a small contribution helps keep it running.</p>
      {url ? <a className="button button-dark button-small" target="_blank" rel="noopener noreferrer" href={url}>Support the project <ArrowRight size={15}/></a> : <span className="small-note">Contributions will be available after launch. Your full report remains free.</span>}
    </div>
    <button className="icon-button dismiss" aria-label="Dismiss support suggestion" onClick={() => setDismissed(true)}>×</button>
  </aside>;
}

function ScoreCard({ report }: { report: ScanReport }) {
  return <section className="overview-card">
    <div className="score-number-wrap">
      <div className="score-ring" style={{ "--score": `${report.score ?? 0}%` } as React.CSSProperties}>
        <div><strong>{report.score ?? "—"}</strong><span>/100</span></div>
      </div>
      <div className="score-description"><span className="eyebrow">{report.environment.engine.startsWith("Lighthouse") ? "LIGHTHOUSE ACCESSIBILITY SCORE" : "AUTOMATED RULE PASS RATE"}</span><h2>{report.score === null ? "Not enough checks" : report.score >= 90 ? "A good starting point" : report.score >= 70 ? "Room to improve" : "Some work to do"}</h2><p>This score summarizes tested axe rules, not total accessibility or legal compliance. Review the findings below for the details.</p></div>
    </div>
    <div className="metric-grid">
      <IconMetric icon={<CircleAlert size={19}/>} value={report.counts.failedRules} label="Failed rules" type="fail"/>
      <IconMetric icon={<CheckCircle2 size={19}/>} value={report.counts.passedRules} label="Passed rules" type="pass"/>
      <IconMetric icon={<Info size={19}/>} value={report.counts.reviewRules} label="Needs review" type="review"/>
      <IconMetric icon={<BookOpen size={19}/>} value={report.counts.notApplicableRules} label="Not applicable" />
    </div>
  </section>;
}

function VisualPreview({ preview }: { preview: ContrastPreview }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(preview.css); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <section className="visual-preview">
    <div className="preview-intro"><div className="preview-spark"><Sparkles size={19}/></div><div><h4>See what a fix could look like</h4><p>We captured this element from the real page and tried a more readable color.</p></div></div>
    <div className="preview-grid">
      <div><div className="preview-shot">{/* eslint-disable-next-line @next/next/no-img-element */}<img alt="Original scanned element" src={preview.beforeImage} /></div><div className="preview-detail"><span className="status-dot fail"/>Before <strong>{preview.beforeRatio.toFixed(2)}:1</strong></div><code>{preview.beforeValue}</code></div>
      <div><div className="preview-shot">{/* eslint-disable-next-line @next/next/no-img-element */}<img alt="Same element with suggested CSS applied" src={preview.afterImage} /></div><div className="preview-detail"><span className="status-dot pass"/>Suggested <strong>{preview.afterRatio.toFixed(2)}:1</strong></div><code>{preview.afterValue}</code></div>
    </div>
    <p className="preview-check">Contrast target: {preview.threshold}:1 · {preview.confirmedByRescan ? "Automated axe recheck found no remaining contrast violation for this selector" : "Visual suggestion only; automated recheck was inconclusive"}</p>
    <div className="code-wrap"><code>{preview.css}</code><button onClick={copy} className="copy-code" aria-label="Copy suggested CSS">{copied ? <Check size={15}/> : <Clipboard size={15}/>} {copied ? "Copied" : "Copy CSS"}</button></div>
    <p className="fine-print">Suggested CSS may affect other elements using the selector. Test hover, focus and mobile states before deploying.</p>
  </section>;
}

function RuleCard({ rule, number, preview }: { rule: Rule; number: number; preview?: ContrastPreview }) {
  const [expanded, setExpanded] = useState(number === 0);
  return <article className="rule-card">
    <button className="rule-card-toggle" onClick={() => setExpanded(v => !v)} aria-expanded={expanded}>
      <div className="rule-number">{String(number + 1).padStart(2, "0")}</div><div className="rule-summary"><div className="rule-tag"><span className={`severity severity-${rule.impact || "unknown"}`}>{statusTitle(rule.impact)}</span><span>{rule.count} affected {rule.count === 1 ? "element" : "elements"}</span></div><h3>{rule.title}</h3></div><span className="expand-icon">{expanded ? <ChevronUp size={21}/> : <ChevronDown size={21}/>}</span>
    </button>
    {expanded && <div className="rule-body">
      <p className="rule-description">{rule.description}</p>
      {rule.recommendation && <div className="recommended-action"><strong>Suggested next step</strong><p>{rule.recommendation}</p></div>}
      <div className="rule-links"><span className="label-small">RELATED WCAG</span>{rule.wcag.length ? rule.wcag.map(tag => <span className="wcag-pill" key={tag}>{wcagText(tag)}</span>) : <span className="muted">General best practice</span>}{rule.helpUrl && <a href={rule.helpUrl} target="_blank" rel="noopener noreferrer" className="source-link">How to fix this <ExternalLink size={13}/></a>}</div>
      {preview && <VisualPreview preview={preview}/>}
      {rule.nodes?.length ? <div className="elements"><h4>Where we found it</h4>{rule.nodes.slice(0, 8).map((node, index) => <div className="node-row" key={index}><code>{node.target}</code><p>{node.summary}</p><pre>{node.html}</pre></div>)}{rule.nodes.length > 8 && <p className="small-note">Showing 8 of {rule.nodes.length} stored elements.</p>}</div> : null}
    </div>}
  </article>;
}

function RulesList({ rules, type }: { rules: Rule[]; type: "pass" | "review" }) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? rules : rules.slice(0, 12);
  return <div className="checks-list">{shown.map(rule => <div className="check-row" key={rule.id}><div className={`check-icon ${type}`} >{type === "pass" ? <Check size={17}/> : <Info size={17}/>}</div><div className="check-content"><strong>{rule.title}{rule.partiallyPassing && <span className="partial-pass"> · Some elements also failed this rule</span>}</strong><p>{rule.description || `${rule.count} automated test ${rule.count === 1 ? "instance" : "instances"} recorded`}</p></div><span className="count-pill">{rule.count}</span></div>)}{rules.length > 12 && <button className="text-button" onClick={() => setShowAll(v => !v)}>{showAll ? "Show fewer" : `Show all ${rules.length} checks`} <ChevronDown size={15}/></button>}{!rules.length && <p className="muted empty-results">No {type === "pass" ? "passing rules" : "inconclusive rules"} were recorded for this scan.</p>}</div>;
}

function PrintableReport({ report }: { report: ScanReport }) {
  return <article className="print-only printable-report">
    <h1>Access Lens · Automated accessibility assessment</h1><p>{report.finalUrl}</p>
    <p>{new Date(report.scannedAt).toLocaleString()} · {report.environment.viewport} · {report.environment.engine}</p>
    {report.demo && <p><strong>DEMONSTRATION DATA · NOT AN ACTUAL SCAN</strong></p>}
    <h2>Summary</h2><p>{report.environment.engine.startsWith("Lighthouse") ? "Lighthouse accessibility score" : "Automated rule pass rate"}: <strong>{report.score ?? "Not available"}/100</strong></p><p>{report.scoreMethod}</p>
    <p>{report.counts.failedRules} failed rules · {report.counts.passedRules} passed rules · {report.counts.reviewRules} review items · {report.counts.notApplicableRules} inapplicable rules</p>
    <h2>Detected failures</h2>{report.failures.map(r => <section key={r.id}><h3>{r.title} ({r.impact})</h3><p>{r.description}</p>{r.recommendation && <p><strong>Suggested next step:</strong> {r.recommendation}</p>}<p>Instances: {r.count} · {r.wcag.join(", ")}</p>{r.nodes?.map((n,i)=><div key={i}><code>{n.target}</code><p>{n.summary}</p></div>)}{report.previews.filter(v=>v.ruleId===r.id).map((p,i)=><div key={i}><h4>Visual suggestion</h4><div className="print-preview-grid"><div><p>Before · {p.beforeRatio}:1</p><img src={p.beforeImage} alt="Original element"/></div><div><p>After · {p.afterRatio}:1</p><img src={p.afterImage} alt="Suggested revision"/></div></div><pre>{p.css}</pre></div>)}</section>)}
    <h2>Passing automated rule instances</h2>{report.passes.map(r=><p key={r.id}><strong>{r.title}</strong> · {r.count} passing instances {r.partiallyPassing ? "(other elements failed the same rule)" : ""}</p>)}
    <h2>Inconclusive checks</h2>{report.review.map(r=><p key={r.id}><strong>{r.title}</strong> · {r.count} test instances</p>)}
    <h2>Method and limitations</h2>{report.notes.map((note,i)=><p key={i}>{note}</p>)}<p>Not a WCAG conformance certificate or legal opinion. Exported by browser Print / Save as PDF.</p>
  </article>;
}

export default function Report({ report, onReset }: { report: ScanReport; onReset: () => void }) {
  const [tab, setTab] = useState<"failed" | "passed" | "review">("failed");
  return <>
    <div className="results-shell screen-only">
      <div className="results-heading"><div><button className="back-button" onClick={onReset}><ArrowLeft size={16}/> Back to scanner</button><div className="eyebrow top-label">YOUR REPORT</div><h1>Here's what we found<span className="text-coral">.</span></h1><p className="muted">A clearer look at what's working, and what could be better.</p></div><button className="button button-dark export-top" onClick={() => window.print()}><Download size={17}/> Save as PDF</button></div>
      {report.demo && <div className="demo-warning"><Info size={17}/> This is a sample report with fictional findings. No website was scanned.</div>}
      <div className="report-meta"><div className="meta-website"><span className="small-orbit"><ShieldCheck size={17}/></span><div><strong>{report.pageTitle}</strong><p title={report.finalUrl}>{report.finalUrl}</p></div></div><div className="meta-time">Scanned {new Date(report.scannedAt).toLocaleString(undefined,{ dateStyle:"medium", timeStyle:"short"})}</div></div>
      <ScoreCard report={report}/>
      <div className="results-main">
        <div className="section-heading"><div><span className="eyebrow">THE BREAKDOWN</span><h2>Explore your results</h2><p>Every check is visible. No hidden results or locked recommendations.</p></div></div>
        <div className="tabs" role="tablist" aria-label="Result categories"><button role="tab" aria-selected={tab==="failed"} className={tab==="failed"?"active":""} onClick={()=>setTab("failed")}><CircleAlert size={17}/> Needs fixing <span>{report.counts.failedRules}</span></button><button role="tab" aria-selected={tab==="passed"} className={tab==="passed"?"active":""} onClick={()=>setTab("passed")}><CheckCircle2 size={17}/> Passed <span>{report.counts.passedRules}</span></button><button role="tab" aria-selected={tab==="review"} className={tab==="review"?"active":""} onClick={()=>setTab("review")}><ListFilter size={17}/> Needs review <span>{report.counts.reviewRules}</span></button></div>
        {tab === "failed" && <section role="tabpanel" aria-label="Issues that need fixing" className="tab-panel"><div className="tab-intro"><h3>Start with these issues</h3><p>Findings are sorted by severity. Expand each one to see affected elements and what to change.</p></div>{report.failures.length ? report.failures.map((r,i)=><div key={r.id}><RuleCard rule={r} number={i} preview={report.previews.find(p=>p.ruleId===r.id)}/>{i===0 && <Support/>}</div>) : <div className="empty-results success-empty"><CheckCircle2 size={30}/><h3>No automated violations detected</h3><p>That does not mean the page is fully accessible. Check the review tab for evaluation limits.</p></div>}{!report.failures.length && <Support/>}</section>}
        {tab === "passed" && <section role="tabpanel" aria-label="Passed checks" className="tab-panel"><div className="tab-intro"><h3>What's working well</h3><p>These elements passed their automated checks. Some rules may also have failing elements, which are listed in the Needs fixing tab.</p></div><RulesList rules={report.passes} type="pass"/></section>}
        {tab === "review" && <section role="tabpanel" aria-label="Checks needing review" className="tab-panel"><div className="tab-intro"><h3>Some things need a human</h3><p>Automation can't evaluate every part of a real experience. These specific checks were inconclusive.</p></div><RulesList rules={report.review} type="review"/><div className="manual-note"><BookOpen size={19}/><div><strong>Always test the actual experience</strong><p>Keyboard flow, meaningful alternative text, focus behavior, screen readers, touch use and complete user journeys need additional human testing—even if this tab is empty.</p></div></div></section>}
      </div>
      <section className="method-note"><Info size={20}/><div><h3>A helpful starting point, not a certificate.</h3><p>{report.scoreMethod} Automated evaluation cannot establish full WCAG compliance, and this scan covers only one rendered page state. <a href="https://www.w3.org/WAI/test-evaluate/" target="_blank" rel="noopener noreferrer">Learn about accessibility evaluation <ExternalLink size={12}/></a></p></div></section>
      <section className="last-actions"><div><h2>Keep making the web better.</h2><p>Download everything you found or check another page. Always free.</p></div><div className="last-buttons"><button className="button button-light" onClick={() => window.print()}><FileCheck2 size={17}/> Save as PDF</button><button className="button button-coral" onClick={onReset}>Check another page <RefreshCw size={16}/></button></div></section>
      <Support secondary/>
    </div>
    <PrintableReport report={report}/>
  </>;
}
