/** Small inline line icons, hand-drawn for this site's tone -- no icon
 * library dependency needed for a handful of simple shapes. */

type IconProps = { className?: string };

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6l7-3Z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LeafIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 19c8 1 13-4 14-14-10 1-15 6-14 14Z" strokeLinejoin="round" />
      <path d="M6 18c3-4 6-7 12-11" strokeLinecap="round" />
    </svg>
  );
}

export function RibbonIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="8" r="5" />
      <path d="M8.5 12.5L6 21l6-3 6 3-2.5-8.5" strokeLinejoin="round" />
    </svg>
  );
}
