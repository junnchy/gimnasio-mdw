/**
 * El pie de las pantallas con sesión (clase 10).
 *
 * No enlaza a /sistema: la galería es una herramienta del equipo y un socio
 * no tiene nada que hacer ahí (decisión del equipo en la review del PR #11).
 * Sigue existiendo y pide sesión; se abre escribiendo la dirección.
 */
export function PieDePagina() {
  return (
    <footer className="border-t py-4 text-xs text-muted-foreground">
      Pulso · TP de Metodologías y Desarrollos Web, UAI Rosario
    </footer>
  );
}
