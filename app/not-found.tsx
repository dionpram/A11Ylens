import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return <><SiteHeader/><main id="main-content" className="not-found-shell"><div className="not-found-icon"><SearchX size={30} aria-hidden="true"/></div><span className="section-kicker">PAGE NOT FOUND · 404</span><h1>Looks like this page wandered off.</h1><p>Let's get you back to the accessibility checker.</p><Link href="/" className="button button-coral"><ArrowLeft size={18} aria-hidden="true"/> Back to home</Link></main><SiteFooter/></>;
}
