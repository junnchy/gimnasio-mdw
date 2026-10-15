import { CircleAlert, CircleCheck, CircleDashed, CircleSlash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EstadoMembresiaVista } from "@/lib/membresia";

/**
 * El estado de la membresía con color, ícono y palabra: nunca solo con color
 * (spec §7). `null` es el socio que todavía no tiene membresía.
 *
 * VENCIDA no está guardada en la base: la calcula `estadoMembresiaVista`
 * (ADR 0002) antes de llegar acá.
 */
export function InsigniaMembresia({ estado }: { estado: EstadoMembresiaVista | null }) {
  switch (estado) {
    case "ACTIVA":
      return (
        <Badge>
          <CircleCheck aria-hidden="true" />
          Activa
        </Badge>
      );
    case "VENCIDA":
      return (
        <Badge variant="destructive">
          <CircleAlert aria-hidden="true" />
          Vencida
        </Badge>
      );
    case "CANCELADA":
      return (
        <Badge variant="outline">
          <CircleSlash aria-hidden="true" />
          Cancelada
        </Badge>
      );
    case null:
      return (
        <Badge variant="outline">
          <CircleDashed aria-hidden="true" />
          Sin membresía
        </Badge>
      );
  }
}
