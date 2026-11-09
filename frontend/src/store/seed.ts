// Datos de prueba generados relativos al día actual (hora Argentina).
import { priceFor } from "@/domain/pricing";
import type { Menu, PaymentProof, Reservation, StockItem, User } from "@/domain/types";
import { addDays, isServiceDay } from "@/lib/time";

export const SEED_USERS: User[] = [
  { id: "u-est", username: "estudiante", email: "mateo.rossi@uaco.unpa.edu.ar", password: "estudiante123", name: "Mateo Rossi", role: "estudiante", dni: "42123456" },
  { id: "u-doc", username: "docente", email: "carlos.mendez@uaco.unpa.edu.ar", password: "docente123", name: "Carlos Méndez", role: "docente", dni: "28456789" },
  { id: "u-adm", username: "admin", email: "laura.gomez@uaco.unpa.edu.ar", password: "admin123", name: "Laura Gómez", role: "admin", dni: "30111222" },
  { id: "u-coc", username: "cocina", email: "roberto.sosa@uaco.unpa.edu.ar", password: "cocina123", name: "Roberto Sosa", role: "cocina", dni: "25333444" },
  // Comensales adicionales (con contraseña genérica "comensal123")
  { id: "u-lf", username: "lfernandez", email: "lucia.fernandez@uaco.unpa.edu.ar", password: "comensal123", name: "Lucía Fernández", role: "estudiante", dni: "43987654" },
  { id: "u-ta", username: "taguirre", email: "tomas.aguirre@uaco.unpa.edu.ar", password: "comensal123", name: "Tomás Aguirre", role: "estudiante", dni: "44556677" },
  { id: "u-vr", username: "vruiz", email: "valentina.ruiz@uaco.unpa.edu.ar", password: "comensal123", name: "Valentina Ruiz", role: "estudiante", dni: "43221100" },
  { id: "u-mp", username: "mpaz", email: "martin.paz@uaco.unpa.edu.ar", password: "comensal123", name: "Martín Paz", role: "estudiante", dni: "42778899" },
  { id: "u-sh", username: "sherrera", email: "sofia.herrera@uaco.unpa.edu.ar", password: "comensal123", name: "Sofía Herrera", role: "estudiante", dni: "44001122" },
  { id: "u-at", username: "atorres", email: "ana.torres@uaco.unpa.edu.ar", password: "comensal123", name: "Ana Torres", role: "docente", dni: "27665544" },
  { id: "u-jq", username: "jquiroga", email: "jorge.quiroga@uaco.unpa.edu.ar", password: "comensal123", name: "Jorge Quiroga", role: "docente", dni: "26889900" },
];

const DISHES: [string, string][] = [
  ["Guiso de lentejas patagónico", "Lentejas con chorizo colorado, panceta, zapallo y verduras de estación."],
  ["Milanesa de carne con puré mixto", "Milanesa al horno acompañada de puré de papa y calabaza."],
  ["Cazuela de pollo y verduras", "Pollo trozado con zanahoria, arvejas, papa y arroz blanco."],
  ["Pastel de papa", "Carne picada con cebolla, morrón y huevo, cubierta de puré gratinado."],
  ["Tarta de verdura y huevo", "Acelga, cebolla y queso. Ensalada de zanahoria rallada."],
  ["Fideos con tuco y albóndigas", "Tallarines con salsa de tomate casera y albóndigas de carne."],
  ["Arroz con pollo", "Arroz amarillo con pollo, morrón, cebolla y arvejas."],
  ["Locro criollo", "Maíz blanco, zapallo, porotos, carne y chorizo colorado."],
  ["Merluza al horno con papas", "Filet de merluza austral con papas españolas y limón."],
  ["Ñoquis de papa con salsa filetto", "Ñoquis caseros con salsa de tomate fresco y albahaca."],
  ["Carne al horno con vegetales", "Carne vacuna al horno con papa, batata y cebolla."],
  ["Lasaña de verduras", "Capas de masa con espinaca, ricota, zapallitos y salsa blanca."],
];

const proof = (fileName: string, payer: string, amount: number, date: string, time: string, operation: string): PaymentProof => ({
  fileName,
  mimeType: "simulado",
  simulated: { bank: "Banco Santa Cruz", operation, payer, amount, date, time },
  uploadedAt: (date && time) ? new Date(`${date}T${time}:00-03:00`).toISOString() : "",
});

