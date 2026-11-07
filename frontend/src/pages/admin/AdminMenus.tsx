import { useState, type FormEvent } from "react";
import { CalendarPlus, Pencil, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, Notice, PageHeader, Panel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PRICE_TABLE, formatARS } from "@/domain/pricing";
import type { Menu } from "@/domain/types";
import { addDays, formatDateLong, formatDateShort, isServiceDay, nextServiceDay, startOfWeek } from "@/lib/time";
import { deleteMenu, saveMenu, useArgentinaNow, useDb, type MenuInput } from "@/store/store";

type WeekFilter = "actual" | "proxima" | "todos";
const EMPTY: MenuInput = { date: "", dish: "", description: "", available: true };

export default function AdminMenus() {
  const db = useDb();
  const today = useArgentinaNow().dateISO;
  const [week, setWeek] = useState<WeekFilter>("actual");
  const [editing, setEditing] = useState<Menu | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<MenuInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof MenuInput | "general", string>>>({});
  const [deleting, setDeleting] = useState<Menu | null>(null);

  const ws = startOfWeek(today);
  const range: Record<WeekFilter, [string, string]> = {
    actual: [ws, addDays(ws, 6)],
    proxima: [addDays(ws, 7), addDays(ws, 13)],
    todos: ["0000-00-00", "9999-99-99"],
  };
  const [from, to] = range[week];
  const menus = db.menus.filter((m) => m.date >= from && m.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  const reservationsFor = (id: string) => db.reservations.filter((r) => r.menuId === id && r.status !== "cancelada").length;

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY, date: nextServiceDay(today) });
    setErrors({});
    setFormOpen(true);
  };
  const openEdit = (m: Menu) => {
    setEditing(m);
    setForm({ date: m.date, dish: m.dish, description: m.description, available: m.available });
    setErrors({});
    setFormOpen(true);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.date) errs.date = "Seleccioná una fecha.";
    else if (!isServiceDay(form.date)) errs.date = "El comedor funciona de lunes a viernes. Elegí un día hábil.";
    if (form.dish.trim().length < 3) errs.dish = "Ingresá el plato principal (mínimo 3 caracteres).";
    if (form.description.trim().length < 10) errs.description = "Ingresá una descripción (mínimo 10 caracteres).";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const res = saveMenu({ ...form, dish: form.dish.trim(), description: form.description.trim() }, editing?.id);
    if (!res.ok) {
      setErrors({ general: res.error });
      return;
    }
    toast.success(editing ? "Menú actualizado." : "Menú creado.");
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const res = deleteMenu(deleting.id);
    if (res.ok) toast.success("Menú eliminado.");
    else toast.error(res.error);
    setDeleting(null);
  };

  const availability = (m: Menu) => (
    <span data-slot="badge" className={m.available ? "rounded-full bg-success-soft px-2.5 py-1 text-xs font-semibold text-success-soft-foreground" : "rounded-full bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger-soft-foreground"} data-testid={`admin-menu-${m.id}-availability`}>
      {m.available ? "Disponible" : "No disponible"}
    </span>
  );
  const actions = (m: Menu) => (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => openEdit(m)} data-testid={`admin-menu-${m.id}-edit-button`}><Pencil className="size-4" /> Editar</Button>
      <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleting(m)} data-testid={`admin-menu-${m.id}-delete-button`}><Trash2 className="size-4" /> Eliminar</Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Gestión"
        title="Menús"
        description="Alta, edición y baja de menús por fecha (solo de lunes a viernes). El precio se calcula automáticamente según el perfil del comensal."
        actions={<Button className="h-11" onClick={openNew} data-testid="admin-menu-new-button"><CalendarPlus className="size-4" /> Nuevo menú</Button>}
      />
      <Tabs value={week} onValueChange={(v) => setWeek(v as WeekFilter)}>
        <TabsList className="mb-4" data-testid="admin-menus-week-filter">
          <TabsTrigger value="actual" data-testid="admin-menus-week-actual">Esta semana</TabsTrigger>
          <TabsTrigger value="proxima" data-testid="admin-menus-week-proxima">Próxima semana</TabsTrigger>
          <TabsTrigger value="todos" data-testid="admin-menus-week-todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {menus.length === 0 ? (
        <EmptyState icon={UtensilsCrossed} title="No hay menús en este período" testid="admin-menus-empty">Usá “Nuevo menú” para cargar uno.</EmptyState>
      ) : (
        <>
          <Panel className="hidden overflow-hidden md:block" data-testid="admin-menus-table">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Plato principal</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead className="text-right">Reservas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((m) => (
                  <TableRow key={m.id} className={m.date === today ? "bg-secondary/50" : undefined} data-testid={`admin-menu-row-${m.id}`}>
                    <TableCell className="whitespace-nowrap font-medium">{formatDateShort(m.date)}{m.date === today && <span className="ml-2 text-xs text-primary">Hoy</span>}</TableCell>
                    <TableCell className="font-semibold" data-testid={`admin-menu-${m.id}-dish`}>{m.dish}</TableCell>
                    <TableCell className="max-w-72 whitespace-normal text-sm text-muted-foreground">{m.description}</TableCell>
                    <TableCell>{availability(m)}</TableCell>
                    <TableCell className="text-right font-mono">{reservationsFor(m.id)}</TableCell>
                    <TableCell>{actions(m)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <div className="space-y-3 md:hidden" data-testid="admin-menus-cards">
            {menus.map((m) => (
              <Panel key={m.id} className="p-4" data-testid={`admin-menu-card-${m.id}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">{formatDateLong(m.date)}</p>
                  {availability(m)}
                </div>
                <p className="mt-1 font-heading text-lg font-semibold">{m.dish}</p>
                <p className="text-sm text-muted-foreground">{m.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">{reservationsFor(m.id)} reserva(s)</p>
                <div className="mt-3">{actions(m)}</div>
              </Panel>
            ))}
          </div>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={(o) => setFormOpen(o)}>
        <DialogContent className="sm:max-w-lg" data-testid="admin-menu-form-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">{editing ? "Editar menú" : "Nuevo menú"}</DialogTitle>
            <DialogDescription>Completá los datos del menú. No se cargan fotografías.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4" noValidate data-testid="admin-menu-form">
            <div className="space-y-2">
              <Label htmlFor="menu-date">Fecha</Label>
              <Input id="menu-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-invalid={Boolean(errors.date)} data-testid="admin-menu-date-input" />
              {errors.date && <p className="text-sm text-destructive" data-testid="admin-menu-date-error">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-dish">Plato principal</Label>
              <Input id="menu-dish" value={form.dish} onChange={(e) => setForm({ ...form, dish: e.target.value })} placeholder="Ej.: Guiso de lentejas" aria-invalid={Boolean(errors.dish)} data-testid="admin-menu-dish-input" />
              {errors.dish && <p className="text-sm text-destructive" data-testid="admin-menu-dish-error">{errors.dish}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-desc">Descripción</Label>
              <Textarea id="menu-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ingredientes y acompañamiento" aria-invalid={Boolean(errors.description)} data-testid="admin-menu-description-input" />
              {errors.description && <p className="text-sm text-destructive" data-testid="admin-menu-description-error">{errors.description}</p>}
            </div>
            <div className="rounded-xl bg-muted/60 p-3" data-testid="admin-menu-price-preview">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precio (calculado automáticamente por perfil)</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PRICE_TABLE.map((p) => (
                  <div key={p.label}><p className="font-mono font-bold text-primary">{formatARS(p.price)}</p><p className="text-[0.7rem] leading-tight text-muted-foreground">{p.label}</p></div>
                ))}
              </div>
            </div>
            <label htmlFor="menu-available" className="flex cursor-pointer items-center gap-3">
              <Checkbox id="menu-available" checked={form.available} onCheckedChange={(c) => setForm({ ...form, available: Boolean(c) })} data-testid="admin-menu-available-checkbox" />
              <span className="text-sm font-medium">Disponible para reservas</span>
            </label>
            {errors.general && <Notice tone="danger" testid="admin-menu-form-error">{errors.general}</Notice>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} data-testid="admin-menu-form-cancel-button">Cancelar</Button>
              <Button type="submit" data-testid="admin-menu-form-submit-button">{editing ? "Guardar cambios" : "Crear menú"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent data-testid="admin-menu-delete-dialog">
          <DialogHeader>
            <DialogTitle>¿Eliminar menú?</DialogTitle>
            <DialogDescription>{deleting && `${deleting.dish} · ${formatDateLong(deleting.date)}. No se puede eliminar si tiene reservas activas.`}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} data-testid="admin-menu-delete-cancel-button">Volver</Button>
            <Button variant="destructive" onClick={confirmDelete} data-testid="admin-menu-delete-confirm-button">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
