// Cálculo del reporte de ingresos y estadísticas (función pura sobre los datos del sistema).
import { PriceCalculatorFactory } from "./pricing";
import { STATUS_LABELS } from "./reservationState";
import type { Menu, PaymentStatus, Reservation, ReservationStatus, StockItem, User } from "./types";
import { ROLE_LABELS } from "./types";

export interface ReportInput {
  users: User[];
  menus: Menu[];
  reservations: Reservation[];
  stock: StockItem[];
  from: string;
  to: string;
}

export interface ProfileRow {
  label: string;
  unitPrice: number;
  reservations: number;
  collected: number;
  pending: number;
}

export interface DayRow {
  date: string;
  reservations: number;
  collected: number;
  pending: number;
  delivered: number;
}

const isCollected = (r: Reservation) => r.status === "pagada" || r.status === "entregada";

export function buildReport({ users, menus, reservations, stock, from, to }: ReportInput) {
  const userOf = (id: string) => users.find((u) => u?.id === id);
  const inRange = reservations.filter((r) => r.date >= from && r.date <= to);
  const active = inRange.filter((r) => r.status !== "cancelada");
  const collected = inRange.filter(isCollected);
  const pending = inRange.filter((r) => r.status === "pendiente_pago");
  const cancelled = inRange.filter((r) => r.status === "cancelada");
  const delivered = inRange.filter((r) => r.status === "entregada");
  const sum = (rs: Reservation[]) => rs.reduce((acc, r) => acc + r.price, 0);

  // Ingresos por perfil de precio (mismos perfiles que define la Factory).
  const profiles = [
    { calc: PriceCalculatorFactory.create("estudiante"), match: (r: Reservation) => userOf(r.userId)?.role === "estudiante" },
    { calc: PriceCalculatorFactory.create("docente", true), match: (r: Reservation) => userOf(r.userId)?.role === "docente" && r.withContainer },
    { calc: PriceCalculatorFactory.create("docente", false), match: (r: Reservation) => userOf(r.userId)?.role === "docente" && !r.withContainer },
  ];
  const byProfile: ProfileRow[] = profiles.map(({ calc, match }) => ({
    label: calc.profileLabel,
    unitPrice: calc.calculate(),
    reservations: active.filter(match).length,
    collected: sum(collected.filter(match)),
    pending: sum(pending.filter(match)),
  }));

  const dates = [...new Set(inRange.map((r) => r.date))].sort();
  const byDay: DayRow[] = dates.map((date) => {
    const day = inRange.filter((r) => r.date === date);
    return {
      date,
      reservations: day.filter((r) => r.status !== "cancelada").length,
      collected: sum(day.filter(isCollected)),
      pending: sum(day.filter((r) => r.status === "pendiente_pago")),
      delivered: day.filter((r) => r.status === "entregada").length,
    };
  });

  const statuses: ReservationStatus[] = ["pendiente_pago", "pagada", "entregada", "cancelada"];
  const byStatus = statuses.map((s) => ({ status: s, label: STATUS_LABELS[s], count: inRange.filter((r) => r.status === s).length }));

  const paymentLabels: Record<PaymentStatus, string> = {
    sin_comprobante: "Sin comprobante",
    en_revision: "En revisión",
    rechazado: "Rechazados",
    aprobado: "Aprobados",
  };
  const byPayment = (Object.keys(paymentLabels) as PaymentStatus[]).map((p) => ({
    status: p,
    label: paymentLabels[p],
    count: inRange.filter((r) => r.status !== "cancelada" && r.payment.status === p).length,
  }));

  const menuCounts = new Map<string, { dish: string; date: string; count: number }>();
  for (const r of active) {
    const m = menus.find((x) => x?.id === r?.menuId);
    const entry = menuCounts.get(r?.menuId) ?? { dish: m?.dish ?? r?.menuName, date: r.date, count: 0 };
    entry.count++;
    menuCounts.set(r?.menuId, entry);
  }
  const topMenus = [...menuCounts.values()].sort((a, b) => b.count - a.count || a.date.localeCompare(b.date)).slice(0, 5);

  const roleCounts = (["estudiante", "docente"] as const).map((role) => ({
    label: ROLE_LABELS[role],
    count: active.filter((r) => userOf(r.userId)?.role === role).length,
  }));
  const uniqueDiners = new Set(active.map((r) => r.userId)).size;
  const paidOrDelivered = collected.length;

  return {
    totals: {
      reservations: inRange.length,
      active: active.length,
      collected: sum(collected),
      pendingAmount: sum(pending),
      cancelledAmount: sum(cancelled),
      averageTicket: collected.length ? Math.round(sum(collected) / collected.length) : 0,
      deliveredCount: delivered.length,
      pickupRate: paidOrDelivered ? Math.round((delivered.length / paidOrDelivered) * 100) : 0,
      cancellationRate: inRange.length ? Math.round((cancelled.length / inRange.length) * 100) : 0,
      uniqueDiners,
      containerlessCount: active.filter((r) => !r.withContainer).length,
    },
    byProfile,
    byDay,
    byStatus,
    byPayment,
    topMenus,
    roleCounts,
    lowStock: stock.filter((s) => s.quantity < s.minimum),
    rows: [...inRange].sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export type Report = ReturnType<typeof buildReport>;