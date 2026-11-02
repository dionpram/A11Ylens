import { ArrowRight, ScanSearch } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export function InfoLayout({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <>
    <SiteHeader />
    <main id="main-content" className="info-main stitch-info-main">
      <section className="info-hero stitch-info-hero"><div className="container info-hero-inner"><span className="stitch-terminal-label">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></section>
      <div className="container info-content stitch-info-content">{children}</div>
      <section className="info-final stitch-info-final"><div className="container"><div className="stitch-info-final-card"><span className="stitch-bottom-icon"><ScanSearch size={24} aria-hidden="true"/></span><span className="section-kicker">READY WHEN YOU ARE</span><h2>Ready to check your website?</h2><p>Run a focused audit of a public webpage. No account or payment required.</p><Link href="/" className="button button-coral">Audit a page <ArrowRight size={17} aria-hidden="true"/></Link><small>Automated testing is a starting point, not a WCAG compliance certificate.</small></div></div></section>
    </main>
    <SiteFooter />
  </>;
}
