/**
 * LOS PERMISOS, PROBADOS CONTRA EL SERVIDOR Y NO CONTRA LA PANTALLA.
 *
 * Casi ninguna de estas pruebas abre una página: le pegan directo a la API,
 * como lo haría alguien con `curl`, porque esa es la pregunta: no si el botón
 * está escondido —eso es cortesía, clase 6— sino si el servidor dice que no
 * cuando alguien se saltea la pantalla.
 *
 * ---------------------------------------------------------------------------
 * LA TABLA SALE DEL CONTRATO
 * ---------------------------------------------------------------------------
 * Cada caso es una celda de la "Matriz de permisos" de `docs/api.md` (y de la
 * columna "Rol" de sus tablas), dada vuelta: quién NO puede, y qué tiene que
 * contestar el servidor. Las pruebas no se inventan mirando el código —el
 * código dice lo que hace, no lo que debería hacer— sino mirando el contrato.
 * Un endpoint nuevo entra con su fila acá.
 *
 * Los tres números, que no son intercambiables (clase 6):
 *   401  no sé quién sos
 *   403  sé quién sos, y tu ROL no puede hacer esto
 *   404  para vos, esto no existe — la reserva de otro socio
 */
import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext, type APIResponse } from "@playwright/test";
import { DATOS, SESION, type DatosDePrueba } from "./sesiones";

const datos = (): DatosDePrueba => JSON.parse(readFileSync(DATOS, "utf8"));

type Pedido = (api: APIRequestContext) => Promise<APIResponse>;

/** Bodies válidos en su forma, para que lo que falle sea el permiso y no la validación. */
const PLAN = { nombre: "Plan intruso", precio: 1000, duracionDias: 30 };
const CLASE = {
  nombre: "Clase intrusa",
  cupoMaximo: 5,
  inicio: new Date(Date.now() + 3 * 86_400_000).toISOString(),
  duracionMin: 60,
  sala: "Principal",
};
const ESCANEO = { qrToken: "un-token-cualquiera" };
const RUTINA = { nombre: "Rutina intrusa" };
const ITEM_DE_RUTINA = () => ({ ejercicioId: datos().ejercicioId, series: 3, repeticiones: 10, descansoSeg: 60, orden: 9 });

/**
 * Cada operación de las tablas de `docs/api.md`, por endpoint. Si el contrato
 * suma una ruta, se suma acá y en las listas de abajo.
 *
 * No están, a propósito: `POST /api/pagos/webhook` (lo llama Mercado Pago, sin
 * sesión, por contrato) y `/api/auth/*` (público). El cierre diario tiene sus
 * casos propios, porque se autentica con un secreto y no con una sesión.
 */
const ENDPOINT = {
  listarPlanes: ["GET /api/planes", (api) => api.get("/api/planes")],
  crearPlan: ["POST /api/planes", (api) => api.post("/api/planes", { data: PLAN })],
  corregirPlan: ["PATCH /api/planes/:id", (api) => api.patch(`/api/planes/${datos().planId}`, { data: { precio: 1 } })],
  asignarMembresia: ["POST /api/membresias", (api) => api.post("/api/membresias", { data: {} })],
  registrarPago: ["POST /api/pagos", (api) => api.post("/api/pagos", { data: {} })],
  miMembresia: ["GET /api/membresias/mia", (api) => api.get("/api/membresias/mia")],
  listarClases: ["GET /api/clases", (api) => api.get("/api/clases")],
  verClase: ["GET /api/clases/:id", (api) => api.get(`/api/clases/${datos().claseId}`)],
  programarClase: ["POST /api/clases", (api) => api.post("/api/clases", { data: CLASE })],
  corregirClase: ["PATCH /api/clases/:id", (api) => api.patch(`/api/clases/${datos().claseId}`, { data: { sala: "Otra" } })],
  misReservas: ["GET /api/reservas", (api) => api.get("/api/reservas")],
  reservar: ["POST /api/reservas", (api) => api.post("/api/reservas", { data: { claseId: datos().claseId } })],
  cancelar: ["POST /api/reservas/:id/cancelacion", (api) => api.post(`/api/reservas/${datos().reservaId}/cancelacion`)],
  marcarAsistencia: ["POST /api/reservas/:id/asistencia", (api) => api.post(`/api/reservas/${datos().reservaId}/asistencia`)],
  misVisitas: ["GET /api/visitas", (api) => api.get("/api/visitas")],
  escanear: ["POST /api/visitas/escaneos", (api) => api.post("/api/visitas/escaneos", { data: ESCANEO })],
  misRutinas: ["GET /api/rutinas/mia", (api) => api.get("/api/rutinas/mia")],
  crearRutina: ["POST /api/rutinas", (api) => api.post("/api/rutinas", { data: {} })],
  corregirRutina: ["PATCH /api/rutinas/:id", (api) => api.patch(`/api/rutinas/${datos().rutinaId}`, { data: RUTINA })],
  agregarARutina: [
    "POST /api/rutinas/:id/ejercicios",
    (api) => api.post(`/api/rutinas/${datos().rutinaId}/ejercicios`, { data: ITEM_DE_RUTINA() }),
  ],
  verEjercicios: ["GET /api/ejercicios", (api) => api.get("/api/ejercicios")],
  agregarEjercicio: ["POST /api/ejercicios", (api) => api.post("/api/ejercicios", { data: {} })],
} satisfies Record<string, [string, Pedido]>;

type Endpoint = keyof typeof ENDPOINT;

/** Un `test` por endpoint, con el status que el contrato le exige a ese rol. */
function noPuede(endpoints: Endpoint[], status: 401 | 403) {
  for (const clave of endpoints) {
    const [nombre, pedir] = ENDPOINT[clave];
    test(nombre, async ({ request }) => {
      expect((await pedir(request)).status()).toBe(status);
    });
  }
}

