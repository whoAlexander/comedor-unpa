import { useState } from "react";
import { Check, Eye, FileText, Inbox, X } from "lucide-react";
import { toast } from "sonner";
import { ReceiptViewer } from "@/components/ReceiptViewer";
import { EmptyState, Notice, PageHeader, Panel, PaymentBadge, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatARS } from "@/domain/pricing";
import { ROLE_LABELS, type PaymentStatus, type Reservation, type User } from "@/domain/types";
import { formatDateShort } from "@/lib/time";
import { approvePayment, rejectPayment, useDb } from "@/store/store";

type Filter = "todas" | PaymentStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "en_revision", label: "En revisión" },
  { value: "sin_comprobante", label: "Sin comprobante" },
  { value: "rechazado", label: "Rechazadas" },
];

function Actions({ r, onView, onReject }: { r: Reservation; onView: () => void; onReject: () => void }) {
  const reviewable = r.payment.status === "en_revision";
  const approve = () => {
    const res = approvePayment(r.id);
    if (res.ok) toast.success("Pago aprobado. La reserva quedó Pagada/Confirmada.");
    else toast.error(res.error);
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={onView} disabled={!r.payment.proof} data-testid={`admin-payment-${r.id}-view-button`}>
        <Eye className="size-4" /> Ver
      </Button>
      <Button size="sm" onClick={approve} disabled={!reviewable} data-testid={`admin-payment-${r.id}-approve-button`}>
        <Check className="size-4" /> Aprobar
      </Button>
      <Button size="sm" variant="destructive" onClick={onReject} disabled={!reviewable} data-testid={`admin-payment-${r.id}-reject-button`}>
        <X className="size-4" /> Rechazar
      </Button>
    </div>
  );
}

export default function AdminPayments() {
  const db = useDb();
  const [filter, setFilter] = useState<Filter>("todas");
  const [viewing, setViewing] = useState<Reservation | null>(null);
  const [rejecting, setRejecting] = useState<Reservation | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const userOf = (id: string): User => db.users.find((u) => u.id === id)!;

  const pending = db.reservations.filter((r) => r.status === "pendiente_pago");
  const rows = pending
    .filter((r) => filter === "todas" || r.payment.status === filter)
    .sort((a, b) => Number(b.payment.status === "en_revision") - Number(a.payment.status === "en_revision") || a.date.localeCompare(b.date));

  const openReject = (r: Reservation) => {
    setReason("");
    setReasonError(null);
    setRejecting(r);
  };
  const confirmReject = () => {
    if (!rejecting) return;
    if (reason.trim().length < 5) {
      setReasonError("Indicá el motivo del rechazo (mínimo 5 caracteres) para informar al comensal.");
      return;
    }
    const res = rejectPayment(rejecting.id, reason.trim());
    if (res.ok) toast.success(`Pago rechazado. Se informó a ${userOf(rejecting.userId).name}.`);
    else toast.error(res.error);
    setRejecting(null);
  };

  const proofCell = (r: Reservation) =>
    r.payment.proof ? (
      <span className="inline-flex max-w-44 items-center gap-1.5 truncate text-sm"><FileText className="size-4 shrink-0 text-primary" /><span className="truncate">{r.payment.proof.fileName}</span></span>
    ) : (
      <span className="text-sm text-muted-foreground">Sin adjuntar</span>
    );

  return (
    <div>
      <PageHeader eyebrow="Caja" title="Validación de pagos" description="Revisá los comprobantes de las reservas pendientes de pago y aprobalos o rechazalos." />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList className="mb-4 flex-wrap" data-testid="admin-payments-filter">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value} data-testid={`admin-payments-filter-${f.value}`}>
              {f.label} <span className="ml-1 font-mono text-xs opacity-70">{f.value === "todas" ? pending.length : pending.filter((r) => r.payment.status === f.value).length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {rows.length === 0 ? (
        <EmptyState icon={Inbox} title="No hay reservas en esta categoría" testid="admin-payments-empty" />
      ) : (
        <>
          <Panel className="hidden overflow-hidden md:block" data-testid="admin-payments-table">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const u = userOf(r.userId);
                  return (
                    <TableRow key={r.id} data-testid={`admin-payment-row-${r.id}`}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ROLE_LABELS[u.role]}{u.role === "docente" && !r.withContainer && " (sin recipiente)"}</TableCell>
                      <TableCell>{formatDateShort(r.date)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatARS(r.price)}</TableCell>
                      <TableCell>{proofCell(r)}</TableCell>
                      <TableCell><PaymentBadge reservation={r} testid={`admin-payment-${r.id}-status`} /></TableCell>
                      <TableCell><Actions r={r} onView={() => setViewing(r)} onReject={() => openReject(r)} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Panel>

          <div className="space-y-3 md:hidden" data-testid="admin-payments-cards">
            {rows.map((r) => {
              const u = userOf(r.userId);
              return (
                <Panel key={r.id} className="p-4" data-testid={`admin-payment-card-${r.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{ROLE_LABELS[u.role]} · {formatDateShort(r.date)}</p>
                    </div>
                    <p className="font-mono text-lg font-bold">{formatARS(r.price)}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><StatusBadge reservation={r} /><PaymentBadge reservation={r} /></div>
                  <div className="mt-2">{proofCell(r)}</div>
                  <div className="mt-3"><Actions r={r} onView={() => setViewing(r)} onReject={() => openReject(r)} /></div>
                </Panel>
              );
            })}
          </div>
        </>
      )}

      <Dialog open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-lg" data-testid="admin-receipt-dialog">
          <DialogHeader>
            <DialogTitle>Comprobante adjunto</DialogTitle>
            <DialogDescription>{viewing && `${userOf(viewing.userId).name} · Importe esperado ${formatARS(viewing.price)}`}</DialogDescription>
          </DialogHeader>
          {viewing?.payment.proof && <ReceiptViewer proof={viewing.payment.proof} />}
          {viewing?.payment.status === "rechazado" && <Notice tone="danger" title="Rechazado">{viewing.payment.rejectionReason}</Notice>}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejecting)} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent data-testid="admin-reject-dialog">
          <DialogHeader>
            <DialogTitle>Rechazar pago</DialogTitle>
            <DialogDescription>La reserva seguirá pendiente de pago: el comensal podrá enviar un nuevo comprobante o cancelarla.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motivo (se informa al comensal)</Label>
            <Textarea id="reject-reason" value={reason} onChange={(e) => { setReason(e.target.value); setReasonError(null); }} placeholder="Ej.: el importe no coincide con el total de la reserva." rows={3} data-testid="admin-reject-reason-input" />
            {reasonError && <p className="text-sm text-destructive" data-testid="admin-reject-reason-error">{reasonError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} data-testid="admin-reject-cancel-button">Volver</Button>
            <Button variant="destructive" onClick={confirmReject} data-testid="admin-reject-confirm-button">Rechazar pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}