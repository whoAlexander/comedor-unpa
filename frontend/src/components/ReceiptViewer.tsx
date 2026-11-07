import { FileText, Landmark } from "lucide-react";
import { formatARS } from "@/domain/pricing";
import type { PaymentProof } from "@/domain/types";
import { formatDateTime } from "@/lib/time";

export const COMEDOR_ACCOUNT = {
  holder: "Comedor Universitario UNPA-UACO",
  alias: "COMEDOR.UACO.UNPA",
  cbu: "0860001101800012345678",
};

/** Visor del comprobante adjunto: imagen/PDF real o comprobante simulado de los datos de prueba. */
export function ReceiptViewer({ proof }: { proof: PaymentProof }) {
  if (proof.dataUrl && proof.mimeType.startsWith("image/")) {
    return <img src={proof.dataUrl} alt={`Comprobante ${proof.fileName}`} className="max-h-[60vh] w-full rounded-xl border object-contain" data-testid="receipt-image" />;
  }
  if (proof.dataUrl && proof.mimeType === "application/pdf") {
    return <iframe src={proof.dataUrl} title={`Comprobante ${proof.fileName}`} className="h-[60vh] w-full rounded-xl border" data-testid="receipt-pdf" />;
  }
  const s = proof.simulated;
  if (!s) {
    return (
      <div className="flex items-center gap-3 rounded-xl border p-4" data-testid="receipt-file">
        <FileText className="size-6 text-primary" />
        <p className="text-sm">{proof.fileName}</p>
      </div>
    );
  }
  const rows: [string, string][] = [
    ["Fecha y hora", `${s.date.split("-").reverse().join("/")} ${s.time} hs`],
    ["N.º de operación", s.operation],
    ["Ordenante", s.payer],
    ["Destinatario", COMEDOR_ACCOUNT.holder],
    ["Alias", COMEDOR_ACCOUNT.alias],
    ["CBU", COMEDOR_ACCOUNT.cbu],
    ["Concepto", "Reserva de vianda"],
  ];
  return (
    <div className="mx-auto w-full max-w-sm rounded-xl border-2 border-dashed bg-muted/40 p-5 font-mono text-sm" data-testid="receipt-simulated">
      <div className="flex items-center gap-2 border-b border-dashed pb-3">
        <Landmark className="size-5 text-primary" />
        <div>
          <p className="font-sans font-semibold">{s.bank}</p>
          <p className="font-sans text-xs text-muted-foreground">Comprobante de transferencia (simulado)</p>
        </div>
      </div>
      <p className="py-4 text-center text-3xl font-bold text-primary" data-testid="receipt-amount">{formatARS(s.amount)}</p>
      <dl className="space-y-1.5 border-t border-dashed pt-3">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-right font-medium break-all">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-dashed pt-3 text-center text-xs text-muted-foreground">
        Archivo: {proof.fileName} · Subido {formatDateTime(proof.uploadedAt)}
      </p>
    </div>
  );
}
