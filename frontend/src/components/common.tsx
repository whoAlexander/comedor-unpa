import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Reservation } from "@/domain/types";
import { STATUS_LABELS } from "@/domain/reservationState";

export function Panel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border bg-card text-card-foreground shadow-soft hc-outline", className)} {...rest}>
      {children}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 animate-fade-up sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight sm:text-4xl" data-testid="page-title">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  success: { cls: "bg-success-soft text-success-soft-foreground border-success/30", icon: CheckCircle2 },
  warning: { cls: "bg-warning-soft text-warning-soft-foreground border-warning/30", icon: AlertTriangle },
  danger: { cls: "bg-danger-soft text-danger-soft-foreground border-danger/30", icon: XCircle },
  info: { cls: "bg-brand-soft text-brand-soft-foreground border-primary/20", icon: Info },
} as const;

export type Tone = keyof typeof TONES;

export function Notice({ tone, title, children, className, testid }: { tone: Tone; title?: string; children?: ReactNode; className?: string; testid?: string }) {
  const { cls, icon: Icon } = TONES[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 hc-outline", cls, className)} data-testid={testid}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div className="text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "opacity-90")}>{children}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = "info", testid }: { label: string; value: number | string; hint?: string; icon: typeof Info; tone?: Tone; testid: string }) {
  const iconCls = {
    success: "bg-success-soft text-success-soft-foreground",
    warning: "bg-warning-soft text-warning-soft-foreground",
    danger: "bg-danger-soft text-danger-soft-foreground",
    info: "bg-brand-soft text-brand-soft-foreground",
  }[tone];
  return (
    <Panel className="p-5 transition-transform duration-200 hover:-translate-y-0.5" data-testid={testid}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span className={cn("inline-flex size-9 items-center justify-center rounded-xl", iconCls)}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 font-mono text-4xl font-bold tracking-tight" data-testid={`${testid}-value`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Panel>
  );
}

const PAYMENT_LABELS = {
  sin_comprobante: { label: "Sin comprobante", cls: "bg-warning-soft text-warning-soft-foreground" },
  en_revision: { label: "Comprobante en revisión", cls: "bg-review-soft text-review-soft-foreground" },
  rechazado: { label: "Pago rechazado", cls: "bg-danger-soft text-danger-soft-foreground" },
  aprobado: { label: "Pago aprobado", cls: "bg-success-soft text-success-soft-foreground" },
} as const;

const STATUS_CLS: Record<Reservation["status"], string> = {
  pendiente_pago: "bg-warning-soft text-warning-soft-foreground",
  pagada: "bg-success-soft text-success-soft-foreground",
  entregada: "bg-neutral-soft text-neutral-soft-foreground",
  cancelada: "bg-danger-soft text-danger-soft-foreground",
};

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

export function StatusBadge({ reservation, testid }: { reservation: Reservation; testid?: string }) {
  return (
    <span data-slot="badge" className={cn(pill, STATUS_CLS[reservation.status])} data-testid={testid}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[reservation.status]}
    </span>
  );
}

export function PaymentBadge({ reservation, testid }: { reservation: Reservation; testid?: string }) {
  const p = PAYMENT_LABELS[reservation.payment.status];
  return (
    <span data-slot="badge" className={cn(pill, p.cls)} data-testid={testid}>
      {p.label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, testid }: { icon: typeof Info; title: string; children?: ReactNode; testid: string }) {
  return (
    <Panel className="flex flex-col items-center px-6 py-12 text-center" data-testid={testid}>
      <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-foreground">
        <Icon className="size-6" />
      </span>
      <p className="mt-4 font-heading text-lg font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    </Panel>
  );
}