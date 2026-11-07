import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeDollarSign, Ban, CalendarRange, Download, HandCoins, PackageCheck, Printer, Receipt, Users } from "lucide-react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, Notice, PageHeader, Panel, StatCard } from "@/components/common";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatARS } from "@/domain/pricing";
import { buildReport } from "@/domain/report";
import { STATUS_LABELS } from "@/domain/reservationState";
import { ROLE_LABELS } from "@/domain/types";
import { addDays, formatDateLong, formatDateShort, startOfWeek } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useArgentinaNow, useCurrentUser, useDb } from "@/store/store";

type Preset = "todo" | "semana" | "mes" | "hoy";

const PAYMENT_TEXT = { sin_comprobante: "Sin comprobante", en_revision: "En revisión", rechazado: "Rechazado", aprobado: "Aprobado" } as const;

function Bars({ items, testid }: { items: { label: string; count: number }[]; testid: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <ul className="space-y-3" data-testid={testid}>
      {items.map((i) => (
        <li key={i.label}>
          <div className="flex justify-between text-sm"><span>{i.label}</span><span className="font-mono font-semibold">{i.count}</span></div>
          <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(i.count / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminReport() {
  const db = useDb();
  const admin = useCurrentUser()!;
  const today = useArgentinaNow().dateISO;
  const allDates = db.reservations.map((r) => r.date).sort();
  const minDate = allDates[0] ?? today;
  const maxDate = allDates[allDates.length - 1] ?? today;

  const presetRange = (p: Preset): [string, string] => {
    if (p === "hoy") return [today, today];
    if (p === "semana") return [startOfWeek(today), addDays(startOfWeek(today), 6)];
    if (p === "mes") {
      const first = `${today.slice(0, 7)}-01`;
      const nextMonth = addDays(`${today.slice(0, 7)}-28`, 4).slice(0, 7);
      return [first, addDays(`${nextMonth}-01`, -1)];
    }
    return [minDate, maxDate];
  };

  const [preset, setPreset] = useState<Preset | null>("todo");
  const [[from, to], setRange] = useState<[string, string]>(() => presetRange("todo"));
  const [generatedAt, setGeneratedAt] = useState(() => new Date());
  const rangeError = from && to && from > to ? "La fecha “Desde” no puede ser posterior a “Hasta”." : !from || !to ? "Completá ambas fechas." : null;

  const report = useMemo(
    () => buildReport({ users: db.users, menus: db.menus, reservations: db.reservations, stock: db.stock, from, to }),
    [db, from, to],
  );
  const t = report.totals;
  const userOf = (id: string) => db.users.find((u) => u.id === id);

  const choosePreset = (p: Preset) => {
    setPreset(p);
    setRange(presetRange(p));
    setGeneratedAt(new Date());
  };

  const downloadCsv = () => {
    const header = ["Fecha", "Comensal", "DNI", "Tipo", "Recipiente", "Menú", "Importe", "Estado", "Estado del pago", "Código"];
    const lines = report.rows.map((r) => {
      const u = userOf(r.userId);
      return [r.date, u?.name ?? "", u?.dni ?? "", u ? ROLE_LABELS[u.role] : "", r.withContainer ? "Propio" : "Descartable", r.menuName, String(r.price), STATUS_LABELS[r.status], PAYMENT_TEXT[r.payment.status], r.code];
    });
    const csv = [header, ...lines].map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-comedor-uaco_${from}_a_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Reporte CSV descargado.");
  };

  const chartData = report.byDay.map((d) => ({ dia: formatDateShort(d.date), Cobrado: d.collected, "Por cobrar": d.pending }));
  const PRESETS: { value: Preset; label: string }[] = [
    { value: "todo", label: "Todo el período" },
    { value: "mes", label: "Este mes" },
    { value: "semana", label: "Esta semana" },
    { value: "hoy", label: "Hoy" },
  ];

  return (
    <div data-testid="admin-report-page">
      <div className="print:hidden">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-primary" data-testid="admin-report-back-link"><ArrowLeft className="size-4" /> Volver al panel</Link>
      </div>
      <PageHeader
        eyebrow="Reportes"
        title="Ingresos y estadísticas"
        description={`Período: ${formatDateLong(from)} al ${formatDateLong(to)}. Generado el ${generatedAt.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", hour12: false, dateStyle: "short", timeStyle: "short" })} hs por ${admin.name}.`}
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" className="h-11" onClick={downloadCsv} disabled={Boolean(rangeError) || report.rows.length === 0} data-testid="admin-report-csv-button"><Download className="size-4" /> Descargar CSV</Button>
            <Button className="h-11" onClick={() => window.print()} disabled={Boolean(rangeError)} data-testid="admin-report-print-button"><Printer className="size-4" /> Imprimir / PDF</Button>
          </div>
        }
      />

      <Panel className="mb-6 p-4 print:hidden" data-testid="admin-report-filters">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.value} type="button" onClick={() => choosePreset(p.value)} data-testid={`admin-report-preset-${p.value}`}
                className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-150", preset === p.value ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50")}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3 lg:ml-auto">
            <div className="space-y-1"><Label htmlFor="rep-from"><CalendarRange className="size-3.5" /> Desde</Label><Input id="rep-from" type="date" value={from} onChange={(e) => { setPreset(null); setRange([e.target.value, to]); }} data-testid="admin-report-from-input" /></div>
            <div className="space-y-1"><Label htmlFor="rep-to">Hasta</Label><Input id="rep-to" type="date" value={to} onChange={(e) => { setPreset(null); setRange([from, e.target.value]); }} data-testid="admin-report-to-input" /></div>
          </div>
        </div>
        {rangeError && <Notice tone="danger" className="mt-3" testid="admin-report-range-error">{rangeError}</Notice>}
      </Panel>

      {rangeError ? null : t.reservations === 0 ? (
        <EmptyState icon={Receipt} title="No hay reservas en el período seleccionado" testid="admin-report-empty">Probá con otro rango de fechas.</EmptyState>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Ingresos cobrados" value={formatARS(t.collected)} hint="Pagos aprobados (pagadas + entregadas)" icon={BadgeDollarSign} tone="success" testid="report-kpi-collected" />
            <StatCard label="Por cobrar" value={formatARS(t.pendingAmount)} hint="Reservas pendientes de pago" icon={HandCoins} tone="warning" testid="report-kpi-pending" />
            <StatCard label="Ticket promedio" value={formatARS(t.averageTicket)} hint={`${t.uniqueDiners} comensal(es) distintos`} icon={Users} testid="report-kpi-average" />
            <StatCard label="Monto cancelado" value={formatARS(t.cancelledAmount)} hint={`Tasa de cancelación ${t.cancellationRate}%`} icon={Ban} tone="danger" testid="report-kpi-cancelled" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Reservas totales" value={t.reservations} hint={`${t.active} activas o finalizadas`} icon={Receipt} testid="report-kpi-reservations" />
            <StatCard label="Viandas entregadas" value={t.deliveredCount} hint={`Tasa de retiro ${t.pickupRate}% de las pagadas`} icon={PackageCheck} tone="success" testid="report-kpi-delivered" />
            {report.roleCounts.map((rc, i) => (
              <StatCard key={rc.label} label={rc.label} value={rc.count} hint="Reservas no canceladas" icon={Users} testid={`report-kpi-role-${i}`} />
            ))}
          </div>

          <Panel className="p-5 break-inside-avoid" data-testid="report-daily-chart">
            <h2 className="font-heading text-lg font-semibold">Ingresos por día</h2>
            <div className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="dia" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`} width={56} />
                  <Tooltip formatter={(v: number) => formatARS(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" }} cursor={{ fill: "var(--muted)" }} />
                  <Legend />
                  <Bar dataKey="Cobrado" stackId="a" fill="var(--success)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Por cobrar" stackId="a" fill="var(--warning)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel className="overflow-hidden break-inside-avoid" data-testid="report-by-profile">
              <h2 className="px-5 pt-5 font-heading text-lg font-semibold">Ingresos por perfil</h2>
              <Table className="mt-3">
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Perfil</TableHead><TableHead className="text-right">Precio</TableHead><TableHead className="text-right">Reservas</TableHead><TableHead className="text-right">Cobrado</TableHead><TableHead className="text-right">Por cobrar</TableHead></TableRow></TableHeader>
                <TableBody>
                  {report.byProfile.map((p, i) => (
                    <TableRow key={p.label} data-testid={`report-profile-row-${i}`}>
                      <TableCell className="font-medium">{p.label}</TableCell>
                      <TableCell className="text-right font-mono">{formatARS(p.unitPrice)}</TableCell>
                      <TableCell className="text-right font-mono">{p.reservations}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatARS(p.collected)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatARS(p.pending)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow><TableCell className="font-semibold">Total</TableCell><TableCell /><TableCell className="text-right font-mono font-semibold">{t.active}</TableCell><TableCell className="text-right font-mono font-bold" data-testid="report-profile-total-collected">{formatARS(t.collected)}</TableCell><TableCell className="text-right font-mono font-semibold">{formatARS(t.pendingAmount)}</TableCell></TableRow>
                </TableFooter>
              </Table>
            </Panel>

            <Panel className="overflow-hidden break-inside-avoid" data-testid="report-by-day">
              <h2 className="px-5 pt-5 font-heading text-lg font-semibold">Detalle diario</h2>
              <Table className="mt-3">
                <TableHeader><TableRow className="bg-muted/50"><TableHead>Fecha</TableHead><TableHead className="text-right">Reservas</TableHead><TableHead className="text-right">Entregadas</TableHead><TableHead className="text-right">Cobrado</TableHead><TableHead className="text-right">Por cobrar</TableHead></TableRow></TableHeader>
                <TableBody>
                  {report.byDay.map((d) => (
                    <TableRow key={d.date} data-testid={`report-day-row-${d.date}`}>
                      <TableCell className="whitespace-nowrap">{formatDateShort(d.date)}</TableCell>
                      <TableCell className="text-right font-mono">{d.reservations}</TableCell>
                      <TableCell className="text-right font-mono">{d.delivered}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatARS(d.collected)}</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{formatARS(d.pending)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Panel className="p-5 break-inside-avoid"><h2 className="mb-4 font-heading text-lg font-semibold">Reservas por estado</h2><Bars items={report.byStatus} testid="report-by-status" /></Panel>
            <Panel className="p-5 break-inside-avoid"><h2 className="mb-4 font-heading text-lg font-semibold">Estado de los pagos</h2><Bars items={report.byPayment} testid="report-by-payment" /></Panel>
            <Panel className="p-5 break-inside-avoid" data-testid="report-top-menus">
              <h2 className="mb-4 font-heading text-lg font-semibold">Menús más reservados</h2>
              <ol className="space-y-2.5">
                {report.topMenus.map((m, i) => (
                  <li key={`${m.dish}-${m.date}`} className="flex items-start gap-3 text-sm">
                    <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono text-xs font-bold text-brand-soft-foreground">{i + 1}</span>
                    <span className="flex-1"><span className="block font-medium">{m.dish}</span><span className="text-xs text-muted-foreground">{formatDateShort(m.date)}</span></span>
                    <span className="font-mono font-semibold">{m.count}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">Viandas sin recipiente (descartables): <span className="font-mono font-semibold">{t.containerlessCount}</span></p>
            </Panel>
          </div>

          {report.lowStock.length > 0 && (
            <Notice tone="warning" title="Insumos con stock bajo (al momento del reporte)" testid="report-low-stock">
              {report.lowStock.map((s) => `${s.name}: ${s.quantity} de ${s.minimum} ${s.unit}`).join(" · ")}
            </Notice>
          )}
        </div>
      )}

      <div className="mt-6 print:hidden">
        <Link to="/admin" className={buttonVariants({ variant: "outline" })} data-testid="admin-report-back-bottom-link"><ArrowLeft className="size-4" /> Volver al panel</Link>
      </div>
    </div>
  );
}
