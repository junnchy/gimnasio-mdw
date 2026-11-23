import type { Metadata } from "next";
import Link from "next/link";
import { ProgramarClase } from "@/components/programar-clase";
import { SeccionRestringida } from "@/components/seccion-restringida";
import { requerirUsuarioEnPantalla } from "@/lib/auth";

export const metadata: Metadata = { title: "Programar una clase" };

/**
 * Programar una clase (PROFESOR). La clase queda a nombre de quien la
 * programa: el formulario no pide profesor, lo pone la sesión. No lee datos,
 * así que no tiene estados de carga ni vacío; el error de la operación lo
 * muestra el formulario arriba, y los de cada campo, debajo.
 */
export default async function NuevaClase() {
  const usuario = await requerirUsuarioEnPantalla("/clases/nueva");
  if (usuario.rol !== "PROFESOR") return <SeccionRestringida para="los profesores" />;

  return (
    <div>
      <Link href="/" className="text-sm font-medium underline underline-offset-4">
        Volver a las clases
      </Link>
      <h1 className="mt-4 text-2xl font-bold">Programar una clase</h1>
      <p className="mt-1 mb-6 text-muted-foreground">La clase queda a tu nombre y los socios la pueden reservar desde ese momento.</p>
      <ProgramarClase />
    </div>
  );
}
