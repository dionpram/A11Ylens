import type { Metadata } from "next";
import Link from "next/link";
import { InfoLayout } from "@/components/InfoLayout";

export const metadata: Metadata = {
  title: "Frequently asked questions | Access Lens",
  description: "Answers about single-page accessibility scans, automated scoring, visual fixes, PDF reports and optional contributions.",
};

const groups = [
  { title: "Checking a webpage", questions: [
    { q: "Is Access Lens free?", a: "Yes. One-page checks, results, supported recommendations and browser-based PDF exports are free. Contributions are entirely voluntary." },
    { q: "Do I need to install anything on my website?", a: "No. For public pages, the scanner visits the URL in an automated browser. There's no code snippet, website plugin or account setup required." },
    { q: "Will it scan my whole website?", a: "Not in the first version. Each scan checks one public URL and one rendered state. You can scan another page separately whenever you like." },
    { q: "Can it scan password-protected or staging pages?", a: "Not in the current version. The scanner only supports publicly accessible HTTP(S) pages and may be blocked by some sites." },
  ]},
  { title: "Understanding your report", questions: [
    { q: "Does a score of 100 mean my website is fully accessible?", a: "No. The score is the pass rate for applicable, conclusive automated axe rules. Many WCAG requirements, complete workflows and assistive-technology experiences still require human review." },
    { q: "Why do you show passed checks?", a: "Because a useful report should show what was tested successfully, not only failures. Passed automated rules should still not be interpreted as proof of full WCAG conformance." },
    { q: "Are the suggested fixes applied to my website?", a: "No. Supported previews use a temporary copy of the page inside the scanning browser. We do not change the live site. Always check fixes with your own design and development process." },
    { q: "Can I download the report as a PDF?", a: "Yes. Use Save as PDF on the results screen. Your browser's print dialog generates the PDF from a report layout without requiring a contribution." },
  ]},
  { title: "Trust & support", questions: [
    { q: "Can I use the report as legal proof?", a: "It can document particular automated observations at a particular time, but it's not a legal certificate or a substitute for an expert manual evaluation." },
    { q: "Why are you asking for contributions?", a: "Maintaining a scanning service requires development, browsers and hosting. Optional support lets people help the project after they've seen the value. Skipping does not remove functionality." },
  ]},
];

export default function FAQ() {
  return <InfoLayout eyebrow="GOOD TO KNOW" title="Questions are welcome." intro="A few straightforward answers about what Access Lens does, what it doesn't, and why we keep the experience free.">
    <div className="faq-layout"><aside><span className="section-kicker">QUICK ANSWERS</span><h2>No fine print hiding the important stuff.</h2><p>Accessibility takes care and context. We're upfront about what an automated scan can tell you.</p><Link href="/methodology" className="info-text-link">Read our methodology →</Link></aside><div className="faq-groups">{groups.map(group => <section className="faq-group" key={group.title}><h2>{group.title}</h2>{group.questions.map(item => <details className="faq-item" key={item.q}><summary>{item.q}<span aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</section>)}</div></div>
  </InfoLayout>;
}
