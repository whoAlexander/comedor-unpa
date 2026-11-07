import { useMemo } from "react";

const SIZE = 25;

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const inFinder = (x: number, y: number) =>
  (x < 8 && y < 8) || (x >= SIZE - 8 && y < 8) || (x < 8 && y >= SIZE - 8);

function finderCell(x: number, y: number) {
  const fx = x >= SIZE - 8 ? x - (SIZE - 7) : x;
  const fy = y >= SIZE - 8 ? y - (SIZE - 7) : y;
  if (fx < 0 || fy < 0 || fx > 6 || fy > 6) return false;
  const edge = fx === 0 || fx === 6 || fy === 0 || fy === 6;
  const core = fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4;
  return edge || core;
}

/** Código QR simulado: patrón determinístico y único derivado del código de la reserva. */
export function QrCode({ value, size = 168, testid }: { value: string; size?: number; testid?: string }) {
  const cells = useMemo(() => {
    const rand = rng(hash(value));
    const out: [number, number][] = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const on = inFinder(x, y) ? finderCell(x, y) : (y === 6 || x === 6) ? (x + y) % 2 === 0 : rand() > 0.52;
        if (on) out.push([x, y]);
      }
    }
    return out;
  }, [value]);

  return (
    <svg
      viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Código QR de la reserva ${value}`}
      className="rounded-lg bg-white"
      data-testid={testid}
      data-qr-value={value}
    >
      <rect x={-2} y={-2} width={SIZE + 4} height={SIZE + 4} fill="#FFFFFF" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill="#0D3825" />
      ))}
    </svg>
  );
}
