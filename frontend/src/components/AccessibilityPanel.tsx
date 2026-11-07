import { useState } from "react";
import { Accessibility, Contrast, Minus, Moon, Plus, RotateCcw, Sun, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_PREFS, SCALE_LEVELS, resetA11yPrefs, setA11yPrefs, stepScale, useA11yPrefs, type Appearance } from "@/lib/a11y";

const APPEARANCES: { value: Appearance; label: string; hint: string; icon: typeof Sun }[] = [
  { value: "claro", label: "Claro", hint: "Fondo blanco y textos oscuros", icon: Sun },
  { value: "oscuro", label: "Oscuro", hint: "Fondos oscuros y textos claros", icon: Moon },
  { value: "alto-contraste", label: "Alto contraste", hint: "Máxima legibilidad", icon: Contrast },
];

/** Botón + panel lateral de accesibilidad, presente en todas las páginas. */
export function AccessibilityPanel({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const prefs = useA11yPrefs();
  const minScale = prefs.scale === SCALE_LEVELS[0];
  const maxScale = prefs.scale === SCALE_LEVELS[SCALE_LEVELS.length - 1];
  const isDefault = prefs.scale === DEFAULT_PREFS.scale && prefs.appearance === DEFAULT_PREFS.appearance;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir panel de accesibilidad"
        data-testid="accessibility-open-button"
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-current transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dark-accent",
          className,
        )}
      >
        <Accessibility className="size-5" />
      </button>
      <Sheet open={open} onOpenChange={(o) => setOpen(o)}>
        <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-sm" data-testid="accessibility-panel">
          <div className="flex items-start justify-between gap-4 border-b px-6 py-5">
            <div className="flex gap-3">
              <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
                <Accessibility className="size-5" />
              </span>
              <div>
                <SheetTitle className="font-heading text-xl font-semibold" data-testid="accessibility-panel-title">
                  Accesibilidad
                </SheetTitle>
                <SheetDescription className="mt-1 text-sm text-muted-foreground">
                  Ajustá el tamaño del texto y la apariencia. Tus preferencias se guardan en este dispositivo.
                </SheetDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar panel de accesibilidad" data-testid="accessibility-close-button">
              <X className="size-5" />
            </Button>
          </div>

          <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
            <section aria-labelledby="a11y-text-size">
              <h3 id="a11y-text-size" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tamaño del texto
              </h3>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border bg-muted/50 p-2">
                <Button variant="outline" size="icon-lg" onClick={() => stepScale(-1)} disabled={minScale} aria-label="Disminuir tamaño del texto" data-testid="a11y-text-decrease-button">
                  <Minus className="size-5" />
                </Button>
                <div className="text-center" aria-live="polite">
                  <p className="font-mono text-2xl font-bold" data-testid="a11y-text-scale-value">{prefs.scale}%</p>
                  <p className="text-xs text-muted-foreground">Tamaño actual</p>
                </div>
                <Button variant="outline" size="icon-lg" onClick={() => stepScale(1)} disabled={maxScale} aria-label="Aumentar tamaño del texto" data-testid="a11y-text-increase-button">
                  <Plus className="size-5" />
                </Button>
              </div>
              <div className="mt-3 flex justify-between px-1" aria-hidden="true">
                {SCALE_LEVELS.map((s) => (
                  <span key={s} className={cn("h-1.5 w-full rounded-full transition-colors duration-150 first:ml-0 ml-1", s <= prefs.scale ? "bg-primary" : "bg-border")} />
                ))}
              </div>
            </section>

            <section aria-labelledby="a11y-appearance">
              <h3 id="a11y-appearance" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Apariencia
              </h3>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-labelledby="a11y-appearance">
                {APPEARANCES.map(({ value, label, hint, icon: Icon }) => {
                  const active = prefs.appearance === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setA11yPrefs({ appearance: value })}
                      data-testid={`a11y-appearance-${value}-button`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-[border-color,background-color] duration-150",
                        active ? "border-primary bg-secondary" : "border-border hover:border-primary/50",
                      )}
                    >
                      <span className={cn("inline-flex size-9 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-semibold">{label}</span>
                        <span className="block text-xs text-muted-foreground">{hint}</span>
                      </span>
                      <span className={cn("size-4 rounded-full border-2", active ? "border-primary bg-primary" : "border-input")} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="border-t px-6 py-4">
            <Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal py-2" onClick={resetA11yPrefs} disabled={isDefault} data-testid="a11y-reset-button">
              <RotateCcw className="size-4" /> Restablecer valores predeterminados
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}