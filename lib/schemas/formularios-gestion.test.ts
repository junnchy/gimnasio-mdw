// Los formularios de gestión (/clases/nueva y /socios/:id) mandan texto: sus
// schemas convierten y validan con las MISMAS reglas que los de la API.
import { describe, expect, it } from "vitest";
import { programarClaseFormSchema } from "./clase";
import { asignarMembresiaFormSchema } from "./membresia";
import { registrarPagoFormSchema } from "./pago";

const clase = { nombre: "Spinning", cupoMaximo: "20", inicio: "2026-12-01T18:00", duracionMin: "50", sala: "Principal" };

describe("programarClaseFormSchema", () => {
  it("lee la hora en la zona del gimnasio: las 18:00 de Argentina son las 21:00 UTC", () => {
    const r = programarClaseFormSchema.parse(clase);
    expect(r.inicio.toISOString()).toBe("2026-12-01T21:00:00.000Z");
    expect(r).toMatchObject({ cupoMaximo: 20, duracionMin: 50, sala: "Principal" });
  });

  it("una sala vacía es una clase sin sala", () => {
    expect(programarClaseFormSchema.parse({ ...clase, sala: "  " }).sala).toBeUndefined();
  });

  it.each([
    ["cupo cero", { cupoMaximo: "0" }, "cupoMaximo"],
    ["cupo que no es número", { cupoMaximo: "veinte" }, "cupoMaximo"],
    ["duración de más de 8 horas", { duracionMin: "481" }, "duracionMin"],
    ["nombre de una letra", { nombre: " S " }, "nombre"],
    ["fecha sin hora", { inicio: "2026-12-01" }, "inicio"],
    ["fecha imposible", { inicio: "2026-13-45T18:00" }, "inicio"],
  ])("rechaza %s", (_caso, cambio, campo) => {
    const r = programarClaseFormSchema.safeParse({ ...clase, ...cambio });
    expect(r.success).toBe(false);
    expect(r.error?.flatten().fieldErrors).toHaveProperty(campo);
  });

  it("no acepta un profesorId del formulario: lo pone la sesión", () => {
    const r = programarClaseFormSchema.parse({ ...clase, profesorId: "otro-profesor" });
    expect(r).not.toHaveProperty("profesorId");
  });
});

describe("asignarMembresiaFormSchema", () => {
  it("la membresía empieza a las 00:00 de Argentina del día elegido", () => {
    const r = asignarMembresiaFormSchema.parse({ socioId: "s1", planId: "p1", fechaInicio: "2026-12-01" });
    expect(r.fechaInicio.toISOString()).toBe("2026-12-01T03:00:00.000Z");
  });

  it.each([["sin plan", { planId: "" }], ["sin fecha", { fechaInicio: "" }], ["fecha con otro formato", { fechaInicio: "01/12/2026" }]])(
    "rechaza %s",
    (_caso, cambio) => {
      expect(asignarMembresiaFormSchema.safeParse({ socioId: "s1", planId: "p1", fechaInicio: "2026-12-01", ...cambio }).success).toBe(false);
    },
  );
});

describe("registrarPagoFormSchema", () => {
  it("convierte el monto y acepta los dos medios", () => {
    expect(registrarPagoFormSchema.parse({ membresiaId: "m1", monto: "15000.50", medio: "MP" })).toEqual({ membresiaId: "m1", monto: 15000.5, medio: "MP" });
  });

  it.each([["monto negativo", { monto: "-1" }], ["monto con más de dos decimales", { monto: "10.001" }], ["medio inventado", { medio: "CHEQUE" }]])(
    "rechaza %s",
    (_caso, cambio) => {
      expect(registrarPagoFormSchema.safeParse({ membresiaId: "m1", monto: "15000", medio: "EFECTIVO", ...cambio }).success).toBe(false);
    },
  );

  it("el estado del pago no viene del formulario: lo decide el servidor", () => {
    expect(registrarPagoFormSchema.parse({ membresiaId: "m1", monto: "1", medio: "EFECTIVO", estado: "APROBADO" })).not.toHaveProperty("estado");
  });
});
