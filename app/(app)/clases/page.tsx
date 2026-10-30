import type { Metadata } from "next";
import { Suspense } from "react";
import { ClasesParaReservar } from "@/components/clases-para-reservar";
import { EsqueletoReservas } from "@/components/esqueleto-reservas";
import { SoloSocios } from "@/components/solo-socios";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Reservá una clase" };

export default async function Clases() {
  const usuario = await requerirUsuarioEnPantalla("/clases");
  if (usuario.rol !== "SOCIO") return <SoloSocios />;
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold">Reservá tu próxima clase</h1><p className="mt-2 text-muted-foreground">Elegí el horario que te quede cómodo y asegurá tu lugar.</p></header>
    <Suspense fallback={<EsqueletoReservas />}><ClasesParaReservar socioId={usuario.id} /></Suspense>
  </div>;
}
