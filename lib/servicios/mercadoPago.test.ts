// Clase 7 — las reglas del servicio externo: la credencial se lee al llamar,
// hay timeout, y cualquier falla devuelve null en vez de lanzar.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearPreferenciaDePago, obtenerPagoDeMercadoPago } from "./mercadoPago";

const pago = { id: "ckpago00000000000000000001", monto: 15000 };
const fetchFalso = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchFalso);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  fetchFalso.mockReset();
});

describe("crearPreferenciaDePago", () => {
  it("sin MP_ACCESS_TOKEN → null, loguea y no sale a la red", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "");

    await expect(crearPreferenciaDePago(pago)).resolves.toBeNull();
    expect(fetchFalso).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  it("lee el token al llamarse (no al importar) y manda timeout y external_reference", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    fetchFalso.mockResolvedValueOnce(
      Response.json({ id: "pref-1", init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-1" }),
    );

    const preferencia = await crearPreferenciaDePago(pago);

    expect(preferencia).toEqual({
      id: "pref-1",
      init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-1",
    });
    expect(fetchFalso).toHaveBeenCalledOnce();
    const [url, init] = fetchFalso.mock.calls[0] ?? [];
    expect(url).toBe("https://api.mercadopago.com/checkout/preferences");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer TEST-token" });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init?.body)).external_reference).toBe(pago.id);
  });

  it("con MP_API_URL le pega a esa URL en lugar de la API real (demo de la falla)", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    vi.stubEnv("MP_API_URL", "https://10.255.255.1");
    fetchFalso.mockRejectedValueOnce(new DOMException("The operation was aborted due to timeout", "TimeoutError"));

    await expect(crearPreferenciaDePago(pago)).resolves.toBeNull();
    expect(fetchFalso.mock.calls[0]?.[0]).toBe("https://10.255.255.1/checkout/preferences");
  });

  it("Mercado Pago responde 500 → null, no lanza", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    fetchFalso.mockResolvedValueOnce(new Response("error interno", { status: 500 }));

    await expect(crearPreferenciaDePago(pago)).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("timeout o red caída → null, no lanza", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    fetchFalso.mockRejectedValueOnce(new DOMException("The operation was aborted due to timeout", "TimeoutError"));

    await expect(crearPreferenciaDePago(pago)).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("respuesta con otra forma → null (se valida con Zod antes de usarla)", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    fetchFalso.mockResolvedValueOnce(Response.json({ id: "pref-1" }));

    await expect(crearPreferenciaDePago(pago)).resolves.toBeNull();
  });
});

describe("obtenerPagoDeMercadoPago", () => {
  it("consulta /v1/payments/:id con el token y normaliza el id a string", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    fetchFalso.mockResolvedValueOnce(
      Response.json({ id: 123456789, status: "approved", external_reference: pago.id, transaction_amount: 15000 }),
    );

    const resultado = await obtenerPagoDeMercadoPago("123456789");

    expect(resultado).toEqual({ id: "123456789", status: "approved", external_reference: pago.id });
    const [url, init] = fetchFalso.mock.calls[0] ?? [];
    expect(url).toBe("https://api.mercadopago.com/v1/payments/123456789");
    expect(init?.method).toBe("GET");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("sin MP_ACCESS_TOKEN → null y no sale a la red", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "");

    await expect(obtenerPagoDeMercadoPago("123")).resolves.toBeNull();
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("Mercado Pago caído → null, no lanza", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    fetchFalso.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(obtenerPagoDeMercadoPago("123")).resolves.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it("un status que no conocemos → null (se valida con Zod)", async () => {
    vi.stubEnv("MP_ACCESS_TOKEN", "TEST-token");
    fetchFalso.mockResolvedValueOnce(Response.json({ id: 1, status: "otro", external_reference: null }));

    await expect(obtenerPagoDeMercadoPago("1")).resolves.toBeNull();
  });
});
