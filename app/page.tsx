/**
 * Home del proyecto.
 *
 * Portada del gimnasio (Server Component). El resto de las pantallas
 * se construye en las clases siguientes según la spec.
 */
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Gimnasio MDW 2026</h1>
      <p className="mt-2 text-sm opacity-70">
        Gestión de socios, cuotas, clases y control de acceso por QR.
      </p>
    </main>
  );
}