test.describe("sin sesión: 401", () => {
  // Todas las filas de la matriz: la columna "Sin sesión" dice 401 en todas.
  noPuede(Object.keys(ENDPOINT) as Endpoint[], 401);

  test("GET /api/visitas/cierre-diario sin el secreto del cron", async ({ request }) => {
    expect((await request.get("/api/visitas/cierre-diario")).status()).toBe(401);
  });

  test("GET /api/visitas/cierre-diario con un secreto equivocado", async ({ request }) => {
    const respuesta = await request.get("/api/visitas/cierre-diario", {
      headers: { authorization: "Bearer no-es-el-secreto" },
    });
    expect(respuesta.status()).toBe(401);
  });
});

test.describe("el rol equivocado: 403", () => {
  test.describe("un socio", () => {
    test.use({ storageState: SESION.socio });
    // Planes, membresías y pagos son de Admin; clases, rutinas, ejercicios y
    // asistencia, de Profesor. Aunque la reserva sea suya, no se marca presente.
    noPuede(
      ["listarPlanes", "crearPlan", "corregirPlan", "asignarMembresia", "registrarPago", "programarClase",
        "corregirClase", "marcarAsistencia", "crearRutina", "corregirRutina", "agregarARutina",
        "verEjercicios", "agregarEjercicio"],
      403,
    );
  });

  test.describe("un profesor", () => {
    test.use({ storageState: SESION.profesor });
    // Lo "propio" del socio (membresía, reservas, visitas, rutinas) no es
    // del profesor, y el dinero es de Admin.
    noPuede(
      ["listarPlanes", "crearPlan", "corregirPlan", "asignarMembresia", "registrarPago", "miMembresia",
        "misReservas", "reservar", "cancelar", "misVisitas", "escanear", "misRutinas"],
      403,
    );
  });

  test.describe("un admin", () => {
    test.use({ storageState: SESION.admin });
    // Admin administra: no programa clases ni escanea la puerta.
    noPuede(
      ["miMembresia", "programarClase", "corregirClase", "misReservas", "reservar", "cancelar",
        "marcarAsistencia", "misVisitas", "escanear", "misRutinas", "crearRutina", "corregirRutina",
        "agregarARutina", "verEjercicios", "agregarEjercicio"],
      403,
    );
  });

  test.describe("una profesora que no dicta la clase", () => {
    test.use({ storageState: SESION.otroProfesor });

    // Matriz: "Marcar asistencia — ✓ de sus clases (403 si la clase es de otro)".
    test("no marca asistencia en la clase de otro profesor", async ({ request }) => {
      const respuesta = await request.post(`/api/reservas/${datos().reservaId}/asistencia`);
      expect(respuesta.status()).toBe(403);
    });
  });
});

test.describe("lo ajeno no existe: 404", () => {
  test.describe("otro socio", () => {
    test.use({ storageState: SESION.otroSocio });

    // La reserva es de Lucía. Para otro socio no es "prohibida": no existe.
    // Un 403 le confirmaría que hay una reserva con ese id.
    test("no cancela la reserva de otro socio", async ({ request }) => {
      const respuesta = await request.post(`/api/reservas/${datos().reservaId}/cancelacion`);
      expect(respuesta.status()).toBe(404);
    });

    test("y la pantalla dice lo mismo que la API", async ({ page }) => {
      await page.goto(`/reservas/${datos().reservaId}`);
      await expect(page.getByRole("heading", { name: "No encontramos esa reserva" })).toBeVisible();
    });
  });

  test.describe("una profesora que no dicta la clase", () => {
    test.use({ storageState: SESION.otroProfesor });

    // Matriz: "Corregir clase — ✓ propias". La de otro, como si no existiera.
    test("no corrige la clase de otro profesor", async ({ request }) => {
      const respuesta = await request.patch(`/api/clases/${datos().claseId}`, { data: { sala: "Otra" } });
      expect(respuesta.status()).toBe(404);
    });

    // Mapa de pantallas: /clases/:id — "PROFESOR (solo las que dicta; la de otro, 404)".
    test("no ve los inscriptos de la clase de otro profesor", async ({ page }) => {
      await page.goto(`/clases/${datos().claseId}`);
      await expect(page.getByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    });

    // Matriz: "Corregir rutina, agregarle ejercicios — ✓ propias".
    test("no corrige la rutina de otro profesor", async ({ request }) => {
      const respuesta = await request.patch(`/api/rutinas/${datos().rutinaId}`, { data: RUTINA });
      expect(respuesta.status()).toBe(404);
    });

    test("no le agrega ejercicios a la rutina de otro profesor", async ({ request }) => {
      const respuesta = await request.post(`/api/rutinas/${datos().rutinaId}/ejercicios`, { data: ITEM_DE_RUTINA() });
      expect(respuesta.status()).toBe(404);
    });
  });

  // El control: el mismo pedido, de quien sí es dueño, no da 404. Sin esto, los
  // 404 de arriba pasarían igual si el id estuviera mal o la fila no existiera.
  test.describe("el profesor que sí la dicta", () => {
    test.use({ storageState: SESION.profesor });

    test("encuentra su clase y la corrige", async ({ request }) => {
      const respuesta = await request.patch(`/api/clases/${datos().claseId}`, { data: { sala: "Principal" } });
      expect(respuesta.status()).toBe(200);
    });

    test("encuentra su rutina y la corrige", async ({ request }) => {
      const respuesta = await request.patch(`/api/rutinas/${datos().rutinaId}`, { data: { nombre: "Rutina E2E" } });
      expect(respuesta.status()).toBe(200);
    });
  });
});
