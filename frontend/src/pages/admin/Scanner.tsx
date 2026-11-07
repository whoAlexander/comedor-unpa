import { useRef, useState, type FormEvent } from "react";
import { AlertOctagon, CheckCircle2, PackageCheck, ScanLine, SearchX, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatARS } from "@/domain/pricing";
import { ROLE_LABELS } from "@/domain/types";
import { formatDateLong, formatDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { scanCode, useArgentinaNow, useDb, type ScanOutcome, type ScanResult } from "@/store/store";

const OUTCOME_STYLE: Record<ScanOutcome, { cls: string; icon: typeof CheckCircle2; title: string }> = {
  success: { cls: "bg-success text-white dark:text-black", icon: CheckCircle2, title: "ENTREGA REGISTRADA" },
  pending: { cls: "bg-danger text-white dark:text-black", icon: AlertOctagon, title: "PENDIENTE DE PAGO" },
  cancelled: { cls: "bg-danger text-white dark:text-black", icon: AlertOctagon, title: "RESERVA CANCELADA" },
  delivered: { cls: "bg-warning text-white dark:text-black", icon: TriangleAlert, title: "VIANDA YA RETIRADA" },
  wrong_date: { cls: "bg-warning text-white dark:text-black", icon: TriangleAlert, title: "FECHA INCORRECTA" },
  not_found: { cls: "bg-danger-soft text-danger-soft-foreground border-2 border-danger", icon: SearchX, title: "CÓDIGO INEXISTENTE" },
};

export default function Scanner() {
  const db = useDb();
  const today = useArgentinaNow().dateISO;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<(ScanResult & { key: number }) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const todays = db.reservations.filter((r) => r.date === today);
  const deliveredToday = todays.filter((r) => r.status === "entregada").length;
  const paidToday = todays.filter((r) => r.status === "pagada").length;
  const sample = (s: string) => todays.find((r) => r.status === s);
  const paidSample = sample("pagada");
  const demoCodes = [
    paidSample && { label: "Pagada", value: paidSample.code },
    sample("pendiente_pago") && { label: "Pendiente", value: sample("pendiente_pago")!.code },
    sample("entregada") && { label: "Entregada", value: sample("entregada")!.code },
    paidSample && { label: "DNI con reserva", value: db.users.find((u) => u.id === paidSample.userId)!.dni },
    { label: "Inexistente", value: "UACO-0000-0000" },
  ].filter(Boolean) as { label: string; value: string }[];

  const validate = (e?: FormEvent) => {
    e?.preventDefault();
    if (!code.trim()) {
      setError("Ingresá o escaneá un código QR o un DNI.");
      return;
    }
    setError(null);
    const res = scanCode(code);
    setResult({ ...res, key: Date.now() });
    if (res.outcome === "success") toast.success(`Vianda entregada a ${res.user?.name}.`);
    setCode("");
    inputRef.current?.focus();
  };

  const style = result ? OUTCOME_STYLE[result.outcome] : null;

  return (
    <div>
      <PageHeader eyebrow="Mostrador" title="Control de entrega" description="Escaneá el código QR del comensal o ingresá su DNI para registrar la entrega de la vianda." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <Panel className="p-5 sm:p-6" data-testid="scanner-panel">
            <div className="relative mx-auto mb-5 aspect-square w-full max-w-56 overflow-hidden rounded-2xl bg-brand-dark hc-outline" aria-hidden="true">
              <div className="absolute inset-5 rounded-xl border-2 border-dashed border-brand-dark-accent/60" />
              <div className="absolute inset-x-6 h-0.5 bg-brand-dark-accent shadow-[0_0_12px_var(--brand-dark-accent)] animate-scan-line" />
              <ScanLine className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-brand-dark-accent/70" />
            </div>
            <form onSubmit={validate} className="space-y-3" noValidate data-testid="scanner-form">
              <Label htmlFor="scan-code">Código QR o DNI</Label>
              <Input
                id="scan-code"
                ref={inputRef}
                autoFocus
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(null); }}
                placeholder="UACO-XXXX-XXXX o 42123456"
                className="h-12 font-mono text-lg uppercase tracking-wider"
                data-testid="scanner-code-input"
              />
              {error && <p className="text-sm text-destructive" data-testid="scanner-input-error">{error}</p>}
              <Button type="submit" className="h-12 w-full text-base" data-testid="scanner-validate-button">
                <ScanLine className="size-5" /> Validar
              </Button>
            </form>
          </Panel>
          <Panel className="p-5" data-testid="scanner-demo-codes">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Códigos de prueba (prototipo)</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {demoCodes.map((d) => (
                <button key={d.label} type="button" onClick={() => { setCode(d.value); setError(null); }} className="rounded-full border px-3 py-1.5 text-xs transition-colors duration-150 hover:border-primary/60" data-testid={`scanner-demo-code-${d.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <span className="font-semibold">{d.label}:</span> <span className="font-mono">{d.value}</span>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Panel className="p-4" data-testid="scanner-delivered-today"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entregadas hoy</p><p className="mt-1 font-mono text-3xl font-bold" data-testid="scanner-delivered-today-value">{deliveredToday}</p></Panel>
            <Panel className="p-4" data-testid="scanner-pending-today"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por entregar hoy</p><p className="mt-1 font-mono text-3xl font-bold" data-testid="scanner-pending-today-value">{paidToday}</p></Panel>
          </div>

          {result && style ? (
            <div key={result.key} className="space-y-4 animate-pop-in" data-testid="scanner-result" data-outcome={result.outcome}>
              <div className={cn("flex flex-col items-center rounded-3xl px-6 text-center hc-outline", style.cls, result.outcome === "success" ? "py-10" : "py-7")} role="alert" data-testid="scanner-result-banner">
                <style.icon className={result.outcome === "success" ? "size-20" : "size-12"} />
                <p className={cn("mt-3 font-heading font-bold tracking-tight", result.outcome === "success" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl")} data-testid="scanner-result-title">{style.title}</p>
                <p className="mt-2 text-base opacity-95" data-testid="scanner-result-message">{result.message}</p>
              </div>
              {result.reservation && (
                <Panel className="p-5" data-testid="scanner-reservation-info">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reserva encontrada</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div><dt className="text-muted-foreground">Comensal</dt><dd className="font-semibold" data-testid="scanner-info-name">{result.user?.name}</dd></div>
                    <div><dt className="text-muted-foreground">Tipo</dt><dd>{result.user && ROLE_LABELS[result.user.role]}</dd></div>
                    <div><dt className="text-muted-foreground">DNI</dt><dd className="font-mono">{result.user?.dni}</dd></div>
                    <div><dt className="text-muted-foreground">Código</dt><dd className="font-mono">{result.reservation.code}</dd></div>
                    <div><dt className="text-muted-foreground">Fecha</dt><dd>{formatDateLong(result.reservation.date)}</dd></div>
                    <div><dt className="text-muted-foreground">Menú</dt><dd>{result.reservation.menuName}</dd></div>
                    <div><dt className="text-muted-foreground">Importe</dt><dd className="font-mono">{formatARS(result.reservation.price)}</dd></div>
                    <div><dt className="text-muted-foreground">Recipiente</dt><dd>{result.reservation.withContainer ? "Trae recipiente" : "Descartable"}</dd></div>
                    <div className="col-span-2 flex flex-wrap items-center gap-2"><dt className="text-muted-foreground">Estado actual:</dt><dd><StatusBadge reservation={result.reservation} testid="scanner-info-status" /></dd></div>
                    {result.reservation.deliveredAt && (
                      <div className="col-span-2"><dt className="text-muted-foreground">Retirada</dt><dd>{formatDateTime(result.reservation.deliveredAt)} hs</dd></div>
                    )}
                  </dl>
                </Panel>
              )}
            </div>
          ) : (
            <Panel className="flex flex-col items-center justify-center px-6 py-16 text-center" data-testid="scanner-idle">
              <PackageCheck className="size-10 text-primary" />
              <p className="mt-3 font-heading text-lg font-semibold">Esperando lectura</p>
              <p className="mt-1 text-sm text-muted-foreground">El resultado de la validación aparecerá aquí.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}