export function createSeed(today: string) {
  // Menús desde 3 días atrás hasta 10 días adelante, solo de lunes a viernes.
  const menus: Menu[] = [];
  let dishIdx = 0;
  let futureCount = 0;
  for (let offset = -3; offset <= 10; offset++) {
    const date = addDays(today, offset);
    if (!isServiceDay(date)) continue;
    const [dish, description] = DISHES[dishIdx % DISHES.length];
    dishIdx++;
    if (offset > 0) futureCount++;
    // El 3.er día hábil futuro queda "no disponible" para demostrar esa regla.
    menus.push({ id: `m-${date}`, date, dish, description, available: !(offset > 0 && futureCount === 3) });
  }
  const servingDays = menus.map((m) => m.date);
  const menuOn = (date: string) => menus.find((m) => m.date === date)!;
  const prevServing = (n: number) => servingDays.filter((d) => d < today).reverse()[n - 1];
  const todayServing = menuOn(today) ? today : servingDays.find((d) => d > today)!;
  const nextServing = servingDays.find((d) => d > todayServing)!;
  const yesterday = prevServing(1);
  const twoDaysAgo = prevServing(2);

  const users = Object.fromEntries(SEED_USERS.map((u) => [u.id, u]));
  let seq = 0;
  const mk = (
    userId: string,
    date: string,
    code: string,
    status: Reservation["status"],
    payment: Reservation["payment"],
    withContainer = true,
    extra: Partial<Reservation> = {},
  ): Reservation => {
    const menu = menuOn(date);
    return {
      id: `r-${++seq}`,
      code,
      userId,
      date,
      menuId: menu?.id,
      menuName: menu?.dish,
      withContainer,
      price: priceFor(users[userId].role, withContainer),
      status,
      payment,
      createdAt: addDays(date, -1) ? new Date(`${addDays(date, -1)}T10:${String(10 + seq).padStart(2, "0")}:00-03:00`).toISOString() : new Date().toISOString(),
      ...extra,
    };
  };
  const paid = (userId: string, date: string, amount: number, op: string): Reservation["payment"] => ({
    status: "aprobado",
    proof: proof(`comprobante_${op}.pdf`, users[userId].name, amount, addDays(date, -1), "11:05", op),
  });
 const deliveredAt = (date: string, time: string) => (date && time) ? new Date(`${date}T${time}:00-03:00`).toISOString() : new Date().toISOString();
  const T = todayServing;

  const reservations: Reservation[] = [
    // Estudiante de prueba
    mk("u-est", T, "UACO-MR7K-2Q9X", "pagada", paid("u-est", T, 2050, "00481276")),
    mk("u-est", yesterday, "UACO-MR3D-7L4P", "entregada", paid("u-est", yesterday, 2050, "00479310"), true, { deliveredAt: deliveredAt(yesterday, "12:41") }),
    mk("u-est", twoDaysAgo, "UACO-MR9W-5C2H", "cancelada", { status: "sin_comprobante" }),
    // Docente de prueba
    mk("u-doc", T, "UACO-CM4P-8H2D", "pagada", paid("u-doc", T, 4500, "00481302"), false),
    mk("u-doc", nextServing, "UACO-CM6T-3J8N", "pendiente_pago", {
      status: "rechazado",
      proof: proof("transferencia_carlos.pdf", "Carlos Méndez", 4100, T, "09:12", "00481544"),
      rejectionReason: "El importe transferido ($4.100) no coincide con el total de la reserva sin recipiente ($4.500).",
    }, false),
    mk("u-doc", yesterday, "UACO-CM2B-9F6K", "entregada", paid("u-doc", yesterday, 4100, "00479355"), true, { deliveredAt: deliveredAt(yesterday, "13:02") }),
    // Otros comensales
    mk("u-lf", T, "UACO-LF5R-4N7A", "pagada", paid("u-lf", T, 2050, "00481288")),
    mk("u-lf", nextServing, "UACO-LF8M-2K5E", "pendiente_pago", { status: "en_revision", proof: proof("comprobante_lucia.jpg", "Lucía Fernández", 2050, T, "08:47", "00481533") }),
    mk("u-ta", T, "UACO-TA3Y-6P9B", "pagada", paid("u-ta", T, 2050, "00481291")),
    mk("u-ta", nextServing, "UACO-TA7Q-1W4C", "pendiente_pago", { status: "en_revision", proof: proof("transferencia_tomas.pdf", "Tomás Aguirre", 2050, T, "10:20", "00481561") }),
    mk("u-vr", T, "UACO-VR2H-8M3D", "entregada", paid("u-vr", T, 2050, "00481240"), true, { deliveredAt: deliveredAt(T, "12:15") }),
    mk("u-mp", T, "UACO-MP3N-6T5R", "pendiente_pago", { status: "sin_comprobante" }),
    mk("u-sh", T, "UACO-SH9J-4X2F", "cancelada", { status: "sin_comprobante" }),
    mk("u-at", T, "UACO-AT6L-5V8G", "pagada", paid("u-at", T, 4100, "00481299")),
    mk("u-jq", T, "UACO-JQ1Z-7R3H", "pagada", paid("u-jq", T, 4500, "00481307"), false),
  ];

  const stock: StockItem[] = [
    { id: "s-1", name: "Carne vacuna", unit: "kg", quantity: 18, minimum: 25 },
    { id: "s-2", name: "Pollo", unit: "kg", quantity: 32, minimum: 20 },
    { id: "s-3", name: "Arroz", unit: "kg", quantity: 40, minimum: 15 },
    { id: "s-4", name: "Fideos", unit: "kg", quantity: 12, minimum: 15 },
    { id: "s-5", name: "Papa", unit: "kg", quantity: 60, minimum: 30 },
    { id: "s-6", name: "Verduras de estación", unit: "kg", quantity: 22, minimum: 20 },
    { id: "s-7", name: "Aceite", unit: "litros", quantity: 6, minimum: 10 },
    { id: "s-8", name: "Recipientes descartables", unit: "unidades", quantity: 140, minimum: 100 },
    { id: "s-9", name: "Lentejas", unit: "kg", quantity: 9, minimum: 8 },
    { id: "s-10", name: "Huevos", unit: "unidades", quantity: 180, minimum: 120 },
  ];

  return { users: SEED_USERS, menus, reservations, stock };
}
