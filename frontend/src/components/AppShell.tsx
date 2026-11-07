import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, ChefHat, ClipboardCheck, Home, LogOut, Package, QrCode, ReceiptText, Ticket, UtensilsCrossed } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { BrandMark } from "@/components/BrandMark";
import { ROLE_LABELS, type Role } from "@/domain/types";
import { logout, useCurrentUser } from "@/store/store";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  testid: string;
}

const DINER_NAV: NavItem[] = [
  { to: "/inicio", label: "Inicio", icon: Home, testid: "nav-inicio" },
  { to: "/menu-semanal", label: "Menú semanal", icon: CalendarDays, testid: "nav-menu-semanal" },
  { to: "/reservar", label: "Reservar", icon: UtensilsCrossed, testid: "nav-reservar" },
  { to: "/mis-reservas", label: "Mis reservas", icon: Ticket, testid: "nav-mis-reservas" },
];

const NAV: Record<Role, NavItem[]> = {
  estudiante: DINER_NAV,
  docente: DINER_NAV,
  admin: [
    { to: "/admin", label: "Inicio", icon: Home, testid: "nav-admin-inicio" },
    { to: "/admin/pagos", label: "Pagos", icon: ReceiptText, testid: "nav-admin-pagos" },
    { to: "/admin/escaner", label: "Escáner", icon: QrCode, testid: "nav-admin-escaner" },
    { to: "/admin/menus", label: "Menús", icon: ClipboardCheck, testid: "nav-admin-menus" },
  ],
  cocina: [
    { to: "/cocina", label: "Inicio / Demanda", icon: ChefHat, testid: "nav-cocina-demanda" },
    { to: "/cocina/stock", label: "Stock", icon: Package, testid: "nav-cocina-stock" },
  ],
};

export const HOME_BY_ROLE: Record<Role, string> = {
  estudiante: "/inicio",
  docente: "/inicio",
  admin: "/admin",
  cocina: "/cocina",
};

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

/** Layout protegido: valida el rol y dibuja Navbar + navegación del rol. */
export function RoleLayout({ roles }: { roles: Role[] }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  const items = NAV[user.role];
  const end = (to: string) => to === "/admin" || to === "/cocina";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 print:hidden bg-brand-dark text-brand-dark-foreground shadow-[0_1px_0_rgba(255,255,255,0.06)] hc-outline" data-testid="app-navbar">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <NavLink to={HOME_BY_ROLE[user.role]} className="shrink-0 rounded-lg" data-testid="navbar-brand-link" aria-label="Ir al inicio">
            <BrandMark />
          </NavLink>
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Navegación principal">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={end(item.to)}
                data-testid={`${item.testid}-desktop`}
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color] duration-150",
                    isActive ? "bg-white/15 text-brand-dark-foreground underline-offset-4 [.hc_&]:underline" : "text-brand-dark-muted hover:bg-white/10 hover:text-brand-dark-foreground",
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <AccessibilityPanel />
            <div className="hidden items-center gap-2.5 sm:flex" data-testid="navbar-user-info">
              <span className="inline-flex size-9 items-center justify-center rounded-full bg-brand-dark-accent/20 font-heading text-sm font-semibold text-brand-dark-accent">
                {initials(user.name)}
              </span>
              <div className="max-w-44 leading-tight">
                <p className="truncate text-sm font-semibold" data-testid="navbar-user-name">{user.name}</p>
                <p className="truncate text-xs text-brand-dark-muted" data-testid="navbar-user-role">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              data-testid="logout-button"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/25 px-3 text-sm font-medium transition-[background-color] duration-150 hover:bg-white/15"
            >
              <LogOut className="size-4" />
              <span className="hidden lg:inline">Cerrar sesión</span>
              <span className="sr-only lg:hidden">Cerrar sesión</span>
            </button>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-1.5 text-xs sm:hidden" data-testid="navbar-user-info-mobile">
          <span className="font-semibold">{user.name}</span>
          <span className="text-brand-dark-muted"> · {ROLE_LABELS[user.role]}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 print:hidden border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Navegación móvil"
        data-testid="mobile-bottom-nav"
      >
        <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={end(item.to)}
              data-testid={`${item.testid}-mobile`}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[0.7rem] font-medium transition-colors duration-150",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cn("inline-flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150", isActive && "bg-secondary")}>
                    <item.icon className="size-5" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}