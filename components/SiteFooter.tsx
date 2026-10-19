import Link from "next/link";
import Logo from "@/components/Logo";
import BuyMeACoffeeLink from "@/components/BuyMeACoffeeLink";

export default function SiteFooter() {
  return <footer className="footer site-footer screen-only">
    <div className="container footer-expanded">
      <div className="footer-brand"><Link href="/" aria-label="Access Lens home"><Logo /></Link><p>A little more accessible, every day.</p><span>One page at a time. Free, without an account.</span></div>
      <nav aria-label="Explore"><strong>Explore</strong><Link href="/">Check a page</Link><Link href="/how-it-works">How it works</Link><Link href="/faq">Frequently asked questions</Link></nav>
      <nav aria-label="Learn"><strong>Learn</strong><Link href="/methodology">Our methodology</Link><Link href="/about">About the project</Link><Link href="/privacy">Privacy &amp; data</Link><BuyMeACoffeeLink className="footer-coffee">Buy Me a Coffee</BuyMeACoffeeLink></nav>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} Access Lens · Independent project</span><span>Automated checks are not a certificate of WCAG conformance.</span></div>
  </footer>;
}
