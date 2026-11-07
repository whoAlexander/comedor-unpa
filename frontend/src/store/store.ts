// Base de datos simulada en memoria (se reinicia al recargar la página).
import { useEffect, useState, useSyncExternalStore } from "react";
import { priceFor } from "@/domain/pricing";
import { stateOf, TransitionError } from "@/domain/reservationState";
import type { Menu, PaymentProof, Reservation, Result, StockItem, User } from "@/domain/types";
import { isDiner } from "@/domain/types";
import { argentinaNow, isBeforeCutoff, isServiceDay, nextServiceDay, formatDateLong, type ArgentinaNow } from "@/lib/time";
import { createSeed } from "./seed";

interface DbState {
  users: User[];
  menus: Menu[];
  reservations: Reservation[];
  stock: StockItem[];
  sessionUserId: string | null;
  demoTime: string | null; // hora simulada "HH:MM" para demostrar la regla de las 14:00
}

const SESSION_KEY = "unpa_uaco_session";

let state: DbState = {
  ...createSeed(argentinaNow().dateISO),
  sessionUserId: sessionStorage.getItem(SESSION_KEY),
  demoTime: null,
};
const listeners = new Set<() => void>();

function setState(patch: Partial<DbState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDb = () => useSyncExternalStore(subscribe, () => state);

export const useCurrentUser = () => {
  const db = useDb();
  return db.users.find((u) => u.id === db.sessionUserId) ?? null;
};

/** Hora argentina actual (o simulada), refrescada cada 30 segundos. */
export function useArgentinaNow(): ArgentinaNow {
  const db = useDb();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  void tick;
  return argentinaNow(db.demoTime);
}

const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: string): Result<never> => ({ ok: false, error });
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  let code = "";
  do code = `UACO-${block()}-${block()}`;
  while (state.reservations.some((r) => r.code === code));
  return code;
}

function updateReservation(id: string, transition: (r: Reservation) => Reservation): Result<Reservation> {
  const current = state.reservations.find((r) => r.id === id);
  if (!current) return fail("La reserva no existe.");
  try {
    const next = transition(current);
    setState({ reservations: state.reservations.map((r) => (r.id === id ? next : r)) });
    return ok(next);
  } catch (e) {
    if (e instanceof TransitionError) return fail(e.message);
    throw e;
  }
}

// ---------- Sesión ----------
export function login(identifier: string, password: string): Result<User> {
  const id = identifier.trim().toLowerCase();
  const user = state.users.find((u) => (u.username === id || u.email.toLowerCase() === id) && u.password === password);
  if (!user) return fail("Usuario o contraseña incorrectos. Verificá los datos e intentá nuevamente.");
  sessionStorage.setItem(SESSION_KEY, user.id);
  setState({ sessionUserId: user.id });
  return ok(user);
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  setState({ sessionUserId: null });
}

export const setDemoTime = (demoTime: string | null) => setState({ demoTime });

// ---------- Reglas de reserva ----------
export interface ReservationEligibility {
  allowed: boolean;
  reason?: string;
  targetDate: string;
  menu?: Menu;
  existing?: Reservation;
}

export function checkEligibility(db: Pick<DbState, "menus" | "reservations">, user: User, now: ArgentinaNow): ReservationEligibility {
  // Siempre se reserva el siguiente día hábil (lunes a viernes); el viernes se reserva para el lunes.
  const targetDate = nextServiceDay(now.dateISO);
  const menu = db.menus.find((m) => m.date === targetDate);
  const existing = db.reservations.find((r) => r.userId === user.id && r.date === targetDate && r.status !== "cancelada");
  const base = { targetDate, menu, existing };
  const target = formatDateLong(targetDate);
  if (!isDiner(user.role)) return { ...base, allowed: false, reason: "Solo los comensales pueden reservar." };
  if (!isServiceDay(now.dateISO)) return { ...base, allowed: false, reason: `Los sábados y domingos no se toman reservas ni hay viandas. Las reservas para el ${target} se tomaron hasta el viernes a las 14:00 hs.` };
  if (existing) return { ...base, allowed: false, reason: `Ya tenés una reserva para el ${target}. Solo se permite una reserva por día.` };
  if (!isBeforeCutoff(now)) return { ...base, allowed: false, reason: `Las reservas para el ${target} cerraron hoy a las 14:00 hs.` };
  if (!menu) return { ...base, allowed: false, reason: `No hay un menú cargado para el ${target}. No es posible reservar esa fecha.` };
  if (!menu.available) return { ...base, allowed: false, reason: `El menú del ${target} no está disponible para reservas.` };
  return { ...base, allowed: true };
}

// ---------- Reservas y pagos ----------
export function createReservation(user: User, withContainer: boolean): Result<Reservation> {
  const now = argentinaNow(state.demoTime);
  const el = checkEligibility(state, user, now);
  if (!el.allowed || !el.menu) return fail(el.reason ?? "No es posible reservar.");
  const keepContainer = user.role === "docente" ? withContainer : true;
  const reservation: Reservation = {
    id: uid("r"),
    code: generateCode(),
    userId: user.id,
    date: el.targetDate,
    menuId: el.menu.id,
    menuName: el.menu.dish,
    withContainer: keepContainer,
    price: priceFor(user.role, keepContainer),
    status: "pendiente_pago",
    payment: { status: "sin_comprobante" },
    createdAt: new Date().toISOString(),
  };
  setState({ reservations: [...state.reservations, reservation] });
  return ok(reservation);
}

