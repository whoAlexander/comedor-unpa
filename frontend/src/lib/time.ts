// Utilidades de fecha/hora anclada a Argentina (America/Argentina/Buenos_Aires).
export const TIMEZONE = "America/Argentina/Buenos_Aires";
export const CUTOFF_HOUR = 14;

export interface ArgentinaNow {
  dateISO: string;
  hour: number;
  minute: number;
  timeLabel: string;
  simulated: boolean;
}

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Hora actual en Argentina. `override` ("HH:MM") simula la hora para la demostración. */
export function argentinaNow(override?: string | null, date: Date = new Date()): ArgentinaNow {
  const parts = Object.fromEntries(partsFmt.formatToParts(date).map((p) => [p.type, p.value]));
  const dateISO = `${parts.year}-${parts.month}-${parts.day}`;
  let hour = Number(parts.hour) % 24;
  let minute = Number(parts.minute);
  if (override) {
    const [h, m] = override.split(":").map(Number);
    hour = h;
    minute = m;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return { dateISO, hour, minute, timeLabel: `${pad(hour)}:${pad(minute)}`, simulated: Boolean(override) };
}

export const isBeforeCutoff = (now: ArgentinaNow) => now.hour < CUTOFF_HOUR;

const toDate = (iso: string) => new Date(`${iso}T12:00:00Z`);

export function addDays(iso: string, n: number) {
  const d = toDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const weekdayOf = (iso: string) => toDate(iso).getUTCDay(); // 0 = domingo

/** El comedor sirve viandas solo de lunes a viernes. */
export const isServiceDay = (iso: string) => {
  const wd = weekdayOf(iso);
  return wd >= 1 && wd <= 5;
};

/** Próximo día hábil de servicio posterior a `iso` (el viernes devuelve el lunes). */
export function nextServiceDay(iso: string) {
  let d = addDays(iso, 1);
  while (!isServiceDay(d)) d = addDays(d, 1);
  return d;
}

/** Los `count` días de servicio siguientes a `iso`. */
export function nextServiceDays(iso: string, count: number) {
  const out: string[] = [];
  let d = iso;
  while (out.length < count) out.push((d = nextServiceDay(d)));
  return out;
}

export function startOfWeek(iso: string) {
  const wd = weekdayOf(iso);
  return addDays(iso, wd === 0 ? -6 : 1 - wd);
}

const longFmt = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const shortFmt = new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });
const weekdayFmt = new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" });
const timeFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false });
const dateTimeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatDateLong = (iso: string) => capitalize(longFmt.format(toDate(iso)));
export const formatDateShort = (iso: string) => capitalize(shortFmt.format(toDate(iso)).replace(",", ""));
export const formatWeekday = (iso: string) => capitalize(weekdayFmt.format(toDate(iso)).replace(".", ""));
export const dayNumber = (iso: string) => String(toDate(iso).getUTCDate());
export const formatTime = (isoDateTime: string) => timeFmt.format(new Date(isoDateTime));
export const formatDateTime = (isoDateTime: string) => dateTimeFmt.format(new Date(isoDateTime));
