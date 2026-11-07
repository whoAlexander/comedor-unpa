import { Link } from "react-router-dom";
import { ChefHat, GraduationCap, Package, PackageOpen, Briefcase, Recycle } from "lucide-react";
import { MenuCard, NoMenuCard } from "@/components/MenuCard";
import { EmptyState, Notice, PageHeader, Panel, StatCard } from "@/components/common";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PRICE_TABLE } from "@/domain/pricing";
import { ROLE_LABELS } from "@/domain/types";
import { formatDateLong, isServiceDay } from "@/lib/time";
import { useArgentinaNow, useDb } from "@/store/store";

export default function KitchenDemand() {
  const db = useDb();
  const today = useArgentinaNow().dateISO;
  // Demanda: exclusivamente reservas Pagadas/Confirmadas del día actual.
  const confirmed = db.reservations.filter((r) => r.date === today && r.status === "pagada");
  const userOf = (id: string) => db.users.find((u) => u.id === id)!;
  const students = confirmed.filter((r) => userOf(r.userId).role === "estudiante");
  const staff = confirmed.filter((r) => userOf(r.userId).role === "docente");
  const staffWith = staff.filter((r) => r.withContainer).length;
  const staffWithout = staff.length - staffWith;
  const lowStock = db.stock.filter((s) => s.quantity < s.minimum);
  const todayMenu = db.menus.find((m) => m.date === today);

  return (
    <div>
      <PageHeader eyebrow="Cocina" title="Demanda diaria" description={`${formatDateLong(today)} · calculada sobre reservas Pagadas/Confirmadas.`} />

      {!isServiceDay(today) && (
        <Notice tone="info" title="Hoy no hay servicio de comedor" className="mb-6" testid="demand-no-service-notice">
          Las viandas se preparan de lunes a viernes. Los sábados y domingos no hay demanda.
        </Notice>
      )}

      {lowStock.length > 0 && (
        <Notice tone="warning" title={`${lowStock.length} insumo(s) con stock bajo`} className="mb-6" testid="demand-low-stock-alert">
          {lowStock.map((s) => s.name).join(", ")}.{" "}
          <Link to="/cocina/stock" className="font-semibold underline" data-testid="demand-low-stock-link">Ver stock</Link>
        </Notice>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <section className="relative overflow-hidden rounded-3xl bg-brand-dark p-6 text-brand-dark-foreground animate-fade-up hc-outline" data-testid="demand-total-card">
          <ChefHat className="size-7 text-brand-dark-accent" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark-muted">Total de viandas a preparar</p>
          <p className="mt-1 font-mono text-7xl font-bold tracking-tight" data-testid="demand-total-value">{confirmed.length}</p>
          <p className="mt-2 text-sm text-brand-dark-muted">Se actualiza automáticamente al cambiar el estado de las reservas.</p>
        </section>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Estudiantes" value={students.length} icon={GraduationCap} testid="demand-students" />
          <StatCard label="Docentes/Nodocentes" value={staff.length} icon={Briefcase} testid="demand-staff" />
          <StatCard label="Con recipiente propio" value={staffWith} hint="Docentes/Nodocentes" icon={Recycle} tone="success" testid="demand-with-container" />
          <StatCard label="Sin recipiente" value={staffWithout} hint="Requieren envase descartable" icon={PackageOpen} tone="warning" testid="demand-without-container" />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Menú del día</h2>
          {todayMenu ? <MenuCard menu={todayMenu} prices={PRICE_TABLE.slice(0, 1)} isToday testid="demand-today-menu" /> : <NoMenuCard date={today} testid="demand-today-menu-empty" />}
        </section>
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">Reservas confirmadas ({confirmed.length})</h2>
          {confirmed.length === 0 ? (
            <EmptyState icon={Package} title="No hay reservas confirmadas para hoy" testid="demand-list-empty" />
          ) : (
            <Panel className="overflow-hidden" data-testid="demand-list">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Comensal</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Recipiente</TableHead>
                    <TableHead className="hidden sm:table-cell">Código</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmed.map((r) => {
                    const u = userOf(r.userId);
                    return (
                      <TableRow key={r.id} data-testid={`demand-row-${r.id}`}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ROLE_LABELS[u.role]}</TableCell>
                        <TableCell className="text-sm">{r.withContainer ? "Propio" : "Descartable"}</TableCell>
                        <TableCell className="hidden font-mono text-xs sm:table-cell">{r.code}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Panel>
          )}
        </section>
      </div>
    </div>
  );
}
