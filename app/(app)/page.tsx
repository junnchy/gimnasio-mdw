import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoInicio } from "@/components/esqueleto-inicio";
import { PanelClases } from "@/components/panel-clases";
import { PanelSocio } from "@/components/panel-socio";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Inicio" };

/**
 * El inicio: "lo que te corresponde" según el rol (clase 10, mapa de
 * pantallas). Es la pantalla principal y resuelve sus cinco estados:
 *
 *   cargando        <Suspense> con EsqueletoInicio (no loading.tsx: ver ahí por qué)
 *   con datos       PanelSocio / PanelClases
 *   vacío           <SinDatos>, lo decide el servidor
 *   sin resultados  FiltroReservas / FiltroClases, los únicos que saben qué filtro se eligió
 *   error           app/(app)/error.tsx, con "Reintentar"
 *
 * Como toda página de (app), verifica la sesión ella misma y antes del
 * <Suspense>: sin sesión, 307 a /ingresar?callbackUrl=/.
 */
export default async function Inicio() {
  const usuario = await requerirUsuarioEnPantalla("/");
  const nombre = usuario.nombre.includes("@") ? usuario.nombre : usuario.nombre.split(" ")[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold break-words">Hola, {nombre}</h1>
        <p className="mt-1 text-muted-foreground">
          {usuario.rol === "SOCIO" ? "Tu membresía y tus reservas." : "Las próximas clases del gimnasio."}
        </p>
      </div>

      <Suspense fallback={<EsqueletoInicio />}>
        {usuario.rol === "SOCIO" ? (
          <PanelSocio socioId={usuario.id} />
        ) : (
          <PanelClases usuarioId={usuario.id} esProfesor={usuario.rol === "PROFESOR"} />
        )}
      </Suspense>
    </div>
  );
}
