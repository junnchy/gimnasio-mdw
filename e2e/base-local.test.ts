/**
 * Lo corre vitest (`npm test`), no Playwright: prueba el cinturón de las e2e
 * sin conectarse a ninguna base. Las URLs remotas de acá no existen.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exigirBaseLocal } from "./base-local";

const LOCAL = "postgresql://postgres:postgres@localhost:54330/pulso_e2e";
const REMOTA = "postgresql://usuario:clave@db.ejemplo-remoto.supabase.co:5432/postgres";

describe("exigirBaseLocal", () => {
  it("deja pasar con las dos URLs a la misma base local pulso_e2e", () => {
    expect(() => exigirBaseLocal({ DATABASE_URL: LOCAL, DIRECT_URL: LOCAL })).not.toThrow();
    expect(() => exigirBaseLocal({ DATABASE_URL: LOCAL.replace("localhost", "127.0.0.1"), DIRECT_URL: LOCAL })).not.toThrow();
  });

  it("frena DATABASE_URL local con DIRECT_URL remota (las migraciones irían a producción)", () => {
    expect(() => exigirBaseLocal({ DATABASE_URL: LOCAL, DIRECT_URL: REMOTA })).toThrow(/DIRECT_URL apunta a db\.ejemplo-remoto\.supabase\.co/);
  });

  it("frena DATABASE_URL remota", () => {
    expect(() => exigirBaseLocal({ DATABASE_URL: REMOTA, DIRECT_URL: LOCAL })).toThrow(/DATABASE_URL/);
  });

  it("frena si falta alguna o no es una URL", () => {
    expect(() => exigirBaseLocal({ DATABASE_URL: LOCAL })).toThrow(/DIRECT_URL/);
    expect(() => exigirBaseLocal({ DATABASE_URL: "no-es-una-url", DIRECT_URL: LOCAL })).toThrow(/no es una URL/);
  });

  // PR #18: en localhost puede haber una base de desarrollo o un túnel a una remota.
  it("frena una base local que no es la descartable", () => {
    const desarrollo = LOCAL.replace("/pulso_e2e", "/pulso");
    expect(() => exigirBaseLocal({ DATABASE_URL: desarrollo, DIRECT_URL: desarrollo })).toThrow(/base descartable "pulso_e2e"/);
  });

  it("frena si las dos URLs son locales pero apuntan a bases distintas", () => {
    const otroPuerto = LOCAL.replace(":54330", ":5432");
    expect(() => exigirBaseLocal({ DATABASE_URL: LOCAL, DIRECT_URL: otroPuerto })).toThrow(/tienen que ser la misma base/);
  });
});

// preparar() corre `prisma migrate deploy`: se reemplaza execSync por un espía
// para comprobar que con DIRECT_URL remota aborta ANTES de llamarlo.
const execSync = vi.hoisted(() => vi.fn());
vi.mock("node:child_process", () => ({ execSync }));

describe("preparar (setup global de las e2e)", () => {
  beforeEach(() => {
    execSync.mockClear();
    vi.unstubAllEnvs();
  });

  it("con DIRECT_URL remota aborta sin correr migraciones", async () => {
    vi.stubEnv("DATABASE_URL", LOCAL);
    vi.stubEnv("DIRECT_URL", REMOTA);
    const { default: preparar } = await import("./preparar");
    await expect(preparar()).rejects.toThrow(/DIRECT_URL/);
    expect(execSync).not.toHaveBeenCalled();
  });
});
