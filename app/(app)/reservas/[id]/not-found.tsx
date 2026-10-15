import { VolverAReservas } from "@/components/volver-a-reservas";

/**
 * El mismo mensaje para "no existe" y "es de otro socio" (clase 6): la
 * pantalla no confirma que el id existe.
 */
export default function ReservaNoEncontrada() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <VolverAReservas />
      <h1 className="mt-6 text-2xl font-bold">No encontramos esa reserva</h1>
      <p className="mt-2 text-muted-foreground">
        Puede que el link esté mal copiado. Revisá tus reservas desde el listado.
      </p>
    </main>
  );
}
