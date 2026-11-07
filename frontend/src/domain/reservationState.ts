// Patrón State: cada estado de la reserva define qué transiciones son válidas.
import type { PaymentProof, Reservation, ReservationStatus } from "./types";

export class TransitionError extends Error {}

export abstract class ReservationState {
  abstract readonly status: ReservationStatus;
  abstract readonly label: string;
  readonly showsQr: boolean = false;
  readonly canSubmitProof: boolean = false;
  readonly canCancel: boolean = false;

  protected deny(action: string): never {
    throw new TransitionError(`No se puede ${action}: la reserva está "${this.label}".`);
  }

  submitProof(_r: Reservation, _proof: PaymentProof): Reservation {
    return this.deny("adjuntar un comprobante");
  }
  approvePayment(_r: Reservation): Reservation {
    return this.deny("aprobar el pago");
  }
  rejectPayment(_r: Reservation, _reason: string): Reservation {
    return this.deny("rechazar el pago");
  }
  deliver(_r: Reservation, _at: string): Reservation {
    return this.deny("entregar la vianda");
  }
  cancel(_r: Reservation): Reservation {
    return this.deny("cancelar la reserva");
  }
}

class PendingPaymentState extends ReservationState {
  readonly status = "pendiente_pago" as const;
  readonly label = "Pendiente de pago";
  readonly canSubmitProof = true;
  readonly canCancel = true;

  submitProof(r: Reservation, proof: PaymentProof): Reservation {
    return { ...r, payment: { status: "en_revision", proof } };
  }
  approvePayment(r: Reservation): Reservation {
    if (r.payment.status !== "en_revision") {
      throw new TransitionError("Solo se puede aprobar un pago con comprobante en revisión.");
    }
    return { ...r, status: "pagada", payment: { ...r.payment, status: "aprobado", rejectionReason: undefined } };
  }
  rejectPayment(r: Reservation, reason: string): Reservation {
    if (r.payment.status !== "en_revision") {
      throw new TransitionError("Solo se puede rechazar un pago con comprobante en revisión.");
    }
    // Sigue pendiente de pago: el comensal puede reenviar el comprobante o cancelar.
    return { ...r, payment: { ...r.payment, status: "rechazado", rejectionReason: reason } };
  }
  deliver(): Reservation {
    throw new TransitionError("La reserva está pendiente de pago. No se puede entregar la vianda.");
  }
  cancel(r: Reservation): Reservation {
    return { ...r, status: "cancelada" };
  }
}

class PaidState extends ReservationState {
  readonly status = "pagada" as const;
  readonly label = "Pagada/Confirmada";
  readonly showsQr = true;

  deliver(r: Reservation, at: string): Reservation {
    return { ...r, status: "entregada", deliveredAt: at };
  }
}

class DeliveredState extends ReservationState {
  readonly status = "entregada" as const;
  readonly label = "Entregada";
  deliver(): Reservation {
    throw new TransitionError("La vianda ya fue retirada.");
  }
}

class CancelledState extends ReservationState {
  readonly status = "cancelada" as const;
  readonly label = "Cancelada";
}

const STATES: Record<ReservationStatus, ReservationState> = {
  pendiente_pago: new PendingPaymentState(),
  pagada: new PaidState(),
  entregada: new DeliveredState(),
  cancelada: new CancelledState(),
};

export const stateOf = (r: Pick<Reservation, "status">) => STATES[r.status];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  pendiente_pago: STATES.pendiente_pago.label,
  pagada: STATES.pagada.label,
  entregada: STATES.entregada.label,
  cancelada: STATES.cancelada.label,
};
