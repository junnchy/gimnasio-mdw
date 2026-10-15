"use client";

/**
 * El estado "falló" de las pantallas con sesión (clase 10).
 *
 * Next.js lo muestra cuando una pantalla de (app) lanza una excepción que
 * nadie atrapó: la base no responde, Supabase se pausó, un timeout. Se dibuja
 * dentro del layout, así que la barra sigue ahí y la persona tiene a dónde ir.
 *
 * Por qué es de cliente: "Reintentar" llama a `reset()`, que vuelve a
 * intentar la pantalla sin recargar la página. Para eso tiene que haber
 * JavaScript corriendo en el navegador cuando se aprieta el botón.
 *
 * No muestra el mensaje de la excepción ("connect ECONNREFUSED…"): no le
 * sirve a quien mira y sí a quien quiere saber cómo está armado el sistema.
 * El detalle va a `console.error` y `digest` permite cruzarlo con el log.
 */
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorDePantalla({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Falló una pantalla de (app)", error);
  }, [error]);

  return (
    <Alert variant="destructive">
      <AlertTitle>
        {/* El título de la pantalla: cuando falla, esto es lo único que hay. */}
        <h1>No pudimos cargar esta pantalla</h1>
      </AlertTitle>
      <AlertDescription>
        <p>El problema es del sistema, no de lo que hiciste, y no se perdió ningún dato. Probá de nuevo; si sigue igual, avisá en recepción.</p>
        {error.digest ? (
          <p className="text-xs">
            Código del error: <code>{error.digest}</code>
          </p>
        ) : null}
        <Button variant="outline" onClick={() => reset()}>
          Reintentar
        </Button>
      </AlertDescription>
    </Alert>
  );
}
