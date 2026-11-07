import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, LogIn, UserRound } from "lucide-react";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { BrandMark } from "@/components/BrandMark";
import { HOME_BY_ROLE } from "@/components/AppShell";
import { Notice, Panel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRICE_TABLE, formatARS } from "@/domain/pricing";
import { ROLE_LABELS, type Role } from "@/domain/types";
import { login, useCurrentUser } from "@/store/store";

const DEMO_ACCOUNTS: { role: Role; username: string; password: string }[] = [
  { role: "estudiante", username: "estudiante", password: "estudiante123" },
  { role: "docente", username: "docente", password: "docente123" },
  { role: "admin", username: "admin", password: "admin123" },
  { role: "cocina", username: "cocina", password: "cocina123" },
];

export default function Login() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Ingresá tu usuario o correo electrónico y tu contraseña.");
      return;
    }
    const res = login(identifier, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate(HOME_BY_ROLE[res.value.role], { replace: true });
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="bg-brand-dark text-brand-dark-foreground hc-outline" data-testid="login-navbar">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandMark />
          <AccessibilityPanel />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-14">
        <section className="animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Universidad Nacional de la Patagonia Austral</p>
          <h1 className="mt-3 font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
            Comedor Universitario
            <span className="block text-primary">Caleta Olivia</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg text-muted-foreground">
            Reservá tu vianda, enviá tu comprobante de pago y retirala con tu código QR en el mostrador.
          </p>
          <div className="mt-8 hidden max-w-lg grid-cols-3 gap-3 sm:grid" data-testid="login-price-list">
            {PRICE_TABLE.map((p) => (
              <div key={p.label} className="rounded-xl border bg-card p-4 shadow-soft hc-outline">
                <p className="font-mono text-xl font-bold text-primary">{formatARS(p.price)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{p.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 hidden text-sm text-muted-foreground sm:block">Viandas de lunes a viernes. Reservas para el siguiente día hábil hasta las 14:00 hs.</p>
        </section>

        <section className="animate-fade-up [animation-delay:80ms]">
          <Panel className="p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-semibold">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ingresá con tu cuenta institucional.</p>
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate data-testid="login-form">
              <div className="space-y-2">
                <Label htmlFor="identifier">Usuario o correo electrónico</Label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    autoComplete="username"
                    placeholder="usuario o nombre@uaco.unpa.edu.ar"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setError(null);
                    }}
                    className="h-12 pl-9 text-base"
                    aria-invalid={Boolean(error)}
                    data-testid="login-identifier-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    className="h-12 px-9 text-base"
                    aria-invalid={Boolean(error)}
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    data-testid="login-toggle-password-button"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              {error && <Notice tone="danger" testid="login-error-message">{error}</Notice>}
              <Button type="submit" className="h-12 w-full text-base" data-testid="login-submit-button">
                <LogIn className="size-4" /> Ingresar
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Las cuentas son administradas por el Comedor. No existe registro público.
            </p>
          </Panel>

          <Panel className="mt-4 p-5" data-testid="demo-credentials-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Usuarios de prueba del prototipo</p>
            <p className="mt-1 text-xs text-muted-foreground">Tocá una fila para completar el formulario y luego presioná Ingresar.</p>
            <ul className="mt-3 divide-y">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.role}>
                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier(a.username);
                      setPassword(a.password);
                      setError(null);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-150 hover:bg-muted"
                    data-testid={`demo-credentials-${a.role}-button`}
                  >
                    <span className="text-sm font-medium">{ROLE_LABELS[a.role]}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {a.username} / {a.password}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      </main>
    </div>
  );
}
