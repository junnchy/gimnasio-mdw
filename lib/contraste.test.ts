// Spec §7: todo texto llega a 4,5:1. Este test lee los tokens reales de
// app/globals.css y las opacidades que usan los componentes de shadcn, así
// que si alguien cambia un color o un tinte de hover y rompe el contraste,
// el CI falla antes del merge.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { contraste, hexARgb, mezclar } from "./contraste";

const MINIMO = 4.5;
const leer = (archivo: string) => readFileSync(path.join(process.cwd(), archivo), "utf8");

function tokens(css: string, selector: ":root" | ".dark"): Record<string, string> {
  const inicio = css.indexOf(`\n${selector} {`);
  const bloque = css.slice(inicio, css.indexOf("\n}", inicio));
  const pares = [...bloque.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6});/g)];
  return Object.fromEntries(pares.map(([, nombre, valor]) => [nombre!, valor!]));
}

/** Opacidades de bg-destructive/NN en una variante, separadas en claro y oscuro. */
function tintes(archivo: string, variante: string) {
  const linea = leer(archivo)
    .split("\n")
    .find((l, i, todas) => todas[i - 1]?.trim() === `${variante}:` && l.includes("bg-destructive"));
  if (!linea) throw new Error(`No encontré la variante ${variante} en ${archivo}`);
  const clases = linea.split(/\s+/);
  const alfas = (filtro: (c: string) => boolean) =>
    clases
      .filter((c) => c.includes("bg-destructive/") && filtro(c))
      .map((c) => Number(c.split("bg-destructive/")[1]!.replace(/\W.*$/, "")) / 100);
  return { claro: alfas((c) => !c.includes("dark:")), oscuro: alfas((c) => c.includes("dark:")) };
}

const css = leer("app/globals.css");
const temas = { claro: tokens(css, ":root"), oscuro: tokens(css, ".dark") };

describe("tokens de texto (spec §7: 4,5:1)", () => {
  const pares = [
    ["foreground", "background"],
    ["card-foreground", "card"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["muted-foreground", "background"],
    ["muted-foreground", "muted"],
    ["accent-foreground", "accent"],
    ["destructive", "background"],
    ["destructive", "card"],
  ] as const;

  for (const [nombre, t] of Object.entries(temas)) {
    for (const [texto, fondo] of pares) {
      it(`${nombre}: ${texto} sobre ${fondo}`, () => {
        expect(contraste(t[texto]!, t[fondo]!)).toBeGreaterThanOrEqual(MINIMO);
      });
    }
  }
});

describe("variantes destructivas, en reposo y con el cursor encima", () => {
  for (const [archivo, variante] of [
    ["components/ui/button.tsx", "destructive"],
    ["components/ui/badge.tsx", "destructive"],
  ] as const) {
    const alfas = tintes(archivo, variante);

    for (const [nombre, t] of Object.entries(temas)) {
      const lista = [...new Set(nombre === "claro" ? alfas.claro : [...alfas.claro, ...alfas.oscuro])];
      for (const fondo of ["background", "card", "muted"] as const) {
        for (const alfa of lista) {
          it(`${archivo} · ${nombre}: texto sobre bg-destructive/${alfa * 100} en ${fondo}`, () => {
            const tintado = mezclar(t.destructive!, t[fondo]!, alfa);
            expect(contraste(hexARgb(t.destructive!), tintado)).toBeGreaterThanOrEqual(MINIMO);
          });
        }
      }
    }
  }
});
