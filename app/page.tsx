"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, CircleAlert, Coffee, Eye, FileDown, FileText, Heart, Info, Link2, Loader2, LockKeyhole, MousePointer2, ScanSearch, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Report from "@/components/Report";
import { demoReport } from "@/lib/demo";
import type { ScanReport } from "@/lib/types";

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
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const scan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setError("");
    const value = /^(https?:\/\/)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    try {
      const check = new URL(value);
      if (!check.hostname.includes(".")) throw new Error("Please enter a public webpage URL.");
    } catch { setError("Enter a valid public URL, like https://example.com."); return; }
    setPending(true);
    try {
      const response = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Couldn't complete this scan.");
      setReport(data as ScanReport);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setPending(false); }
  };

  const reset = () => { setReport(null); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(()=>inputRef.current?.focus(), 80); };

  return <div>
    <SiteHeader onHome={report ? reset : undefined}/>
    {report ? <main id="main-content"><Report report={report} onReset={reset}/></main> : <>
      <main id="main-content" className="screen-only">
        <section className="hero"><div className="hero-glow"/><div className="container hero-grid"><div className="hero-copy"><div className="announcement"><span className="announcement-dot"/> A little more accessible, every day <ChevronRight size={14}/></div><h1>A more welcoming web starts <em>here.</em></h1><p className="hero-subtitle">A simple way to understand your website's accessibility. See what's working, discover what's not, and learn how to make it better.</p><form className="url-form" onSubmit={scan}><label htmlFor="website-url" className="sr-only">Webpage URL</label><div className="url-box"><Link2 size={21} className="url-icon"/><input id="website-url" ref={inputRef} inputMode="url" autoComplete="url" type="text" spellCheck={false} placeholder="Paste a website URL" value={url} onChange={e=>setUrl(e.target.value)} disabled={pending} required/><button className="button button-coral" type="submit" disabled={pending}>{pending ? <><Loader2 className="spinning" size={18}/> Scanning</> : <>Check page <ArrowRight size={18}/></>}</button></div></form>{error && <div className="error-message" role="alert"><CircleAlert size={16}/>{error}</div>}<div className="hero-micro"><span><Check size={14}/> No sign up</span><span><Check size={14}/> One page at a time</span><span><Check size={14}/> Free to use</span></div><button className="sample-link" onClick={()=>{setReport(demoReport);window.scrollTo({top:0,behavior:"smooth"});}}>Take a look at a sample report <ArrowUpRight size={16}/></button></div><div className="hero-right"><div className="decor-dot decor-dot-top"/><SampleCard/><div className="decor-dot decor-dot-bottom"/></div></div></section>
        <section className="section-how" id="how-it-works"><div className="container"><div className="section-kicker">HOW IT WORKS</div><div className="section-headline"><h2>Clear answers.<br/>Without the complexity.</h2><p>Accessibility can feel overwhelming. Getting started shouldn't.</p></div><Steps/></div></section>
        <section className="section-why" id="why"><div className="container why-grid"><div className="why-intro"><span className="section-kicker">THE WHOLE PICTURE</span><h2>Not just what's wrong.<br/><em>What's working, too.</em></h2><p>A good accessibility check tells you more than what's broken. See passing checks, understand what automation can't tell you, and focus on meaningful improvements.</p><div className="why-note"><ShieldCheck size={21}/><span>Designed to inform, never to shame.</span></div></div><div className="why-tiles"><div className="why-tile"><div className="tile-icon tile-red"><CircleAlert size={20}/></div><div><h3>What needs fixing</h3><p>Prioritized issues, affected elements, and practical next steps.</p></div></div><div className="why-tile"><div className="tile-icon tile-green"><CheckCircle2 size={20}/></div><div><h3>What already passes</h3><p>Positive automated results, documented in the same report.</p></div></div><div className="why-tile"><div className="tile-icon tile-blue"><Eye size={20}/></div><div><h3>What needs a closer look</h3><p>Honest notes about tests that require human judgment.</p></div></div></div></div></section>
        <section className="section-visual"><div className="container visual-feature"><div className="visual-feature-copy"><span className="section-kicker">DESIGNED TO MAKE SENSE</span><h2>Don't just read the fix.<br/><em>See the difference.</em></h2><p>For supported problems like color contrast, we'll show you what a suggested improvement could look like using the actual element from your page.</p><span className="tiny-note"><Sparkles size={16}/> Actual on-page previews appear for compatible real scans.</span></div><div className="visual-sample"><div className="visual-head"><span><span className="live-dot"/> Example visual recommendation</span><span className="contrast-tag">Color contrast</span></div><div className="visual-panes"><div className="visual-pane"><div className="demo-button demo-before">Explore places</div><div className="pane-footer"><CircleAlert size={15}/> Before <strong>3.54:1</strong></div></div><div className="visual-pane"><div className="demo-button demo-after">Explore places</div><div className="pane-footer pane-pass"><CheckCircle2 size={15}/> Suggested <strong>5.74:1</strong></div></div></div><div className="visual-foot">An illustration of the concept; not from a real website scan.</div></div></div></section>
        <section className="section-values" id="methodology-preview"><div className="container values-grid"><div className="values-icon"><FileText size={27}/></div><div><span className="section-kicker">TRANSPARENT BY DESIGN</span><h2>Helpful evidence, not a compliance certificate.</h2><p>Automated scans are a useful starting point, but they can't test every WCAG requirement or every way people use a site. We clearly separate passing, failing, and inconclusive checks—and make that distinction visible in your report.</p><a href="https://www.w3.org/WAI/test-evaluate/" target="_blank" rel="noopener noreferrer">Read about evaluating accessibility <ArrowUpRight size={15}/></a></div></div></section>
        <section className="home-faq" id="faq-preview"><div className="container home-faq-layout"><div className="home-faq-intro"><span className="section-kicker">A FEW GOOD QUESTIONS</span><h2>Curious? So are we.</h2><p>Accessibility comes with important nuances. Here are a few things worth knowing before you scan.</p><a href="/faq" className="info-text-link">Explore all questions <ArrowUpRight size={16}/></a></div><div className="home-faq-list"><details><summary>Is this really free?<span aria-hidden="true">+</span></summary><p>Yes. Scans, results, supported recommendations and Save as PDF are free. A contribution is entirely optional.</p></details><details><summary>Does a high score mean full compliance?<span aria-hidden="true">+</span></summary><p>No. Automated rules can miss important barriers. We show what passed, what failed, and what needs human evaluation.</p></details><details><summary>Do I need to install anything?<span aria-hidden="true">+</span></summary><p>No. Paste a public page URL; the scanner opens it in a separate browser and returns a one-page report.</p></details></div></div></section>
        <section className="bottom-cta"><div className="container bottom-inner"><div><div className="section-kicker">READY WHEN YOU ARE</div><h2>One page. A clearer view.</h2><p>Start with any public URL. No account, no surprises.</p></div><button className="button button-dark" onClick={()=>{window.scrollTo({top:0,behavior:"smooth"});inputRef.current?.focus();}}>Check a page <ArrowRight size={18}/></button></div></section>
      </main>
    </>}
    {pending && <div className="loading-overlay screen-only" role="status" aria-live="polite"><div className="loading-card"><div className="loading-pulse"><ScanSearch size={27}/></div><h2>Getting a clearer picture</h2><p>Loading the page, inspecting accessibility rules, and preparing your findings. Some websites may take longer or restrict automated tools.</p><div className="loading-list">{stages.map((s,i)=><div key={s}><span className={i===0?"loading-step-active":""}>{i===0?<Loader2 size={14} className="spinning"/>:<span className="loading-blank"/>}</span>{s}</div>)}</div></div></div>}
    <SiteFooter/>
  </div>;
}
