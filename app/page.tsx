export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Gimnasio MDW 2026</h1>
      <p className="mt-2 text-sm opacity-70">
        API del sistema de gestión de socios, clases, membresías y visitas.
      </p>
      <p className="mt-8 text-sm opacity-70">
        El contrato y las pruebas manuales están en <code>docs/api.md</code> y{" "}
        <code>docs/api.http</code>.
      </p>
    </main>
  );
}
