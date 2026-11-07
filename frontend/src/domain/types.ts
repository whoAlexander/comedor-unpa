// Modelo de dominio del Comedor Universitario UNPA-UACO (mock en memoria).

export type Role = "estudiante" | "docente" | "admin" | "cocina";

export const ROLE_LABELS: Record<Role, string> = {
  estudiante: "Estudiante",
  docente: "Docente/Nodocente",
  admin: "Administrador (Mostrador y Caja)",
  cocina: "Personal de Cocina",
};

export const isDiner = (role: Role) => role === "estudiante" || role === "docente";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  dni: string;
}

export interface Menu {
  id: string;
  date: string; // YYYY-MM-DD
  dish: string;
  description: string;
  available: boolean;
}

export type ReservationStatus = "pendiente_pago" | "pagada" | "entregada" | "cancelada";

export type PaymentStatus = "sin_comprobante" | "en_revision" | "rechazado" | "aprobado";

export interface SimulatedReceipt {
  bank: string;
  operation: string;
  payer: string;
  amount: number;
  date: string;
  time: string;
}

export interface PaymentProof {
  fileName: string;
  mimeType: string;
  dataUrl?: string; // archivo real adjuntado desde el navegador
  simulated?: SimulatedReceipt; // comprobante ficticio de los datos de prueba
  uploadedAt: string; // ISO
}

export interface Payment {
  status: PaymentStatus;
  proof?: PaymentProof;
  rejectionReason?: string;
}

export interface Reservation {
  id: string;
  code: string; // código único para el QR
  userId: string;
  date: string; // fecha de la vianda YYYY-MM-DD
  menuId: string;
  menuName: string;
  withContainer: boolean;
  price: number;
  status: ReservationStatus;
  payment: Payment;
  createdAt: string;
  deliveredAt?: string;
}

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minimum: number;
}

export type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string };