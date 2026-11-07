import { useState, type FormEvent } from "react";
import { Minus, PackagePlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Notice, PageHeader, Panel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockItem } from "@/domain/types";
import { cn } from "@/lib/utils";
import { addStockItem, adjustStock, useDb } from "@/store/store";

const UNITS = ["kg", "g", "litros", "unidades", "paquetes", "latas"];
const isLow = (s: StockItem) => s.quantity < s.minimum;

function StockBadge({ item }: { item: StockItem }) {
  return (
    <span data-slot="badge" className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", isLow(item) ? "bg-danger-soft text-danger-soft-foreground" : "bg-success-soft text-success-soft-foreground")} data-testid={`stock-${item.id}-status`}>
      {isLow(item) ? "Stock bajo" : "OK"}
    </span>
  );
}

function Adjuster({ item }: { item: StockItem }) {
  const [amount, setAmount] = useState("1");
  const apply = (sign: 1 | -1) => {
    const n = Number(amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Ingresá una cantidad mayor a 0.");
      return;
    }
    const res = adjustStock(item.id, sign * n);
    if (!res.ok) toast.error(res.error);
    else toast.success(`${item.name}: ${res.value.quantity} ${item.unit}`);
  };
  return (
    <div className="flex items-center gap-1.5">
      <Button size="icon-sm" variant="outline" onClick={() => apply(-1)} aria-label={`Restar ${item.name}`} data-testid={`stock-${item.id}-decrease-button`}><Minus className="size-4" /></Button>
      <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="h-8 w-16 text-center font-mono" aria-label={`Cantidad a ajustar de ${item.name}`} data-testid={`stock-${item.id}-amount-input`} />
      <Button size="icon-sm" onClick={() => apply(1)} aria-label={`Sumar ${item.name}`} data-testid={`stock-${item.id}-increase-button`}><Plus className="size-4" /></Button>
    </div>
  );
}

const EMPTY = { name: "", unit: "kg", quantity: "", minimum: "" };

export default function Stock() {
  const db = useDb();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof EMPTY | "general", string>>>({});
  const items = [...db.stock].sort((a, b) => Number(isLow(b)) - Number(isLow(a)) || a.name.localeCompare(b.name));
  const low = db.stock.filter(isLow);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    const quantity = Number(form.quantity.replace(",", "."));
    const minimum = Number(form.minimum.replace(",", "."));
    if (form.name.trim().length < 2) errs.name = "Ingresá el nombre del insumo.";
    if (form.quantity === "" || !Number.isFinite(quantity) || quantity < 0) errs.quantity = "Cantidad inválida (0 o más).";
    if (form.minimum === "" || !Number.isFinite(minimum) || minimum < 0) errs.minimum = "Stock mínimo inválido (0 o más).";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const res = addStockItem({ name: form.name, unit: form.unit, quantity, minimum });
    if (!res.ok) {
      setErrors({ general: res.error });
      return;
    }
    toast.success(`Insumo "${res.value.name}" agregado.`);
    setForm(EMPTY);
    setErrors({});
  };

  return (
    <div>
      <PageHeader eyebrow="Cocina" title="Control de stock" description="Materias primas disponibles. Sumá o restá cantidades a medida que ingresan o se utilizan." />

      {low.length > 0 && (
        <Notice tone="danger" title={`Stock bajo en ${low.length} insumo(s)`} className="mb-6" testid="stock-low-alert">
          {low.map((s) => `${s.name} (${s.quantity} de ${s.minimum} ${s.unit})`).join(" · ")}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <Panel className="hidden overflow-hidden md:block" data-testid="stock-table">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Insumo</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ajustar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((s) => (
                  <TableRow key={s.id} className={isLow(s) ? "bg-danger-soft/50" : undefined} data-testid={`stock-row-${s.id}`}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.unit}</TableCell>
                    <TableCell className={cn("text-right font-mono text-base font-bold", isLow(s) && "text-danger")} data-testid={`stock-${s.id}-quantity`}>{s.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{s.minimum}</TableCell>
                    <TableCell><StockBadge item={s} /></TableCell>
                    <TableCell><Adjuster item={s} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <div className="space-y-3 md:hidden" data-testid="stock-cards">
            {items.map((s) => (
              <Panel key={s.id} className={cn("p-4", isLow(s) && "border-danger/50")} data-testid={`stock-card-${s.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Mínimo: {s.minimum} {s.unit}</p>
                  </div>
                  <StockBadge item={s} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className={cn("font-mono text-2xl font-bold", isLow(s) && "text-danger")}>{s.quantity} <span className="font-sans text-sm font-normal text-muted-foreground">{s.unit}</span></p>
                  <Adjuster item={s} />
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <Panel className="h-fit p-5" data-testid="stock-add-card">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold"><PackagePlus className="size-5 text-primary" /> Agregar insumo</h2>
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate data-testid="stock-add-form">
            <div className="space-y-2">
              <Label htmlFor="stock-name">Nombre del insumo</Label>
              <Input id="stock-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej.: Harina" aria-invalid={Boolean(errors.name)} data-testid="stock-add-name-input" />
              {errors.name && <p className="text-sm text-destructive" data-testid="stock-add-name-error">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Unidad de medida</Label>
              <Select value={form.unit} onValueChange={(v: string) => setForm({ ...form, unit: v })}>
                <SelectTrigger className="w-full" data-testid="stock-add-unit-select">
                  <SelectValue>{(v) => String(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u} data-testid={`stock-add-unit-option-${u}`}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="stock-qty">Cantidad</Label>
                <Input id="stock-qty" inputMode="decimal" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" aria-invalid={Boolean(errors.quantity)} data-testid="stock-add-quantity-input" />
                {errors.quantity && <p className="text-sm text-destructive" data-testid="stock-add-quantity-error">{errors.quantity}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock-min">Stock mínimo</Label>
                <Input id="stock-min" inputMode="decimal" value={form.minimum} onChange={(e) => setForm({ ...form, minimum: e.target.value })} placeholder="0" aria-invalid={Boolean(errors.minimum)} data-testid="stock-add-minimum-input" />
                {errors.minimum && <p className="text-sm text-destructive" data-testid="stock-add-minimum-error">{errors.minimum}</p>}
              </div>
            </div>
            {errors.general && <Notice tone="danger" testid="stock-add-error">{errors.general}</Notice>}
            <Button type="submit" className="h-11 w-full" data-testid="stock-add-submit-button"><PackagePlus className="size-4" /> Agregar insumo</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
