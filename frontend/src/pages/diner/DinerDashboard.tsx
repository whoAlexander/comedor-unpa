import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Clock, QrCode, ReceiptText, Ticket, UtensilsCrossed } from "lucide-react";
import { MenuCard, NoMenuCard } from "@/components/MenuCard";
import { Notice, Panel, StatusBadge } from "@/components/common";
import { buttonVariants } from "@/components/ui/button";
import { dinerPrices, formatARS } from "@/domain/pricing";
import { ROLE_LABELS } from "@/domain/types";
import { formatDateLong, nextServiceDays } from "@/lib/time";
import { cn } from "@/lib/utils";
import { checkEligibility, useArgentinaNow, useCurrentUser, useDb } from "@/store/store";

export default function DinerDashboard() {
  const db = useDb();
  const user = useCurrentUser()!;
  const now = useArgentinaNow();
  const today = now.dateISO;
  const prices = dinerPrices(user.role);
  const eligibility = checkEligibility(db, user, now);

  const todayMenu = db.menus.find((m) => m.date === today);
  const upcoming = useMemo(() => nextServiceDays(today, 5), [today]);
  const mine = db.reservations.filter((r) => r.userId === user.id);
  const todayReservation = mine.find((r) => r.date === today && r.status !== "cancelada");
  const pendingPayments = mine.filter((r) => r.status === "pendiente_pago");
  const rejected = pendingPayments.filter((r) => r.payment.status === "rechazado");
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-brand-dark p-6 text-brand-dark-foreground animate-fade-up sm:p-8 hc-outline" data-testid="diner-greeting">
        <svg className="pointer-events-none absolute -right-10 bottom-0 h-40 w-96 opacity-20" viewBox="0 0 400 160" aria-hidden="true">
          <path d="M0 160 L90 60 L150 110 L230 20 L320 100 L400 50 L400 160 Z" fill="var(--brand-dark-accent)" />
        </svg>
        <p className="text-sm text-brand-dark-muted" data-testid="diner-today-date">
          {formatDateLong(today)} · <Clock className="inline size-3.5" /> {now.timeLabel} hs{now.simulated && " (simulada)"}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl" data-testid="diner-greeting-title">
          ¡Hola, {firstName}!
        </h1>
        <p className="mt-1 text-brand-dark-muted">{ROLE_LABELS[user.role]}</p>
        <div className="relative mt-6 flex flex-wrap gap-3" data-testid="diner-profile-prices">
          {prices.map((p) => (
            <div key={p.label} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm hc-outline">
              <p className="font-mono text-2xl font-bold">{formatARS(p.price)}</p>
              <p className="text-xs text-brand-dark-muted">Tu precio · {p.label}</p>
            </div>
          ))}
        </div>
      </section>

      {rejected.length > 0 && (
        <Notice tone="danger" title="Tenés un pago rechazado" testid="diner-rejected-payment-alert">
          {rejected[0].payment.rejectionReason}{" "}
          <Link to="/pagos" className="font-semibold underline" data-testid="diner-rejected-payment-link">
            Gestionar el pago
          </Link>
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3 animate-fade-up [animation-delay:60ms]">
          <h2 className="font-heading text-xl font-semibold">Menú de hoy</h2>
          {todayMenu ? (
            <MenuCard menu={todayMenu} prices={prices} isToday size="lg" testid="today-menu-card" />
          ) : (
            <NoMenuCard date={today} testid="today-menu-empty" />
          )}
          {todayReservation && (
            <Panel className="flex flex-wrap items-center justify-between gap-3 p-4" data-testid="today-reservation-card">
              <div className="flex items-center gap-3">
                <Ticket className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Tu reserva de hoy</p>
                  <StatusBadge reservation={todayReservation} testid="today-reservation-status" />
                </div>
              </div>
              {todayReservation.status === "pagada" && (
                <Link to="/mis-reservas" className={buttonVariants({ size: "sm" })} data-testid="today-reservation-qr-link">
                  <QrCode className="size-4" /> Ver mi código QR
                </Link>
              )}
            </Panel>
          )}
        </section>

        <section className="space-y-3 animate-fade-up [animation-delay:120ms]">
          <h2 className="font-heading text-xl font-semibold">Próxima reserva</h2>
          <Panel className="p-5" data-testid="reservation-availability-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{formatDateLong(eligibility.targetDate)}</p>
            {eligibility.allowed ? (
              <>
                <p className="mt-2 font-heading text-lg font-semibold text-success" data-testid="reservation-availability-status">
                  Reservas abiertas hasta las 14:00 hs
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Menú: {eligibility.menu?.dish}</p>
              </>
            ) : (
              <p className="mt-2 text-sm font-medium text-warning-soft-foreground dark:text-warning" data-testid="reservation-availability-status">
                {eligibility.reason}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/reservar" className={cn(buttonVariants(), "h-11")} data-testid="dashboard-reserve-link">
                <UtensilsCrossed className="size-4" /> {eligibility.allowed ? "Reservar vianda" : "Ver detalle"}
              </Link>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Link to="/mis-reservas" className="group rounded-2xl border bg-card p-4 shadow-soft transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hc-outline" data-testid="quick-my-reservations-link">
              <Ticket className="size-5 text-primary" />
              <p className="mt-2 font-semibold">Mis reservas</p>
              <p className="text-xs text-muted-foreground">{mine.length} en total</p>
            </Link>
            <Link to="/pagos" className="group rounded-2xl border bg-card p-4 shadow-soft transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hc-outline" data-testid="quick-payments-link">
              <ReceiptText className="size-5 text-primary" />
              <p className="mt-2 font-semibold">Pagos</p>
              <p className="text-xs text-muted-foreground">{pendingPayments.length} pendiente(s)</p>
            </Link>
          </div>
        </section>
      </div>

      <section className="space-y-3 animate-fade-up [animation-delay:180ms]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">Próximos días de servicio</h2>
          <Link to="/menu-semanal" className="inline-flex items-center gap-1 text-sm font-semibold text-primary" data-testid="dashboard-weekly-menu-link">
            <CalendarDays className="size-4" /> Menú semanal <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((date) => {
            const m = db.menus.find((x) => x.date === date);
            return m ? <MenuCard key={date} menu={m} prices={prices} testid={`upcoming-menu-${date}`} /> : <NoMenuCard key={date} date={date} testid={`upcoming-menu-empty-${date}`} />;
          })}
        </div>
      </section>
    </div>
  );
}