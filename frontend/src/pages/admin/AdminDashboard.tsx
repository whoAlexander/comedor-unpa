import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Ban, Clock3, FileBarChart, PackageCheck, QrCode, ReceiptText, UtensilsCrossed } from "lucide-react";
import { MenuCard, NoMenuCard } from "@/components/MenuCard";
import { PageHeader, Panel, PaymentBadge, StatCard } from "@/components/common";
import { buttonVariants } from "@/components/ui/button";
import { PRICE_TABLE, formatARS } from "@/domain/pricing";
import { ROLE_LABELS } from "@/domain/types";
import { formatDateLong, formatDateShort } from "@/lib/time";
import { useArgentinaNow, useDb } from "@/store/store";

export default function AdminDashboard() {
  const db = useDb();
  const today = useArgentinaNow().dateISO;
  const rs = db.reservations;
  const pending = rs.filter((r) => r.status === "pendiente_pago");
  const approved = rs.filter((r) => r.payment.status === "aprobado");
  const cancelled = rs.filter((r) => r.status === "cancelada");
  const toDeliver = rs.filter((r) => r.status === "pagada");
  const toDeliverToday = toDeliver.filter((r) => r.date === today);
  const inReview = pending.filter((r) => r.payment.status === "en_revision");
  const todayMenu = db.menus.find((m) => m.date === today);
  const userOf = (id: string) => db.users.find((u) => u?.id === id)!;

  return (
    <div>
      <PageHeader
        eyebrow="Mostrador y Caja"
        title="Panel administrativo"
        description={`Resumen general al ${formatDateLong(today)}.`}
        actions={
          <Link to="/admin/reporte" className={buttonVariants({ className: "h-11" })} data-testid="admin-generate-report-button">
            <FileBarChart className="size-4" /> Generar reporte
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pendientes de pago" value={pending.length} hint={`${inReview.length} comprobante(s) por revisar`} icon={Clock3} tone="warning" testid="kpi-pending-payment" />
        <StatCard label="Pagos aprobados" value={approved.length} hint="Incluye viandas ya entregadas" icon={BadgeCheck} tone="success" testid="kpi-approved-payments" />
        <StatCard label="Reservas canceladas" value={cancelled.length} icon={Ban} tone="danger" testid="kpi-cancelled" />
        <StatCard label="Pendientes de entrega" value={toDeliver.length} hint={`${toDeliverToday.length} para hoy`} icon={PackageCheck} tone="info" testid="kpi-pending-delivery" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel className="p-5" data-testid="admin-review-queue">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-semibold">Comprobantes por revisar</h2>
            <Link to="/admin/pagos" className="inline-flex items-center gap-1 text-sm font-semibold text-primary" data-testid="admin-review-queue-link">
              Ir a Pagos <ArrowRight className="size-4" />
            </Link>
          </div>
          {inReview.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground" data-testid="admin-review-queue-empty">No hay comprobantes pendientes de revisión.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {inReview.map((r) => {
                const u = userOf(r.userId);
                return (
                  <li key={r?.id} className="flex flex-wrap items-center justify-between gap-2 py-3" data-testid={`admin-review-item-${r?.id}`}>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{ROLE_LABELS[u.role]} · {formatDateShort(r.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold">{formatARS(r.price)}</span>
                      <PaymentBadge reservation={r} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Menú de hoy</h2>
          {todayMenu ? <MenuCard menu={todayMenu} prices={PRICE_TABLE} isToday testid="admin-today-menu" /> : <NoMenuCard date={today} testid="admin-today-menu-empty" />}
          <div className="grid grid-cols-3 gap-2">
            <Link to="/admin/pagos" className={buttonVariants({ variant: "outline" })} data-testid="admin-quick-payments"><ReceiptText className="size-4" />Pagos</Link>
            <Link to="/admin/escaner" className={buttonVariants()} data-testid="admin-quick-scanner"><QrCode className="size-4" />Escáner</Link>
            <Link to="/admin/menus" className={buttonVariants({ variant: "outline" })} data-testid="admin-quick-menus"><UtensilsCrossed className="size-4" />Menús</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
