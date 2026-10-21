import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoReservas } from "@/components/esqueleto-reservas";
import { ListadoReservas } from "@/components/listado-reservas";
import { SoloSocios } from "@/components/solo-socios";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Mis reservas" };

/**
 * Listado de reservas del socio (clase 8). Server Component: lee la base con
 * la MISMA función que `GET /api/reservas`, sin pasar por la API. La consulta
 * lleva el id de la sesión: nunca se ven reservas de otro socio.
 */
export default async function MisReservas() {
  const usuario = await requerirUsuarioEnPantalla("/reservas");

  return (
    <div>
      <h1 className="text-2xl font-bold">Mis reservas</h1>
      {usuario.rol === "SOCIO" ? (
        <Suspense fallback={<EsqueletoReservas />}>
          <ListadoReservas socioId={usuario.id} />
        </Suspense>
      ) : (
        <div className="mt-6">
          <SoloSocios />
        </div>
      )}
    </div>
  );
}
