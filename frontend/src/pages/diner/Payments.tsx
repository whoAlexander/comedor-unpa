import { useState, type ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileCheck2, FileUp, Paperclip, ReceiptText, Send, X } from "lucide-react";
import { toast } from "sonner";
import { COMEDOR_ACCOUNT } from "@/components/ReceiptViewer";
import { EmptyState, Notice, PageHeader, Panel, PaymentBadge, StatusBadge } from "@/components/common";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatARS } from "@/domain/pricing";
import type { PaymentProof, Reservation } from "@/domain/types";
import { formatDateLong, formatDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { cancelReservation, submitProof, useCurrentUser, useDb } from "@/store/store";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024;

function ProofUploader({ reservation, highlighted }: { reservation: Reservation; highlighted: boolean }) {
  const [file, setFile] = useState<PaymentProof | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const inputId = `proof-${reservation.id}`;
  const p = reservation.payment;

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Formato no admitido. Adjuntá una imagen (JPG, PNG, WEBP) o un PDF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("El archivo supera los 5 MB permitidos.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      setFile({ fileName: f.name, mimeType: f.type, dataUrl: String(reader.result), uploadedAt: new Date().toISOString() });
    };
    reader.readAsDataURL(f);
  };

  const send = () => {
    if (!file) {
      setError("Seleccioná un comprobante antes de enviarlo.");
      return;
    }
    const res = submitProof(reservation.id, file);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setFile(null);
    toast.success("Comprobante enviado. El personal de Caja lo revisará a la brevedad.");
  };

  const cancel = () => {
    const res = cancelReservation(reservation.id);
    setCancelOpen(false);
    if (res.ok) toast.success("Reserva cancelada.");
    else toast.error(res.error);
  };

  return (
    <Panel className={cn("p-5 sm:p-6", highlighted && "ring-2 ring-primary/40")} data-testid={`payment-card-${reservation.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha de la reserva</p>
          <p className="font-heading text-lg font-semibold" data-testid={`payment-card-${reservation.id}-date`}>{formatDateLong(reservation.date)}</p>
          <p className="text-sm text-muted-foreground">{reservation.menuName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Importe a pagar</p>
          <p className="font-mono text-2xl font-bold text-primary" data-testid={`payment-card-${reservation.id}-amount`}>{formatARS(reservation.price)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge reservation={reservation} testid={`payment-card-${reservation.id}-status`} />
        <PaymentBadge reservation={reservation} testid={`payment-card-${reservation.id}-payment-status`} />
      </div>

      {p.status === "rechazado" && (
        <Notice tone="danger" title="El pago fue rechazado por Caja" className="mt-4" testid={`payment-card-${reservation.id}-rejection`}>
          {p.rejectionReason} Podés adjuntar un nuevo comprobante o cancelar la reserva.
        </Notice>
      )}
      {p.status === "en_revision" && p.proof && (
        <Notice tone="info" title="Comprobante enviado" className="mt-4" testid={`payment-card-${reservation.id}-in-review`}>
          {p.proof.fileName} · {formatDateTime(p.proof.uploadedAt)}. Si te equivocaste, podés reemplazarlo.
        </Notice>
      )}

      <div className="mt-5 space-y-3">
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-[border-color,background-color] duration-150 hover:border-primary hover:bg-secondary/50"
          data-testid={`payment-card-${reservation.id}-dropzone`}
        >
          <FileUp className="size-7 text-primary" />
          <span className="font-semibold">{p.status === "en_revision" ? "Reemplazar comprobante" : "Adjuntar comprobante de transferencia"}</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, WEBP o PDF · hasta 5 MB</span>
        </label>
        <input id={inputId} type="file" accept={ACCEPTED.join(",")} className="sr-only" onChange={onFile} data-testid={`payment-card-${reservation.id}-file-input`} />
        {file && (
          <div className="flex items-center gap-3 rounded-xl border bg-muted/50 p-3 animate-pop-in" data-testid={`payment-card-${reservation.id}-file-preview`}>
            {file.mimeType.startsWith("image/") ? (
              <img src={file.dataUrl} alt="Vista previa del comprobante" className="size-12 rounded-lg border object-cover" />
            ) : (
              <span className="inline-flex size-12 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground"><Paperclip className="size-5" /></span>
            )}
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{file.fileName}</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setFile(null)} aria-label="Quitar archivo" data-testid={`payment-card-${reservation.id}-file-remove`}>
              <X className="size-4" />
            </Button>
          </div>
        )}
        {error && <Notice tone="danger" testid={`payment-card-${reservation.id}-error`}>{error}</Notice>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" className="h-11 text-destructive" onClick={() => setCancelOpen(true)} data-testid={`payment-card-${reservation.id}-cancel-button`}>
            Cancelar reserva
          </Button>
          <Button className="h-11" onClick={send} disabled={!file} data-testid={`payment-card-${reservation.id}-submit-button`}>
            <Send className="size-4" /> Enviar comprobante
          </Button>
        </div>
      </div>

      <Dialog open={cancelOpen} onOpenChange={(o) => setCancelOpen(o)}>
        <DialogContent data-testid="cancel-reservation-dialog">
          <DialogHeader>
            <DialogTitle>¿Cancelar la reserva?</DialogTitle>
            <DialogDescription>La reserva del {formatDateLong(reservation.date)} quedará cancelada. Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} data-testid="cancel-reservation-dismiss-button">Volver</Button>
            <Button variant="destructive" onClick={cancel} data-testid="cancel-reservation-confirm-button">Sí, cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  );
}

export default function Payments() {
  const db = useDb();
  const user = useCurrentUser()!;
  const [params] = useSearchParams();
  const focus = params.get("reserva");
  const pending = db.reservations.filter((r) => r.userId === user.id && r.status === "pendiente_pago").sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <PageHeader eyebrow="Pagos" title="Pagá tus reservas" description="Transferí el importe y adjuntá el comprobante. Caja lo valida y tu reserva queda confirmada." />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {pending.length === 0 ? (
            <EmptyState icon={FileCheck2} title="No tenés pagos pendientes" testid="payments-empty">
              <Link to="/reservar" className={cn(buttonVariants(), "mt-3")} data-testid="payments-empty-reserve-link">Reservar vianda</Link>
            </EmptyState>
          ) : (
            pending.map((r) => <ProofUploader key={r.id} reservation={r} highlighted={r.id === focus} />)
          )}
        </div>
        <Panel className="h-fit p-5" data-testid="payments-account-card">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><ReceiptText className="size-5 text-primary" /> Datos para transferir</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div><dt className="text-muted-foreground">Titular</dt><dd className="font-medium">{COMEDOR_ACCOUNT.holder}</dd></div>
            <div><dt className="text-muted-foreground">Alias</dt><dd className="font-mono font-semibold" data-testid="payments-account-alias">{COMEDOR_ACCOUNT.alias}</dd></div>
            <div><dt className="text-muted-foreground">CBU</dt><dd className="font-mono break-all">{COMEDOR_ACCOUNT.cbu}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">Indicá tu DNI en el concepto de la transferencia.</p>
        </Panel>
      </div>
    </div>
  );
}