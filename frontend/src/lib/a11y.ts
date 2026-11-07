// Preferencias de accesibilidad globales, persistidas en LocalStorage.
import { useSyncExternalStore } from "react";

export type Appearance = "claro" | "oscuro" | "alto-contraste";

export interface A11yPrefs {
  scale: number;
  appearance: Appearance;
}

export const A11Y_STORAGE_KEY = "unpa_uaco_a11y_prefs";
export const SCALE_LEVELS = [80, 90, 100, 110, 125, 150, 175];
export const DEFAULT_PREFS: A11yPrefs = { scale: 100, appearance: "claro" };

function load(): A11yPrefs {
  try {
    const raw = localStorage.getItem(A11Y_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<A11yPrefs>;
    const scale = SCALE_LEVELS.includes(Number(parsed.scale)) ? Number(parsed.scale) : DEFAULT_PREFS.scale;
    const appearance: Appearance =
      parsed.appearance === "oscuro" || parsed.appearance === "alto-contraste" ? parsed.appearance : "claro";
    return { scale, appearance };
  } catch {
    return DEFAULT_PREFS;
  }
}

let prefs: A11yPrefs = DEFAULT_PREFS;
const listeners = new Set<() => void>();

function apply(p: A11yPrefs) {
  const html = document.documentElement;
  html.style.fontSize = `${p.scale}%`;
  html.classList.toggle("dark", p.appearance !== "claro");
  html.classList.toggle("hc", p.appearance === "alto-contraste");
  html.dataset.appearance = p.appearance;
}

export function initA11y() {
  prefs = load();
  apply(prefs);
}

export function setA11yPrefs(next: Partial<A11yPrefs>) {
  prefs = { ...prefs, ...next };
  localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  apply(prefs);
  listeners.forEach((l) => l());
}

export function resetA11yPrefs() {
  localStorage.removeItem(A11Y_STORAGE_KEY);
  prefs = DEFAULT_PREFS;
  apply(prefs);
  listeners.forEach((l) => l());
}

export function stepScale(direction: 1 | -1) {
  const idx = SCALE_LEVELS.indexOf(prefs.scale);
  const next = SCALE_LEVELS[Math.min(SCALE_LEVELS.length - 1, Math.max(0, idx + direction))];
  setA11yPrefs({ scale: next });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useA11yPrefs = () => useSyncExternalStore(subscribe, () => prefs);