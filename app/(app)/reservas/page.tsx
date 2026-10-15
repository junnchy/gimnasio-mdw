import type { Metadata } from "next";
import { Suspense } from "react";
import { EsqueletoReservas } from "@/components/esqueleto-reservas";
import { FiltroReservas } from "@/components/filtro-reservas";
import { SoloSocios } from "@/components/solo-socios";
import { requerirUsuarioEnPantalla } from "@/lib/auth";
import { listarReservasDeSocio } from "@/lib/db/reservas";
import { aFilaReserva } from "@/lib/filaReserva";

export const metadata: Metadata = { title: "Mis reservas" };

/**
 * Listado de reservas del socio (clase 8). Server Component: lee la base con
 * la MISMA función que `GET /api/reservas`, sin pasar por la API. La consulta
 * lleva el id de la sesión: nunca se ven reservas de otro socio.
 */
export default async function MisReservas() {
  const usuario = await requerirUsuarioEnPantalla("/reservas");

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Mis reservas</h1>
      {usuario.rol === "SOCIO" ? (
        <Suspense fallback={<EsqueletoReservas />}>
          <Contenido socioId={usuario.id} />
        </Suspense>
      ) : (
        <div className="mt-6">
          <SoloSocios />
        </div>
      )}
    </main>
  );
}

async function Contenido({ socioId }: { socioId: string }) {
  const reservas = (await listarReservasDeSocio(socioId)).map(aFilaReserva);

  if (reservas.length === 0) {
    return (
      <p className="mt-6 text-muted-foreground">
        Todavía no tenés reservas. Cuando reserves una clase, la vas a ver acá.
      </p>
    );
  }

  return <FiltroReservas reservas={reservas} />;
}
