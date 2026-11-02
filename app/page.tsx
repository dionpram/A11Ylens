"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleAlert, Coffee, Eye, FileDown, FileText, Heart, Info, Link2, Loader2, LockKeyhole, MousePointer2, ScanSearch, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Report from "@/components/Report";
import { demoReport } from "@/lib/demo";
import type { ScanReport } from "@/lib/types";
import { parseScanFailure } from "@/lib/scan-errors";
import { normalizeWebsiteInput } from "@/lib/url-input";

const stages = ["Opening the page", "Checking page structure and labels", "Looking for accessibility barriers", "Preparing the report"];

function SampleCard() {
  return <div className="sample-card" aria-label="Illustrative sample report card">
    <div className="sample-top"><span className="sample-mini-logo"><Eye size={18}/></span><span className="sample-label">A clearer picture</span><span className="sample-three">•••</span></div>
    <div className="sample-site"><div className="sample-site-icon">S</div><div><strong>Studio Solis</strong><span>studiosolis.example</span></div><span className="sample-badge">Example</span></div>
    <div className="sample-card-main"><div className="sample-circle"><strong>78</strong><span>/100</span></div><div className="sample-info"><span>Automated checks</span><h3>Room to improve</h3><p>Small changes can make a big difference.</p></div></div>
    <div className="sample-divider"/>
    <div className="sample-list"><div><span className="sample-bullet bullet-red"><CircleAlert size={14}/></span>Color contrast <span>3 issues</span></div><div><span className="sample-bullet bullet-green"><Check size={14}/></span>Document language <span>Passed</span></div><div><span className="sample-bullet bullet-yellow"><Info size={14}/></span>Keyboard navigation <span>Review</span></div></div>
    <div className="sample-floating"><Sparkles size={16}/> Suggestions made visual</div>
  </div>;
}

