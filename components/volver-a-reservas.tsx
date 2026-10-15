import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function VolverAReservas() {
  return (
    <Link href="/reservas" className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline">
      <ArrowLeft aria-hidden="true" className="size-4" />
      Mis reservas
    </Link>
  );
}
