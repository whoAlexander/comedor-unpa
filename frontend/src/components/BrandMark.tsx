import { cn } from "@/lib/utils";

/** Emblema tipográfico del Comedor Universitario UNPA-UACO (sin imágenes). */
export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)} data-testid="brand-mark">
      <svg viewBox="0 0 40 40" className="size-9 shrink-0" aria-hidden="true">
        <rect x="1" y="1" width="38" height="38" rx="10" fill="currentColor" opacity="0.12" />
        <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M8 27 L15 16 L20 22 L25 13 L32 27 Z" fill="var(--brand-dark-accent)" />
        <path d="M8 30.5 H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="leading-tight">
        <p className="font-heading text-[0.95rem] font-semibold tracking-tight">Comedor Universitario</p>
        {!compact && <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] opacity-75">UNPA · UACO</p>}
      </div>
    </div>
  );
}