function Steps() {
  const steps = [
    { no: "01", icon: <Link2 size={24}/>, title: "Paste a URL", desc: "Share a public webpage. We'll only check that one page, so you stay in control." },
    { no: "02", icon: <ScanSearch size={24}/>, title: "See what we found", desc: "Get an honest look at failures, passing checks and what still needs review." },
    { no: "03", icon: <WandSparkles size={24}/>, title: "Make it better", desc: "Understand the problem and explore visual, actionable fixes where supported." },
  ];
  return <div className="steps-grid">{steps.map(step=><div key={step.no} className="step"><div className="step-icon">{step.icon}</div><div className="step-number">{step.no} / 03</div><h3>{step.title}</h3><p>{step.desc}</p></div>)}</div>;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [pending, setPending] = useState(false);
  const [scanAvailable, setScanAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;
    fetch("/api/health", { cache: "no-store" })
      .then(async response => response.ok ? response.json() : null)
      .then(state => { if (mounted) setScanAvailable(state?.scanAvailable === true); })
      .catch(() => { if (mounted) setScanAvailable(false); });
    return () => { mounted = false; };
  }, []);
  const [error, setError] = useState("");
  const [diagnostic, setDiagnostic] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const scan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (scanAvailable !== true) {
      setError("Live scanning is paused while we finish security checks. The sample report is available below.");
      setDiagnostic("SCANNER_PAUSED");
      return;
    }
    setError("");
    setDiagnostic("");
    let value: string;
    try {
      value = normalizeWebsiteInput(url);
    } catch {
      setDiagnostic("INVALID_WEBSITE_URL");
      setError("Enter a public website address, such as https://pramadion.com/. API keys don't go here.");
      return;
    }
    setPending(true);
    try {
      let response: Response;
      try {
        response = await fetch("/api/scan", {
          method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ url: value }), cache: "no-store",
          signal: AbortSignal.timeout(59000),
        });
      } catch {
        setDiagnostic("NETWORK");
        throw new Error("The browser could not reach the scan service. Check the connection and try again.");
      }
      const text = await response.text();
      let data: unknown = null;
      try { data = JSON.parse(text); } catch { /* Non-JSON provider/platform error. */ }
      if (!response.ok) {
        const failure = parseScanFailure(data, response.status);
        setDiagnostic(failure.code);
        throw new Error(failure.message);
      }
      if (!data || typeof data !== "object" || !("id" in data) || !("failures" in data) || !Array.isArray(data.failures) || !("passes" in data) || !Array.isArray(data.passes)) {
        setDiagnostic("INVALID_REPORT");
        throw new Error("The scanner returned an incomplete report. The website has not been evaluated.");
      }
      setReport(data as ScanReport);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setPending(false); }
  };

  const reset = () => { setReport(null); setError(""); setDiagnostic(""); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(()=>inputRef.current?.focus(), 80); };

  return <div>
    <SiteHeader onHome={report ? reset : undefined}/>
    {report ? <main id="main-content"><Report report={report} onReset={reset}/></main> : <>
      <main id="main-content" className="screen-only">
        <section className="hero stitch-hero"><div className="container stitch-hero-inner">
          <div className="stitch-terminal-label"><span aria-hidden="true" className="stitch-prompt">$</span><span>axe-core + Chromium</span><span className="stitch-terminal-separator">/</span><span>one-page accessibility audit</span></div>
          <h1>Understand what’s<br/>working.<br/><em>Fix what isn’t.</em></h1>
          <p className="hero-subtitle">Automated accessibility checks with clear findings, practical next steps, and visual contrast suggestions where supported.</p>
          <form className="url-form" onSubmit={scan}>
            <label htmlFor="website-url" className="sr-only">Website URL to audit</label>
            <div className="stitch-url-box">
              <div className="stitch-url-field"><span className="stitch-url-icon"><Link2 size={19}/></span><div className="stitch-field-content"><span className="stitch-field-label">TARGET DOMAIN</span><input id="website-url" ref={inputRef} inputMode="url" autoComplete="url" type="text" spellCheck={false} placeholder="https://example.com" value={url} onChange={e=>setUrl(e.target.value)} disabled={pending || scanAvailable === false} required/></div></div>
              <div className="stitch-standard"><span className="stitch-field-label">AUDIT METHOD</span><span><span className="stitch-status-dot"/> axe-core <span className="stitch-standard-muted">/ single page</span></span></div>
              <button className="button button-coral stitch-submit" type="submit" disabled={pending || scanAvailable !== true}>{pending ? <><Loader2 className="spinning" size={16}/> Scanning</> : scanAvailable === false ? <>Paused <ShieldCheck size={16}/></> : scanAvailable === null ? <>Checking…</> : <>Audit page <ArrowRight size={16}/></>}</button>
            </div>
          </form>
          {scanAvailable === false && <div role="status" className="scanner-paused-note"><ShieldCheck size={19}/><span>Live scanning is paused while we finish security testing. You can still explore the sample report.</span></div>}
          {error && <div className="error-message" role="alert"><CircleAlert size={16}/><span>{error}{diagnostic && <small style={{display:"block",marginTop:6,opacity:0.8,fontSize:"0.8em"}}>Diagnostic code: {diagnostic}</small>}{diagnostic === "HTTP_503" && <span className="scan-fallback-actions">The remote audit provider is temporarily unavailable. You can still inspect the complete results layout using an explicitly labeled sample. <button type="button" className="scan-fallback-button" onClick={()=>{setReport(demoReport);window.scrollTo({top:0,behavior:"smooth"});}}>View sample results <ArrowRight size={15} aria-hidden="true"/></button></span>}</span></div>}
          <div className="stitch-try"><span>Try an example:</span>{["https://example.com","https://example.org","https://pramadion.com"].map(site=><button type="button" key={site} disabled={pending} onClick={()=>{setUrl(site);inputRef.current?.focus();}}>{new URL(site).hostname}</button>)}</div>
          <button className="sample-link stitch-sample-link" onClick={()=>{setReport(demoReport);window.scrollTo({top:0,behavior:"smooth"});}}>Explore a clearly labeled sample report <ArrowUpRight size={15}/></button>
          <div className="stitch-trust-grid">
            <div className="stitch-trust"><ShieldCheck size={20}/><span><strong>Real browser</strong><small>Chromium + axe-core</small></span></div>
            <div className="stitch-trust"><ScanSearch size={20}/><span><strong>One page at a time</strong><small>Focused automated checks</small></span></div>
            <div className="stitch-trust"><Eye size={20}/><span><strong>Visual suggestions</strong><small>When reliably supported</small></span></div>
            <div className="stitch-trust"><FileDown size={20}/><span><strong>Free PDF report</strong><small>No account required</small></span></div>
          </div>
        </div></section>
        <section className="stitch-showcase-section"><div className="container stitch-feature-panel">
          <div className="stitch-feature-head"><div><span className="stitch-blue-kicker"><ArrowRight size={15}/> VERIFIED CONTRAST EXAMPLE</span><h2>Visual Remedy &amp; Code Diff</h2><p>See how a supported contrast improvement changes an element and its CSS.</p></div><span className="stitch-example-tag">Illustrative example — not a live scan</span></div>
          <div className="stitch-diff-grid">
            <article className="stitch-diff-card stitch-diff-before"><header><CircleAlert size={17}/><strong>Before</strong><span>3.1:1 · below AA text target</span></header><div className="stitch-diff-stage"><div className="stitch-demo-preview"><span className="stitch-demo-eyebrow">TEXT CONTRAST EXAMPLE</span><p className="stitch-simple-sample stitch-simple-before">Make text easier to read.</p><span className="stitch-demo-meta">Lower contrast</span></div></div><div className="stitch-diff-code"><span>/* Example CSS */</span><code>- color: #929292;</code></div><footer>Contrast requires review</footer></article>
            <article className="stitch-diff-card stitch-diff-after"><header><CheckCircle2 size={17}/><strong>Suggested</strong><span>7.0:1 · passes AA text target</span></header><div className="stitch-diff-stage"><div className="stitch-demo-preview"><span className="stitch-demo-eyebrow">TEXT CONTRAST EXAMPLE</span><p className="stitch-simple-sample stitch-simple-after">Make text easier to read.</p><span className="stitch-demo-meta">Higher contrast</span></div></div><div className="stitch-diff-code"><span>/* Example CSS */</span><code>+ color: #595959;</code></div><footer>Real scans provide CSS only when a fix can be verified</footer></article>
          </div>
          <p className="stitch-feature-disclaimer">Actual scan reports show before/after screenshots, measured ratios, and copyable CSS when the scanner can validate a contrast candidate. This illustration is not a scan result.</p>
        </div></section>
        <section className="stitch-capabilities"><div className="container stitch-capability-grid">
          <article className="stitch-cap-card"><span className="stitch-cap-icon green"><CheckCircle2 size={22}/></span><h3>Celebrate What Passes</h3><p>See the automated rules that pass, alongside what fails and what still needs a human review.</p><div className="stitch-cap-foot">Real rule counts in each report</div></article>
          <article className="stitch-cap-card"><span className="stitch-cap-icon blue"><Eye size={22}/></span><h3>Find the Affected Elements</h3><p>Explore selectors, related WCAG references and evidence recorded by the scan.</p><div className="stitch-cap-foot">Element-level evidence</div></article>
          <article className="stitch-cap-card"><span className="stitch-cap-icon coral"><FileText size={22}/></span><h3>Plain-English Guidance</h3><p>Understand the issue and a practical next step without needing to interpret raw audit output.</p><div className="stitch-cap-foot">Clear recommendations, no fabricated fixes</div></article>
        </div></section>
        <section className="stitch-engine-section" id="methodology-preview"><div className="container stitch-engine-panel">
          <div className="stitch-engine-heading"><span className="stitch-terminal-label">AUDIT PIPELINE · WHAT REALLY RUNS</span><h2>How A11Ylens Computes Audits</h2><p>One rendered webpage, automated rule checks, and an evidence-based report.</p></div>
          <div className="stitch-engine-grid">
            <article><span className="stitch-step-index">NODE 01</span><h3>Browser-based scan</h3><p>Chromium opens the requested public page using the configured protected scanner.</p><small>Browser-based rendering</small></article>
            <article><span className="stitch-step-index">NODE 02</span><h3>axe-core rules</h3><p>Collects passed, failed and inconclusive automated accessibility findings.</p><small>WCAG-related rule evidence</small></article>
            <article><span className="stitch-step-index">NODE 03</span><h3>Verified report</h3><p>Summarizes issues, supported visual suggestions and an exportable PDF.</p><small>Not a compliance certificate</small></article>
          </div>
          <a className="stitch-method-link" href="/methodology">Read the complete methodology <ArrowUpRight size={15}/></a>
        </div></section>
        <section className="stitch-public-section" id="about-preview"><div className="container">
          <div className="stitch-public-panel">
            <div className="stitch-public-copy"><span className="stitch-public-kicker"><ShieldCheck size={17}/> INDEPENDENT ACCESSIBILITY TOOL</span><h2>Auditing built for a more accessible web</h2><p>A11Ylens makes automated accessibility findings easier to understand and act on. Free to use, with clear limitations and no account required.</p><span className="stitch-public-fine">One public page per scan · Automated checks are not a compliance certificate</span></div>
            <div className="stitch-repo-card"><div className="stitch-repo-title"><span>A11Ylens / source</span><span className="stitch-repo-status">GitHub</span></div><div className="stitch-repo-details"><div><span>Project</span><strong>A11Ylens</strong></div><div><span>Scanning</span><strong>axe-core + Chromium</strong></div><div><span>Reporting</span><strong>Free PDF export</strong></div></div><a href="https://github.com/dionpram/A11Ylens" target="_blank" rel="noopener noreferrer" className="stitch-repo-link">View project on GitHub <ArrowUpRight size={15}/></a></div>
          </div>
        </div></section>
        <section className="stitch-faq-section" id="faq-preview"><div className="container"><div className="stitch-faq-heading"><span className="section-kicker">DOCUMENTATION &amp; REASONING</span><h2>Frequently asked questions</h2></div><div className="stitch-faq-list">
          <details><summary><span><small>[01]</small> Is an automated scan sufficient for WCAG compliance?</span><ChevronRight size={18}/></summary><p>No. Automated testing can identify many issues but cannot verify every WCAG requirement or real-world interaction. A11Ylens separates passing, failing and inconclusive results, and recommends human evaluation.</p></details>
          <details><summary><span><small>[02]</small> What happens to the website URL I enter?</span><ChevronRight size={18}/></summary><p>The URL is sent to the scanning service and may be processed by the external browser provider. The scan checks a public webpage. Review our <a href="/privacy">privacy information</a> for current limitations and data handling.</p></details>
          <details><summary><span><small>[03]</small> Can I use A11Ylens in a CI pipeline?</span><ChevronRight size={18}/></summary><p>Not as a supported CLI or GitHub Actions integration yet. The current product provides a web-based, one-page audit and PDF report. See our <a href="/methodology">methodology</a> for its scope.</p></details>
          </div><a href="/faq" className="stitch-faq-more">Explore more questions <ArrowUpRight size={15}/></a></div></section>
        <section className="stitch-bottom-section"><div className="container"><div className="stitch-bottom-panel"><span className="stitch-bottom-icon"><ScanSearch size={24}/></span><h2>Ready to check your website?</h2><p>Run a focused accessibility audit. No account or payment required.</p><form className="stitch-bottom-form" onSubmit={scan}><label htmlFor="bottom-website-url" className="sr-only">Website URL to audit</label><Link2 size={19}/><input id="bottom-website-url" type="url" inputMode="url" autoComplete="url" placeholder="https://yourwebsite.com" value={url} onChange={e=>setUrl(e.target.value)} disabled={pending||scanAvailable===false} required/><button className="button button-coral" type="submit" disabled={pending||scanAvailable!==true}>{pending?"Scanning…":scanAvailable===false?"Scanning paused":scanAvailable===null?"Checking…":"Audit now"} <ArrowRight size={15}/></button></form><div className="stitch-bottom-note"><span>axe-core automated rules</span><span aria-hidden="true">·</span><span>Free PDF report</span></div><button className="stitch-bottom-sample" type="button" onClick={()=>{setReport(demoReport);window.scrollTo({top:0,behavior:"smooth"});}}>Explore the sample report</button>{error&&<p role="alert" className="stitch-bottom-error">{error}</p>}</div></div></section>
      </main>
    </>}
    {pending && <div className="loading-overlay screen-only" role="status" aria-live="polite"><div className="loading-card"><div className="loading-pulse"><ScanSearch size={27}/></div><h2>Getting a clearer picture</h2><p>Loading the page, inspecting accessibility rules, and preparing your findings. Some websites may take longer or restrict automated tools.</p><div className="loading-list">{stages.map((s,i)=><div key={s}><span className={i===0?"loading-step-active":""}>{i===0?<Loader2 size={14} className="spinning"/>:<span className="loading-blank"/>}</span>{s}</div>)}</div></div></div>}
    <SiteFooter/>
  </div>;
}
