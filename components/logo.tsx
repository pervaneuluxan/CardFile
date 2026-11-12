import { BRAND } from "@/lib/brand";

/**
 * The Cardfile mark: two index cards standing in a card-file box.
 * The front card carries the "Applied" stage rule, as on the board.
 * Colours come from theme tokens, so it works in light and dark mode.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="10" y="2.5" width="17" height="15" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.75" />
      <rect x="5.5" y="6.5" width="17" height="15" rx="2" fill="var(--card)" stroke="var(--ink)" strokeWidth="1.75" />
      <line x1="8.5" y1="11.5" x2="19.5" y2="11.5" stroke="var(--stage-applied)" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M2.5 17h27v8.5a3.5 3.5 0 0 1-3.5 3.5H6a3.5 3.5 0 0 1-3.5-3.5z" fill="var(--ink)" />
      <rect x="12.5" y="21.25" width="7" height="2.75" rx="1.375" fill="var(--paper)" />
    </svg>
  );
}

/** Mark plus wordmark. The wordmark uses the display face at a narrow width. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark />
      <span className="font-heading text-2xl font-extrabold leading-none text-ink">{BRAND.name}</span>
    </span>
  );
}
