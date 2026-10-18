export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <svg className="brand-symbol" width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="13" fill="#EB7865" />
        <circle cx="18" cy="18" r="8.1" stroke="white" strokeWidth="2.7" />
        <path d="M18 6.8V10.1M18 25.9V29.2M6.8 18H10.1M25.9 18H29.2" stroke="white" strokeWidth="2.7" strokeLinecap="round" />
        <circle cx="18" cy="18" r="2" fill="white" />
      </svg>
      {!compact && <span>access<span className="brand-emphasis">lens</span><span className="brand-dot">.</span></span>}
    </span>
  );
}
