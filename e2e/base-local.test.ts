/**
 * Lo corre vitest (`npm test`), no Playwright: prueba el cinturón de las e2e
 * sin conectarse a ninguna base. Las URLs remotas de acá no existen.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exigirBasesLocales } from "./base-local";

const LOCAL = "postgresql://postgres:postgres@localhost:54330/pulso_e2e";
const REMOTA = "postgresql://usuario:clave@db.ejemplo-remoto.supabase.co:5432/postgres";

describe("exigirBasesLocales", () => {
  it("deja pasar con las dos URLs locales", () => {
    expect(() => exigirBasesLocales({ DATABASE_URL: LOCAL, DIRECT_URL: LOCAL })).not.toThrow();
    expect(() => exigirBasesLocales({ DATABASE_URL: LOCAL.replace("localhost", "127.0.0.1"), DIRECT_URL: LOCAL })).not.toThrow();
  });

  it("frena DATABASE_URL local con DIRECT_URL remota (las migraciones irían a producción)", () => {
    expect(() => exigirBasesLocales({ DATABASE_URL: LOCAL, DIRECT_URL: REMOTA })).toThrow(/DIRECT_URL apunta a db\.ejemplo-remoto\.supabase\.co/);
  });

  it("frena DATABASE_URL remota", () => {
    expect(() => exigirBasesLocales({ DATABASE_URL: REMOTA, DIRECT_URL: LOCAL })).toThrow(/DATABASE_URL/);
  });

  it("frena si falta alguna o no es una URL", () => {
    expect(() => exigirBasesLocales({ DATABASE_URL: LOCAL })).toThrow(/DIRECT_URL/);
    expect(() => exigirBasesLocales({ DATABASE_URL: "no-es-una-url", DIRECT_URL: LOCAL })).toThrow(/no es una URL/);
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
