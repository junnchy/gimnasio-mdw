import { Logo } from "@/components/logo";

/**
 * Home del proyecto.
 *
 * Portada de Pulso (Server Component). El resto de las pantallas
 * se construye en las clases siguientes según la spec.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1>
        <Logo className="h-10 w-auto" />
      </h1>
      <p className="mt-4 text-muted-foreground">
        El ritmo de tu gimnasio: membresías, clases, rutinas y visitas por QR.
      </p>
      <p className="mt-8 text-sm text-muted-foreground">
        El contrato y las pruebas manuales están en <code>docs/api.md</code> y{" "}
        <code>docs/api.http</code>.
      </p>
    </main>
  );
}