export const submitProof = (id: string, proof: PaymentProof) => updateReservation(id, (r) => stateOf(r).submitProof(r, proof));
export const approvePayment = (id: string) => updateReservation(id, (r) => stateOf(r).approvePayment(r));
export const rejectPayment = (id: string, reason: string) => updateReservation(id, (r) => stateOf(r).rejectPayment(r, reason));
export const cancelReservation = (id: string) => updateReservation(id, (r) => stateOf(r).cancel(r));

export type ScanOutcome = "success" | "pending" | "delivered" | "cancelled" | "wrong_date" | "not_found";

export interface ScanResult {
  outcome: ScanOutcome;
  message: string;
  reservation?: Reservation;
  user?: User;
}

/** Valida un código QR o DNI en el mostrador y, si corresponde, registra la entrega. */
export function scanCode(input: string): ScanResult {
  const today = argentinaNow(state.demoTime).dateISO;
  const value = input.trim().toUpperCase();
  let reservation: Reservation | undefined;
  if (/^\d{7,8}$/.test(value)) {
    const user = state.users.find((u) => u.dni === value);
    if (!user) return { outcome: "not_found", message: `No existe ningún comensal con DNI ${value}.` };
    const todays = state.reservations.filter((r) => r.userId === user.id && r.date === today);
    const priority = ["pagada", "pendiente_pago", "entregada", "cancelada"] as const;
    reservation = priority.map((s) => todays.find((r) => r.status === s)).find(Boolean);
    if (!reservation) return { outcome: "not_found", message: `${user.name} (DNI ${value}) no tiene reservas para hoy.`, user };
  } else {
    reservation = state.reservations.find((r) => r.code === value);
    if (!reservation) return { outcome: "not_found", message: `El código "${value}" no corresponde a ninguna reserva.` };
  }
  const user = state.users.find((u) => u.id === reservation.userId);
  switch (reservation.status) {
    case "pendiente_pago":
      return { outcome: "pending", message: "Reserva PENDIENTE DE PAGO. No se puede entregar la vianda.", reservation, user };
    case "entregada":
      return { outcome: "delivered", message: "Esta vianda ya fue retirada.", reservation, user };
    case "cancelada":
      return { outcome: "cancelled", message: "La reserva fue cancelada. No corresponde entregar la vianda.", reservation, user };
    case "pagada": {
      if (reservation.date !== today) {
        return { outcome: "wrong_date", message: `La reserva es para el ${formatDateLong(reservation.date)}, no para hoy.`, reservation, user };
      }
      const res = updateReservation(reservation.id, (r) => stateOf(r).deliver(r, new Date().toISOString()));
      if (!res.ok) return { outcome: "pending", message: res.error, reservation, user };
      return { outcome: "success", message: "¡Entrega registrada!", reservation: res.value, user };
    }
  }
}

// ---------- Menús ----------
export interface MenuInput {
  date: string;
  dish: string;
  description: string;
  available: boolean;
}

const activeReservationsFor = (menuId: string) =>
  state.reservations.filter((r) => r.menuId === menuId && (r.status === "pendiente_pago" || r.status === "pagada"));

export function saveMenu(input: MenuInput, id?: string): Result<Menu> {
  if (!isServiceDay(input.date)) return fail("El comedor funciona de lunes a viernes: no se pueden cargar menús para sábados ni domingos.");
  const duplicate = state.menus.find((m) => m.date === input.date && m.id !== id);
  if (duplicate) return fail(`Ya existe un menú para el ${formatDateLong(input.date)}.`);
  if (id) {
    const current = state.menus.find((m) => m.id === id);
    if (!current) return fail("El menú no existe.");
    if (current.date !== input.date && activeReservationsFor(id).length > 0) {
      return fail("No se puede cambiar la fecha: el menú tiene reservas activas.");
    }
    const updated = { ...current, ...input };
    setState({
      menus: state.menus.map((m) => (m.id === id ? updated : m)),
      reservations: state.reservations.map((r) => (r.menuId === id ? { ...r, menuName: updated.dish } : r)),
    });
    return ok(updated);
  }
  const menu: Menu = { id: uid("m"), ...input };
  setState({ menus: [...state.menus, menu] });
  return ok(menu);
}

export function deleteMenu(id: string): Result<undefined> {
  const active = activeReservationsFor(id).length;
  if (active > 0) return fail(`No se puede eliminar: el menú tiene ${active} reserva(s) activa(s).`);
  setState({ menus: state.menus.filter((m) => m.id !== id) });
  return ok(undefined);
}

// ---------- Stock ----------
export function adjustStock(id: string, delta: number): Result<StockItem> {
  const item = state.stock.find((s) => s.id === id);
  if (!item) return fail("El insumo no existe.");
  const quantity = Math.round((item.quantity + delta) * 100) / 100;
  if (quantity < 0) return fail(`No hay suficiente ${item.name.toLowerCase()} para restar ${Math.abs(delta)} ${item.unit}.`);
  const updated = { ...item, quantity };
  setState({ stock: state.stock.map((s) => (s.id === id ? updated : s)) });
  return ok(updated);
}

export function addStockItem(input: Omit<StockItem, "id">): Result<StockItem> {
  if (state.stock.some((s) => s.name.toLowerCase() === input.name.trim().toLowerCase())) {
    return fail(`El insumo "${input.name.trim()}" ya existe.`);
  }
  const item: StockItem = { id: uid("s"), ...input, name: input.name.trim() };
  setState({ stock: [...state.stock, item] });
  return ok(item);
}
