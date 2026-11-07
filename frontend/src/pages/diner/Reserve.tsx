import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck2, Clock, FlaskConical, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { MenuCard } from "@/components/MenuCard";
import { Notice, PageHeader, Panel, StatusBadge } from "@/components/common";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatARS, priceFor } from "@/domain/pricing";
import { ROLE_LABELS } from "@/domain/types";
import { CUTOFF_HOUR, formatDateLong } from "@/lib/time";
import { cn } from "@/lib/utils";
import { checkEligibility, createReservation, setDemoTime, useArgentinaNow, useCurrentUser, useDb } from "@/store/store";

const DEMO_TIMES: { value: string | null; label: string; testid: string }[] = [
  { value: null, label: "Hora real", testid: "demo-time-real-button" },
  { value: "10:00", label: "Simular 10:00", testid: "demo-time-1000-button" },
  { value: "15:00", label: "Simular 15:00", testid: "demo-time-1500-button" },
];

export default function Reserve() {
  const db = useDb();
  const user = useCurrentUser()!;
  const now = useArgentinaNow();
  const navigate = useNavigate();
  const [noContainer, setNoContainer] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const el = checkEligibility(db, user, now);
  const isStaff = user.role === "docente";
  const withContainer = !(isStaff && noContainer);
  const price = priceFor(user.role, withContainer);

  const confirm = () => {
    const res = createReservation(user, withContainer);
    setConfirmOpen(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("¡Reserva registrada! Ahora adjuntá el comprobante de pago.");
    navigate(`/pagos?reserva=${res.value.id}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Reservar" title="Reservá tu próxima vianda" description="Las viandas se sirven de lunes a viernes. Se reserva el siguiente día hábil hasta las 14:00 hs (hora de Argentina): el viernes se reserva para el lunes." />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Panel className="p-5 sm:p-6" data-testid="reserve-target-card">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
                <CalendarCheck2 className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha de la reserva</p>
                <p className="font-heading text-xl font-semibold" data-testid="reserve-target-date">{formatDateLong(el.targetDate)}</p>
              </div>
            </div>

            <div className="mt-5">
              {el.menu ? (
                <MenuCard menu={el.menu} prices={[{ label: ROLE_LABELS[user.role], price }]} testid="reserve-menu-card" />
              ) : (
                <Notice tone="warning" title="Sin menú cargado" testid="reserve-no-menu">No hay menú para esta fecha.</Notice>
              )}
            </div>

            {isStaff && el.menu && (
              <label htmlFor="no-container" className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-150 hover:bg-muted/60" data-testid="reserve-no-container-option">
                <Checkbox id="no-container" checked={noContainer} onCheckedChange={(c) => setNoContainer(Boolean(c))} disabled={!el.allowed} data-testid="reserve-no-container-checkbox" />
                <span>
                  <span className="block font-medium">No traigo recipiente</span>
                  <span className="block text-sm text-muted-foreground">
                    Se entrega en envase descartable: {formatARS(priceFor("docente", false))} en lugar de {formatARS(priceFor("docente", true))}.
                  </span>
                </span>
              </label>
            )}

            <div className="mt-5 flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Importe a pagar</p>
                <p className="font-mono text-3xl font-bold text-primary" data-testid="reserve-price">{formatARS(price)}</p>
              </div>
              <Button size="lg" className="h-12 px-6 text-base" disabled={!el.allowed} onClick={() => setConfirmOpen(true)} data-testid="reserve-submit-button">
                <UtensilsCrossed className="size-4" /> Reservar vianda
              </Button>
            </div>
          </Panel>

          {!el.allowed && (
            <Notice tone="warning" title="No es posible realizar la reserva" testid="reserve-blocked-message">
              {el.reason}
              {el.existing && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge reservation={el.existing} testid="reserve-existing-status" />
                  <Link to="/mis-reservas" className="font-semibold underline" data-testid="reserve-existing-link">
                    Ver mis reservas
                  </Link>
                </div>
              )}
            </Notice>
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5" data-testid="reserve-rules-card">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
              <ShieldCheck className="size-5 text-primary" /> Reglas de reserva
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Viandas solo de lunes a viernes; sábados y domingos no se reserva.</li>
              <li>• Se reserva el siguiente día hábil, antes de las {CUTOFF_HOUR}:00 hs (el viernes, para el lunes).</li>
              <li>• Máximo una reserva por día.</li>
              <li>• Solo fechas con menú cargado y disponible.</li>
              <li>• La reserva queda confirmada al aprobarse el pago.</li>
            </ul>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm">
              <Clock className="size-4 text-primary" />
              Hora actual: <span className="font-mono font-semibold" data-testid="reserve-current-time">{now.timeLabel} hs</span>
              {now.simulated && <span className="text-xs text-muted-foreground">(simulada)</span>}
            </div>
          </Panel>

          <Panel className="border-dashed p-5" data-testid="demo-time-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FlaskConical className="size-4 text-warning" /> Simulación de horario (solo prototipo)
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Permite demostrar la regla del corte de las 14:00 hs sin esperar a la hora real.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_TIMES.map((t) => (
                <button
                  key={t.testid}
                  type="button"
                  onClick={() => setDemoTime(t.value)}
                  data-testid={t.testid}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                    db.demoTime === t.value ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Panel>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => setConfirmOpen(o)}>
        <DialogContent data-testid="reserve-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Confirmar reserva</DialogTitle>
            <DialogDescription>Revisá los datos antes de confirmar.</DialogDescription>
          </DialogHeader>
          <dl className="space-y-3 rounded-xl bg-muted/60 p-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Fecha</dt><dd className="text-right font-semibold" data-testid="reserve-confirm-date">{formatDateLong(el.targetDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Menú</dt><dd className="text-right font-semibold">{el.menu?.dish}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Perfil</dt><dd className="text-right">{ROLE_LABELS[user.role]}{isStaff && (withContainer ? " · con recipiente" : " · sin recipiente")}</dd></div>
            <div className="flex justify-between gap-4 border-t pt-3"><dt className="font-semibold">Importe</dt><dd className="font-mono text-xl font-bold text-primary" data-testid="reserve-confirm-price">{formatARS(price)}</dd></div>
          </dl>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} data-testid="reserve-confirm-cancel-button">Volver</Button>
            <Button onClick={confirm} data-testid="reserve-confirm-button">Confirmar reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="mt-6 text-sm text-muted-foreground">
        ¿Querés ver todo el menú?{" "}
        <Link to="/menu-semanal" className={cn(buttonVariants({ variant: "link" }), "px-0")} data-testid="reserve-weekly-menu-link">
          Ir al menú semanal
        </Link>
      </p>
    </div>
  );
}
