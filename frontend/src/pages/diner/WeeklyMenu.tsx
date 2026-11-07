import { MenuCard, NoMenuCard } from "@/components/MenuCard";
import { PageHeader } from "@/components/common";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dinerPrices } from "@/domain/pricing";
import { addDays, startOfWeek } from "@/lib/time";
import { useArgentinaNow, useCurrentUser, useDb } from "@/store/store";

export default function WeeklyMenu() {
  const db = useDb();
  const user = useCurrentUser()!;
  const today = useArgentinaNow().dateISO;
  const prices = dinerPrices(user.role);
  const weeks = [
    { key: "actual", label: "Esta semana", start: startOfWeek(today) },
    { key: "proxima", label: "Próxima semana", start: addDays(startOfWeek(today), 7) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Menú semanal" title="Lo que se cocina esta semana" description="Viandas de lunes a viernes (sábados y domingos sin servicio). Precios calculados según tu perfil." />
      <Tabs defaultValue="actual">
        <TabsList className="mb-4" data-testid="weekly-menu-tabs">
          {weeks.map((w) => (
            <TabsTrigger key={w.key} value={w.key} data-testid={`weekly-menu-tab-${w.key}`}>
              {w.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {weeks.map((w) => (
          <TabsContent key={w.key} value={w.key}>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 5 }, (_, i) => addDays(w.start, i)).map((date) => {
                const m = db.menus.find((x) => x.date === date);
                const reserved = db.reservations.some((r) => r.userId === user.id && r.date === date && r.status !== "cancelada");
                return m ? (
                  <MenuCard
                    key={date}
                    menu={m}
                    prices={prices}
                    isToday={date === today}
                    testid={`weekly-menu-${date}`}
                    badge={
                      reserved ? (
                        <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-brand-soft-foreground" data-testid={`weekly-menu-${date}-reserved`}>
                          Reservado
                        </span>
                      ) : undefined
                    }
                  />
                ) : (
                  <NoMenuCard key={date} date={date} testid={`weekly-menu-empty-${date}`} />
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}