/**
 * EL FLUJO PRINCIPAL, DE PUNTA A PUNTA: la sección 5 de `docs/spec.md`
 * (registro de visita por QR), recorrida por un navegador.
 *
 * Es UNA prueba larga y no seis cortas, a propósito. Lo que se quiere saber
 * no es si /escanear anda sola —eso se ve al abrirla— sino si el recorrido
 * entero se puede hacer: que el ingreso que registra la socia le aparezca a
 * recepción, que el mismo QR después la haga salir con su duración. Los
 * errores que importan están en las costuras entre pantallas.
 *
 * Cada `test.step` es un paso de la spec. Si falla, el reporte dice cuál.
 * El paso 5 (cierre diario, H3) no tiene pantalla: lo prueban
 * `app/api/visitas/cierre-diario/route.test.ts` y la integración.
 *
 * ---------------------------------------------------------------------------
 * CÓMO BUSCA LAS COSAS: COMO UNA PERSONA
 * ---------------------------------------------------------------------------
 * `getByLabel("O seleccioná una imagen del QR")`, `getByRole("status")`.
 * Nunca un `#id` generado ni una clase de Tailwind. Si la prueba encuentra el
 * campo por su etiqueta, un lector de pantalla también. Y cambiar el diseño
 * no rompe la prueba; cambiar lo que la pantalla DICE, sí.
 */
import { PrismaClient } from "@prisma/client";
import { expect, test, type Page } from "@playwright/test";
import { PERSONAS, QR_DE_LA_PUERTA, SESION } from "./sesiones";

/** Paso 1: la persona elige la imagen del QR de la puerta (el navegador de CI no tiene cámara). */
async function escanear(pagina: Page) {
  await pagina.goto("/escanear");
  await pagina.getByLabel("O seleccioná una imagen del QR").setInputFiles(QR_DE_LA_PUERTA);
}

test("el flujo principal se recorre entero desde la interfaz", async ({ browser }) => {
  // Tres navegadores, tres personas, cada una con su sesión.
  const abrir = async (sesion: string) => (await browser.newContext({ storageState: sesion })).newPage();
  const socia = await abrir(SESION.socio);
  const vencido = await abrir(SESION.socioVencido);
  const recepcion = await abrir(SESION.admin);

  const nombre = PERSONAS.socio.nombre;
  const filaDeLaSocia = (seccion: string) =>
    recepcion.getByRole("region", { name: seccion }).getByRole("listitem").filter({ hasText: nombre }).first();

  await test.step("1 a 3. la socia escanea el QR de la puerta y queda registrado su ingreso", async () => {
    await escanear(socia);
    await expect(socia.getByRole("status").filter({ hasText: "Ingreso registrado" })).toBeVisible();
    await expect(socia.getByText("¡Buen entrenamiento!")).toBeVisible();
  });

  await test.step("H2 (error). un segundo escaneo enseguida se rechaza y dice qué hacer", async () => {
    // El doble escaneo de alguien apurado: antes de los 60 segundos no es
    // una salida, es un error, y la pantalla lo explica.
    await escanear(socia);
    await expect(socia.getByRole("alert").filter({ hasText: "No pudimos completar la operación" }))
      .toContainText("Escaneo repetido: esperá unos segundos.");
  });

  await test.step("2 (error). un socio con la membresía vencida no puede entrar", async () => {
    await escanear(vencido);
    await expect(vencido.getByRole("alert").filter({ hasText: "No pudimos completar la operación" }))
      .toContainText("Membresía vencida: no se puede registrar el ingreso.");
  });

  await test.step("6. recepción ve a la socia adentro", async () => {
    await recepcion.goto("/visitas");
    await expect(filaDeLaSocia("Adentro ahora")).toContainText("Adentro");
  });

  await test.step("4. pasado el minuto, el mismo QR registra la salida con la duración", async () => {
    // El reloj del servidor no se puede adelantar desde el navegador, y una
    // prueba no espera un minuto entero: se corre el ingreso dos minutos
    // atrás EN LA BASE DE PRUEBAS. La app no sabe nada de esto.
    const prisma = new PrismaClient();
    try {
      const visita = await prisma.visita.findFirstOrThrow({
        where: { estado: "ABIERTA", socio: { email: PERSONAS.socio.email } },
      });
      await prisma.visita.update({
        where: { id: visita.id },
        data: { ingresoAt: new Date(visita.ingresoAt.getTime() - 2 * 60_000) },
      });
    } finally {
      await prisma.$disconnect();
    }

    await escanear(socia);
    await expect(socia.getByRole("status").filter({ hasText: "Salida registrada" })).toContainText(
      "Estuviste 2 minutos.",
    );
  });

  await test.step("6 (después). recepción ya no la ve adentro y ve su salida en los movimientos", async () => {
    await recepcion.goto("/visitas");
    await expect(filaDeLaSocia("Últimos movimientos")).toContainText("Salió");
    await expect(
      recepcion.getByRole("region", { name: "Adentro ahora" }).getByText(nombre),
    ).toHaveCount(0);
  });
});
