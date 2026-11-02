import Link from "next/link";
import Logo from "@/components/Logo";
import BuyMeACoffeeLink from "@/components/BuyMeACoffeeLink";

export default function SiteFooter() {
  return <footer className="stitch-site-footer screen-only">
    <div className="container stitch-footer-main">
      <div className="stitch-footer-identity"><Link href="/" aria-label="A11Ylens home"><Logo /></Link><p>Understand what works. Fix what doesn't.</p><span>Independent accessibility insights, one page at a time.</span></div>
      <nav aria-label="Product links"><strong>PRODUCT</strong><Link href="/">Audit a page</Link><Link href="/how-it-works">How it works</Link><Link href="/faq">FAQ</Link></nav>
      <nav aria-label="Information links"><strong>RESOURCES</strong><Link href="/methodology">Methodology</Link><Link href="/privacy">Privacy</Link><Link href="/about">About</Link></nav>
      <nav aria-label="Project links"><strong>PROJECT</strong><a href="https://github.com/dionpram/A11Ylens" target="_blank" rel="noopener noreferrer">GitHub source</a><BuyMeACoffeeLink className="stitch-footer-support">Optional support</BuyMeACoffeeLink></nav>
    </div>
    <div className="container stitch-footer-bottom"><span>© {new Date().getFullYear()} A11Ylens · Independent project</span><span>Automated findings are not a WCAG compliance certificate.</span></div>
  </footer>;
}
