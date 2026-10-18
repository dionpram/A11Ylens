"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import Logo from "@/components/Logo";

const links = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export default function SiteHeader({ onHome }: { onHome?: () => void }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onHomeClick = (event: MouseEvent<HTMLAnchorElement>) => {
    setOpen(false);
    if (pathname === "/" && onHome) {
      event.preventDefault();
      onHome();
    }
  };

  return <>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="header screen-only">
      <div className="container nav-inner">
        <Link className="logo-link" href="/" aria-label="Access Lens home" onClick={onHomeClick}><Logo /></Link>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <div className="nav-right header-actions">
          <span className="nav-free"><span /> Free, always</span>
          {pathname !== "/" && <Link href="/" className="header-scan-link">Check a page <ArrowRight size={15} aria-hidden="true" /></Link>}
          <button type="button" className="mobile-menu-button" aria-label={open ? "Close navigation" : "Open navigation"} aria-controls="mobile-navigation" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X size={23}/> : <Menu size={23}/>}</button>
        </div>
      </div>
      <nav id="mobile-navigation" className={`mobile-navigation ${open ? "mobile-navigation-open" : ""}`} aria-label="Mobile navigation" hidden={!open}>
        {links.map(link => <Link key={link.href} onClick={() => setOpen(false)} href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link>)}
        <Link href="/" onClick={onHomeClick}>Check a page <ArrowRight size={17} aria-hidden="true" /></Link>
      </nav>
    </header>
  </>;
}
