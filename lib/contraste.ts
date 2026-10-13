// Contraste de color según WCAG 2.1 (spec §7: texto ≥ 4,5:1).
// Funciones puras para verificar los tokens de app/globals.css en los tests.

type Rgb = readonly [number, number, number];

export function hexARgb(hex: string): Rgb {
  const limpio = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(limpio)) {
    throw new Error(`Color inválido: ${hex}`);
  }
  return [0, 2, 4].map((i) => parseInt(limpio.slice(i, i + 2), 16)) as unknown as Rgb;
}

function luminancia([r, g, b]: Rgb): number {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** Color que resulta de pintar `color` con opacidad `alfa` sobre `fondo` (ej. bg-destructive/15). */
export function mezclar(color: string, fondo: string, alfa: number): Rgb {
  const c = hexARgb(color);
  const f = hexARgb(fondo);
  return [0, 1, 2].map((i) => c[i]! * alfa + f[i]! * (1 - alfa)) as unknown as Rgb;
}

/** Relación de contraste entre dos colores (1 a 21). */
export function contraste(a: string | Rgb, b: string | Rgb): number {
  const la = luminancia(typeof a === "string" ? hexARgb(a) : a);
  const lb = luminancia(typeof b === "string" ? hexARgb(b) : b);
  const [claro, oscuro] = la > lb ? [la, lb] : [lb, la];
  return (claro + 0.05) / (oscuro + 0.05);
}
