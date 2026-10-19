import type { ReactNode } from "react";

export const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/pramadion";

/** Small brand-mark link. No external widget script, cookies or payment iframe. */
export function BuyMeACoffeeMark({ size = 19 }: { size?: number }) {
  return <svg aria-hidden="true" focusable="false" className="bmac-mark" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.898 0L5.682 2.799H3.877v2.523h.695L5.277 9.8H4.172l1.46 8.23.938-.01L7.512 24h8.918l.062-.4.88-5.58.888.01 1.46-8.231h-1.056l.705-4.477h.756V2.8h-1.918L16.99 0H6.898zm.528.805h9.043l.771 1.78H6.652l.774-1.78zm-2.75 2.797H19.32v.92H4.676v-.92zm.453 6.998h13.635l-1.176 6.62-5.649-.06-5.636.06-1.174-6.62z"/>
  </svg>;
}

export default function BuyMeACoffeeLink({
  className = "", children = "Buy Me a Coffee", size = 19,
}: { className?: string; children?: ReactNode; size?: number }) {
  return <a className={className} href={BUY_ME_A_COFFEE_URL}
    target="_blank" rel="noopener noreferrer" aria-label="Buy Me a Coffee — optional support (opens in a new tab)">
    <BuyMeACoffeeMark size={size}/><span>{children}</span>
  </a>;
}
