import { cn } from "@/lib/utils";
import { dayNumber, formatDateLong, formatWeekday, isServiceDay } from "@/lib/time";
import { formatARS } from "@/domain/pricing";
import type { Menu } from "@/domain/types";
import type { ReactNode } from "react";

interface MenuCardProps {
  menu: Menu;
  prices: { label: string; price: number }[];
  isToday?: boolean;
  badge?: ReactNode;
  size?: "lg" | "sm";
  testid: string;
}

/** Tarjeta de menú exclusivamente textual (sin fotografías). */
export function MenuCard({ menu, prices, isToday, badge, size = "sm", testid }: MenuCardProps) {
  return (
    <article
      className={cn(
        "group relative flex gap-4 rounded-2xl border bg-card p-4 shadow-soft transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hc-outline",
        isToday && "border-primary/50 ring-1 ring-primary/20",
        size === "lg" && "p-5 sm:p-6",
      )}
      data-testid={testid}
    >
      <div
        className={cn(
          "flex shrink-0 flex-col items-center justify-center rounded-xl text-center",
          size === "lg" ? "h-20 w-16" : "h-16 w-14",
          isToday ? "bg-primary text-primary-foreground" : "bg-brand-soft text-brand-soft-foreground",
        )}
      >
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider">{formatWeekday(menu.date)}</span>
        <span className={cn("font-heading font-bold leading-none", size === "lg" ? "text-3xl" : "text-2xl")}>{dayNumber(menu.date)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground" data-testid={`${testid}-date`}>
            {formatDateLong(menu.date)}
          </p>
          {isToday && <span className="rounded-full bg-success-soft px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-success-soft-foreground">Hoy</span>}
          {!menu.available && (
            <span className="rounded-full bg-danger-soft px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-danger-soft-foreground" data-testid={`${testid}-unavailable`}>
              No disponible
            </span>
          )}
          {badge}
        </div>
        <h3 className={cn("mt-1 font-heading font-semibold leading-snug tracking-tight", size === "lg" ? "text-2xl" : "text-lg")} data-testid={`${testid}-dish`}>
          {menu?.dish}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{menu.description}</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {prices.map((p) => (
            <p key={p.label} className="text-sm">
              <span className="font-mono text-base font-bold text-primary" data-testid={`${testid}-price`}>
                {formatARS(p.price)}
              </span>
              {prices.length > 1 && <span className="ml-1.5 text-xs text-muted-foreground">{p.label}</span>}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

export function NoMenuCard({ date, testid }: { date: string; testid: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed p-4 text-muted-foreground" data-testid={testid}>
      <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-center">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider">{formatWeekday(date)}</span>
        <span className="font-heading text-2xl font-bold leading-none">{dayNumber(date)}</span>
      </div>
      <div>
        <p className="text-xs font-medium">{formatDateLong(date)}</p>
        <p className="font-medium">{isServiceDay(date) ? "Sin menú cargado" : "Sin servicio · fin de semana"}</p>
      </div>
    </div>
  );
}