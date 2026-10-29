// H3 — el cierre diario solo corre con el secreto del cron, venga como lo
// manda Vercel Cron (GET + Authorization: Bearer) o como lo prueba el equipo
// (POST + x-cron-secret).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { cerrarVisitasDelDia } = vi.hoisted(() => ({ cerrarVisitasDelDia: vi.fn() }));
vi.mock("@/lib/db/visitas", () => ({ cerrarVisitasDelDia }));

import { GET, POST } from "./route";

const SECRETO = "secreto-de-prueba-del-cron";
const URL_CIERRE = "http://localhost/api/visitas/cierre-diario";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", SECRETO);
  cerrarVisitasDelDia.mockResolvedValue({ count: 3 });
});

afterEach(() => vi.unstubAllEnvs());

describe("GET /api/visitas/cierre-diario (Vercel Cron)", () => {
  it("con Authorization: Bearer correcto → 200 y cierra las visitas", async () => {
    const respuesta = await GET(new Request(URL_CIERRE, { headers: { authorization: `Bearer ${SECRETO}` } }));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({ visitasCerradas: 3 });
    expect(cerrarVisitasDelDia).toHaveBeenCalledOnce();
  });

  it("sin secreto → 401 y no toca la base", async () => {
    const respuesta = await GET(new Request(URL_CIERRE));

    expect(respuesta.status).toBe(401);
    expect(cerrarVisitasDelDia).not.toHaveBeenCalled();
  });

  it("con un secreto incorrecto → 401", async () => {
    const respuesta = await GET(new Request(URL_CIERRE, { headers: { authorization: "Bearer otro" } }));

    expect(respuesta.status).toBe(401);
    expect(cerrarVisitasDelDia).not.toHaveBeenCalled();
  });

  it("si CRON_SECRET no está configurado, nadie pasa (ni con 'Bearer undefined')", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const respuesta = await GET(new Request(URL_CIERRE, { headers: { authorization: "Bearer undefined" } }));

    expect(respuesta.status).toBe(401);
    expect(cerrarVisitasDelDia).not.toHaveBeenCalled();
  });
});

describe("POST /api/visitas/cierre-diario (prueba manual, docs/api.http)", () => {
  it("con x-cron-secret correcto → 200", async () => {
    const respuesta = await POST(new Request(URL_CIERRE, { method: "POST", headers: { "x-cron-secret": SECRETO } }));

    expect(respuesta.status).toBe(200);
    expect(cerrarVisitasDelDia).toHaveBeenCalledOnce();
  });

  it("sin secreto → 401", async () => {
    expect((await POST(new Request(URL_CIERRE, { method: "POST" }))).status).toBe(401);
  });
});
