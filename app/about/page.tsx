import type { Metadata } from "next";
import { Coffee, HeartHandshake, Layers3, ShieldCheck } from "lucide-react";
import { InfoLayout } from "@/components/InfoLayout";

export const metadata: Metadata = {
  title: "About | Access Lens",
  description: "Why Access Lens exists and why accessibility reports, suggestions and PDF downloads are free.",
};

export default function About() {
  return <InfoLayout eyebrow="ABOUT THE PROJECT" title="A more welcoming web, one page at a time." intro="Access Lens is an independent accessibility-checking project built around one simple idea: useful information should come before a payment request.">
    <section className="info-section"><div className="about-statement"><span className="section-kicker">OUR APPROACH</span><h2>Find the barriers. Celebrate what's working. Make the next step clearer.</h2><p>Accessibility reports can be intimidating, especially when they're full of technical failures and little practical guidance. Access Lens brings the important information into focus: what was checked, what failed, what passed, and what still needs human attention.</p></div></section>
    <section className="info-section info-section-divider"><div className="info-split-heading"><h2>Built around trust.</h2><p>Small choices make the experience more transparent and respectful.</p></div><div className="values-cards"><article><div className="values-card-icon"><HeartHandshake size={23}/></div><h3>Useful before asking</h3><p>See results, suggestions and the full printable report without paying. If we earn your support, contributions help the project continue.</p></article><article><div className="values-card-icon"><ShieldCheck size={23}/></div><h3>Honest about limits</h3><p>An automated scan is not a legal certificate. We distinguish measured findings from things that still require human judgment.</p></article><article><div className="values-card-icon"><Layers3 size={23}/></div><h3>Designed for real work</h3><p>Practical language and visual examples help designers, developers and website owners turn a report into action.</p></article></div></section>
    <section className="info-section"><div className="info-feature-panel support-story"><div className="values-card-icon"><Coffee size={23}/></div><div><span className="section-kicker">COMMUNITY SUPPORTED</span><h2>Free means free.</h2><p>We don't lock scans, recommendations or PDF downloads behind a contribution screen. An optional support invitation appears inside the report after you've had a chance to see its value.</p><p>There are no subscription tiers in this first version.</p></div></div></section>
  </InfoLayout>;
}
