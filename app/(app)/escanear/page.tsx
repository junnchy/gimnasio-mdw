import type { Metadata } from "next";
import { EscanearQr } from "@/components/EscanearQr";
import { SoloSocios } from "@/components/solo-socios";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Escaneá el QR" };

export default async function Escanear() {
  const usuario = await requerirUsuarioEnPantalla("/escanear");
  if (usuario.rol !== "SOCIO") return <SoloSocios />;
  return <div className="mx-auto max-w-xl space-y-6">
    <header><h1 className="text-2xl font-bold">Escaneá y entrená</h1><p className="mt-2 text-muted-foreground">El mismo QR registra tu entrada y tu salida.</p></header>
    <EscanearQr />
  </div>;
}
