import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export function InfoLayout({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return <>
    <SiteHeader />
    <main id="main-content" className="info-main">
      <section className="info-hero"><div className="container info-hero-inner"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div></section>
      <div className="container info-content">{children}</div>
      <section className="info-final"><div className="container info-final-inner"><div><span className="section-kicker">LET'S GET STARTED</span><h2>One page. A clearer picture.</h2><p>No signup, no complicated setup. Just enter a public URL.</p></div><Link href="/" className="button button-coral">Check a page <ArrowRight size={18} aria-hidden="true"/></Link></div></section>
    </main>
    <SiteFooter />
  </>;
}
