import type { ScanReport, Rule, ContrastPreview } from "@/lib/types";

const rank: Record<string,number> = {critical:0,serious:1,moderate:2,minor:3,unknown:4};
const when = (value:string) => new Date(value).toLocaleString("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"UTC"})+" UTC";
const severity = (value?:string) => (value||"review").replace(/^./,c=>c.toUpperCase());
function Wcag({tags}:{tags:string[]}) {
  const values=tags.filter(t=>/^wcag\d{3}$/.test(t)).map(t=>t.slice(4).split("").join("."));
  return <>{values.length?values.join(" · "):"General automated check"}</>;
}
function Finding({rule,index,preview}:{rule:Rule;index:number;preview?:ContrastPreview}) {
  return <section className="pdf-finding">
    <div className="pdf-finding-heading">
      <span className="pdf-index">{String(index+1).padStart(2,"0")}</span>
      <div><span className={"pdf-severity pdf-"+(rule.impact||"unknown")}>{severity(rule.impact)}</span>
      <h3>{rule.title}</h3><p>{rule.count} affected {rule.count===1?"element":"elements"} · <Wcag tags={rule.wcag}/></p></div>
    </div>
    {rule.description&&<p className="pdf-description">{rule.description}</p>}
    <div className="pdf-action"><strong>Suggested next step</strong><p>{rule.recommendation||"Review the identified elements and address this rule's root cause."}</p></div>
    {!!rule.nodes?.length&&<div className="pdf-evidence"><h4>Where we found it</h4>
      {rule.nodes.slice(0,5).map((node,i)=><div className="pdf-evidence-row" key={i}><code>{node.target}</code><p>{node.summary}</p></div>)}
      {rule.nodes.length>5&&<p className="pdf-caption">Showing 5 of {rule.nodes.length} stored element examples.</p>}
    </div>}
    {preview&&<div className="pdf-visual"><h4>Visual contrast recommendation</h4><p>Suggested change using colors from the scanned element.</p>
      <div className="pdf-visual-grid">
        <div><strong>BEFORE · {preview.beforeRatio.toFixed(2)}:1</strong>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.beforeImage} alt="Original scanned element"/><code>{preview.beforeValue}</code>
        </div>
        <div><strong>SUGGESTED · {preview.afterRatio.toFixed(2)}:1</strong>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.afterImage} alt="Element with proposed color fix"/><code>{preview.afterValue}</code>
        </div>
      </div>
      <p className="pdf-caption">Contrast target {preview.threshold}:1 · {preview.confirmedByRescan?"Automated rescan passed for this selector":"Visual-only suggestion; rescan inconclusive"}</p>
      <pre>{preview.css}</pre>
    </div>}
    {rule.helpUrl&&<p className="pdf-reference">Technical reference: {rule.helpUrl}</p>}
  </section>;
}
function ResultsTable({rules,review=false}:{rules:Rule[];review?:boolean}) {
  return rules.length?<table className="pdf-table">
    <thead><tr><th scope="col">Automated rule</th><th scope="col">Instances</th><th scope="col">{review?"Outcome":"Status"}</th></tr></thead>
    <tbody>{rules.map(r=><tr key={r.id}><td><strong>{r.title}</strong><small><Wcag tags={r.wcag}/></small></td>
      <td>{r.count}</td><td>{review?"Needs human review":r.partiallyPassing?"Partial pass":"Passed"}</td></tr>)}</tbody>
  </table>:<p>No {review?"inconclusive":"passing"} automated checks were recorded for this scan.</p>;
}
export default function PrintableReport({report}:{report:ScanReport}) {
  const findings=[...report.failures].sort((a,b)=>(rank[a.impact||"unknown"]??4)-(rank[b.impact||"unknown"]??4)||b.count-a.count);
  const summary=report.counts;
  const isLighthouse=report.environment.engine.startsWith("Lighthouse");
  return <article className="print-only pdf-report" aria-label="Printable accessibility assessment">
    <header className="pdf-cover">
      <div className="pdf-cover-top"><span className="pdf-brand-mark">a<span>·</span></span><strong>A11Ylens</strong><span>AUTOMATED ACCESSIBILITY INSIGHTS</span></div>
      <div className="pdf-cover-main">
        <p className="pdf-kicker">{report.demo?"SAMPLE REPORT · NOT AN ACTUAL SCAN":"AUTOMATED ACCESSIBILITY ASSESSMENT"}</p>
        <h1>A clearer picture<br/>of your website.</h1>
        <p>What works, what needs attention, and where to begin.</p>
      </div>
      <div className="pdf-cover-site"><span>PAGE REVIEWED</span><strong>{report.pageTitle}</strong><p>{report.finalUrl}</p><small>Scanned {when(report.scannedAt)} · One-page snapshot</small></div>
      <p className="pdf-cover-footnote">{report.demo?"Illustrative findings only — no website was scanned.":"Automated findings only — not a WCAG conformance certificate."}</p>
    </header>

    <section className="pdf-section pdf-summary">
      <div className="pdf-kicker">01 / AT A GLANCE</div><h2>Executive summary</h2>
      <p className="pdf-lead">We found <strong>{summary.failedRules} rules with violations</strong> affecting <strong>{summary.affectedElements} elements</strong>. {summary.failedRules?"Start with the highest-impact findings.":"No violations were detected by automated checks, but manual testing is still needed."}</p>
      <div className="pdf-metrics">
        <div className="pdf-metric pdf-metric-score"><span>{isLighthouse?"LIGHTHOUSE SCORE":"AUTOMATED RULE PASS RATE"}</span><strong>{report.score??"—"}<small>{report.score===null?"":"/100"}</small></strong><p>Not a compliance score</p></div>
        <div className="pdf-metric pdf-metric-failed"><span>NEEDS FIXING</span><strong>{summary.failedRules}</strong><p>Failed rules</p></div>
        <div className="pdf-metric pdf-metric-passed"><span>PASSED</span><strong>{summary.passedRules}</strong><p>Fully passed rules</p></div>
        <div className="pdf-metric pdf-metric-review"><span>REVIEW</span><strong>{summary.reviewRules}</strong><p>Inconclusive checks</p></div>
      </div>
      <div className="pdf-explainer"><strong>How to interpret these results</strong><p>Passed checks describe automated findings for this single page state—not a claim of full accessibility. Review items require human judgment. Automated results cannot prove WCAG compliance.</p></div>
    </section>

    <section className="pdf-section">
      <div className="pdf-kicker">02 / START HERE</div><h2>Recommended priorities</h2>
      <p className="pdf-section-desc">The most important detected issues, sorted by severity and number of affected elements.</p>
      {findings.length?<div className="pdf-priority-list">{findings.slice(0,3).map((r,i)=><div className="pdf-priority" key={r.id}>
        <span>{String(i+1).padStart(2,"0")}</span><div><small>{severity(r.impact)} · {r.count} affected</small><h3>{r.title}</h3><p>{r.recommendation||r.description||"Review the detailed finding."}</p></div>
      </div>)}</div>:<p>No automated violations detected. Continue with the review checklist.</p>}
    </section>

    <section className="pdf-section pdf-details">
      <div className="pdf-kicker">03 / ACTIONABLE FINDINGS</div><h2>What needs fixing</h2>
      <p className="pdf-section-desc">{findings.length} failed {findings.length===1?"rule":"rules"}; each detailed finding includes suggested actions and examples when available.</p>
      {findings.length?findings.map((r,i)=><Finding key={r.id} rule={r} index={i} preview={report.previews.find(p=>p.ruleId===r.id)}/>):<p>No automated failures detected. Manual testing remains essential.</p>}
    </section>

    <section className="pdf-section">
      <div className="pdf-kicker">04 / POSITIVE RESULTS</div><h2>What's working well</h2>
      <p className="pdf-section-desc">Passing automated rule instances are included for transparency. A partial pass means that other elements still failed the same rule.</p>
      <ResultsTable rules={report.passes}/>
    </section>

    <section className="pdf-section">
      <div className="pdf-kicker">05 / REQUIRES HUMAN JUDGMENT</div><h2>What needs review</h2>
      <ResultsTable rules={report.review} review/>
      <div className="pdf-explainer"><strong>Suggested manual checks</strong><p>Keyboard and focus order · Screen readers · Alternative text meaning · Dialogs and error messages · Zoom and reflow · Complete user journeys.</p></div>
    </section>

    <section className="pdf-section pdf-method">
      <div className="pdf-kicker">06 / METHODOLOGY</div><h2>About this assessment</h2>
      <dl><div><dt>Evaluated URL</dt><dd>{report.finalUrl}</dd></div><div><dt>Evaluation time</dt><dd>{when(report.scannedAt)}</dd></div>
        <div><dt>Browser / engine</dt><dd>{report.environment.browser} / {report.environment.engine}</dd></div>
        <div><dt>Viewport</dt><dd>{report.environment.viewport}</dd></div>
        <div><dt>Report ID</dt><dd>{report.id}</dd></div>
        <div><dt>Not applicable</dt><dd>{summary.notApplicableRules} rules</dd></div></dl>
      <h3>How the score is calculated</h3><p>{report.scoreMethod}</p>
      <h3>Scope and limitations</h3>{report.notes.map((note,i)=><p key={i}>{note}</p>)}
      <div className="pdf-explainer"><strong>Important</strong><p>This is not a legal certification, a comprehensive website audit, or proof of WCAG conformance. It captures automated observations of one rendered page at one point in time.</p></div>
      <p className="pdf-reference">Testing guidance: https://www.w3.org/WAI/test-evaluate/</p>
    </section>
    <footer className="pdf-end"><strong>A11Ylens</strong><p>Clarity first. Accessibility for everyone.</p><small>Generated via browser Print / Save as PDF · a11ylens-kappa.vercel.app</small></footer>
  </article>;
}
