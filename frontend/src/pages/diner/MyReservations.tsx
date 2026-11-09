import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, QrCode as QrIcon, ReceiptText, Ticket } from "lucide-react";
import { toast } from "sonner";
import { QrCode } from "@/components/QrCode";
import { EmptyState, Notice, PageHeader, Panel, PaymentBadge, StatusBadge } from "@/components/common";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatARS } from "@/domain/pricing";
import { stateOf } from "@/domain/reservationState";
import type { Reservation } from "@/domain/types";
import { dayNumber, formatDateLong, formatDateTime, formatWeekday } from "@/lib/time";
import { cn } from "@/lib/utils";
import { cancelReservation, useCurrentUser, useDb } from "@/store/store";

type Filter = "activas" | "historial" | "todas";

export default function MyReservations() {
  const db = useDb();
  const user = useCurrentUser()!;
  const [filter, setFilter] = useState<Filter>("todas");
  const [qrFor, setQrFor] = useState<Reservation | null>(null);
  const [cancelFor, setCancelFor] = useState<Reservation | null>(null);

  const mine = db.reservations
    .filter((r) => r.userId === user.id)
    .filter((r) => (filter === "todas" ? true : filter === "activas" ? r.status === "pendiente_pago" || r.status === "pagada" : r.status === "entregada" || r.status === "cancelada"))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const doCancel = () => {
    if (!cancelFor) return;
    const res = cancelReservation(cancelFor.id);
    setCancelFor(null);
    if (res.ok) toast.success("Reserva cancelada.");
    else toast.error(res.error);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Mis reservas"
        title="Tus viandas"
        description="Mostrá el código QR en el mostrador para retirar las reservas confirmadas."
        actions={<Link to="/reservar" className={buttonVariants()} data-testid="my-reservations-new-link">Nueva reserva</Link>}
      />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-4" data-testid="my-reservations-filter">
          <TabsTrigger value="todas" data-testid="my-reservations-filter-todas">Todas</TabsTrigger>
          <TabsTrigger value="activas" data-testid="my-reservations-filter-activas">Activas</TabsTrigger>
          <TabsTrigger value="historial" data-testid="my-reservations-filter-historial">Historial</TabsTrigger>
        </TabsList>
      </Tabs>

      {mine.length === 0 ? (
        <EmptyState icon={Ticket} title="No hay reservas para mostrar" testid="my-reservations-empty">Cuando reserves una vianda aparecerá aquí.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-testid="my-reservations-list">
          {mine.map((r) => {
            const st = stateOf(r);
            return (
              <Panel key={r.id} className="flex flex-col p-5 animate-fade-up" data-testid={`reservation-card-${r.id}`}>
                <div className="flex gap-4">
                  <div className="flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider">{formatWeekday(r.date)}</span>
                    <span className="font-heading text-2xl font-bold leading-none">{dayNumber(r.date)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground" data-testid={`reservation-card-${r.id}-date`}>{formatDateLong(r.date)}</p>
                    <h3 className="font-heading text-lg font-semibold leading-snug" data-testid={`reservation-card-${r.id}-menu`}>{r?.menuName}</h3>
                    <p className="mt-0.5 font-mono font-bold text-primary" data-testid={`reservation-card-${r.id}-price`}>
                      {formatARS(r.price)}
                      {user.role === "docente" && <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">{r.withContainer ? "con recipiente" : "sin recipiente"}</span>}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge reservation={r} testid={`reservation-card-${r.id}-status`} />
                  {r.status === "pendiente_pago" && <PaymentBadge reservation={r} testid={`reservation-card-${r.id}-payment-status`} />}
                </div>
                {r.payment.status === "rechazado" && r.status === "pendiente_pago" && (
                  <Notice tone="danger" className="mt-3" testid={`reservation-card-${r.id}-rejection`}>{r.payment.rejectionReason}</Notice>
                )}

                {st.showsQr && (
                  <button
                    type="button"
                    onClick={() => setQrFor(r)}
                    className="mt-4 flex items-center gap-4 rounded-xl border bg-muted/40 p-3 text-left transition-colors duration-150 hover:border-primary/50"
                    data-testid={`reservation-card-${r.id}-qr-preview`}
                  >
                    <QrCode value={r.code} size={72} />
                    <span>
                      <span className="block text-sm font-semibold">Código para el mostrador</span>
                      <span className="block font-mono text-sm tracking-wider" data-testid={`reservation-card-${r.id}-code`}>{r.code}</span>
                      <span className="text-xs text-primary">Tocá para ampliar</span>
                    </span>
                  </button>
                )}
                {r.status === "entregada" && r.deliveredAt && (
                  <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" data-testid={`reservation-card-${r.id}-delivered-at`}>
                    <CheckCheck className="size-4 text-success" /> Retirada el {formatDateTime(r.deliveredAt)} hs
                  </p>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {st.showsQr && (
                    <Button size="sm" onClick={() => setQrFor(r)} data-testid={`reservation-card-${r.id}-show-qr-button`}>
                      <QrIcon className="size-4" /> Ver código QR
                    </Button>
                  )}
                  {st.canSubmitProof && (
                    <Link to={`/pagos?reserva=${r.id}`} className={buttonVariants({ size: "sm" })} data-testid={`reservation-card-${r.id}-pay-link`}>
                      <ReceiptText className="size-4" /> {r.payment.status === "en_revision" ? "Ver pago" : "Pagar"}
                    </Link>
                  )}
                  {st.canCancel && (
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelFor(r)} data-testid={`reservation-card-${r.id}-cancel-button`}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(qrFor)} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent data-testid="qr-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Tu código de retiro</DialogTitle>
            <DialogDescription>{qrFor && `${formatDateLong(qrFor.date)} · ${qrFor?.menuName}`}</DialogDescription>
          </DialogHeader>
          {qrFor && (
            <div className="flex flex-col items-center gap-3 py-2 animate-pop-in">
              <div className="rounded-2xl border-4 border-primary p-2">
                <QrCode value={qrFor.code} size={232} testid="qr-dialog-code-image" />
              </div>
              <p className={cn("font-mono text-xl font-bold tracking-[0.2em]")} data-testid="qr-dialog-code-text">{qrFor.code}</p>
              <p className="text-center text-sm text-muted-foreground">Presentalo en el mostrador junto con tu DNI.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelFor)} onOpenChange={(o) => !o && setCancelFor(null)}>
        <DialogContent data-testid="my-reservations-cancel-dialog">
          <DialogHeader>
            <DialogTitle>¿Cancelar la reserva?</DialogTitle>
            <DialogDescription>{cancelFor && `La reserva del ${formatDateLong(cancelFor.date)} quedará cancelada.`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelFor(null)} data-testid="my-reservations-cancel-dismiss-button">Volver</Button>
            <Button variant="destructive" onClick={doCancel} data-testid="my-reservations-cancel-confirm-button">Sí, cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}