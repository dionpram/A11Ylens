import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleAlert, Eye, FileDown, Link2, ScanSearch, WandSparkles } from "lucide-react";
import { InfoLayout } from "@/components/InfoLayout";

export const metadata: Metadata = {
  title: "How it works | Access Lens",
  description: "See how Access Lens turns one public URL into a clear accessibility report, including passed checks and visual suggestions.",
};

const steps = [
  { number: "01", icon: Link2, title: "Share a single URL", body: "Paste the public page you want to inspect. We scan that page's rendered state, not every page on the domain. No account or website installation is needed." },
  { number: "02", icon: ScanSearch, title: "We check the page", body: "A real browser opens the page and runs automated accessibility checks. You'll see detected issues, passing rules and items that need closer review." },
  { number: "03", icon: WandSparkles, title: "Understand what to change", body: "Explore affected elements and practical guidance. For certain color-contrast problems, we can capture a suggested before-and-after preview from the actual page." },
  { number: "04", icon: FileDown, title: "Take your findings with you", body: "Review every available finding for free, then save your report using your browser's Print / Save as PDF option. Contributions are always optional." },
];

export default function HowItWorks() {
  return <InfoLayout eyebrow="HOW IT WORKS" title="Better accessibility starts with a single page." intro="You don't need to be an expert to find a place to begin. Here's what happens when you run a check.">
    <section className="info-section"><div className="info-split-heading"><h2>Four simple steps.</h2><p>From a webpage URL to a report you can actually work with.</p></div><div className="journey-grid">{steps.map(({number,icon:Icon,title,body}) => <article className="journey-card" key={number}><div className="journey-card-top"><div className="journey-icon"><Icon size={24} aria-hidden="true"/></div><span>{number} / 04</span></div><h3>{title}</h3><p>{body}</p></article>)}</div></section>
    <section className="info-section info-section-divider"><div className="info-split-heading"><h2>The whole picture, not just errors.</h2><p>Making a site more accessible means understanding both what works and what needs attention.</p></div><div className="outcome-grid"><article><div className="tile-icon tile-red"><CircleAlert size={21}/></div><h3>Needs fixing</h3><p>Prioritized automated violations, with relevant elements, WCAG references and suggestions.</p></article><article><div className="tile-icon tile-green"><CheckCircle2 size={21}/></div><h3>Passed checks</h3><p>Automated rules that passed in the tested page state. A passing rule is not a full compliance guarantee.</p></article><article><div className="tile-icon tile-blue"><Eye size={21}/></div><h3>Needs review</h3><p>Inconclusive checks and reminders about what only a person can really evaluate.</p></article></div></section>
    <section className="info-section info-feature-panel"><div><span className="section-kicker">VISUAL RECOMMENDATIONS</span><h2>See the change, not just the code.</h2><p>Where it's technically reliable, Access Lens captures the actual element from the scanned site and previews a candidate CSS correction. It never edits the live website.</p><Link href="/methodology">How the checks work <ArrowUpRight size={15} aria-hidden="true"/></Link></div><div className="info-preview-example" aria-label="Illustrative contrast change"><span>Illustrative example</span><div className="preview-example-row"><div><div className="preview-example-button preview-example-before">Explore</div><small>Before · lower contrast</small></div><div><div className="preview-example-button preview-example-after">Explore</div><small>Suggested · higher contrast</small></div></div></div></section>
  </InfoLayout>;
}
