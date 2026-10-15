import { CheckCheck, CircleCheck, CircleSlash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EstadoReserva } from "@/lib/schemas/_common";

/**
 * Estado de una reserva con color, ícono y palabra: nunca solo con color
 * (spec §7). Server Component; si lo usa un componente de cliente, viaja con él.
 */
export function InsigniaReserva({ estado, presente }: { estado: EstadoReserva; presente: boolean }) {
  return (
    <span className="flex flex-wrap gap-1">
      {estado === "CONFIRMADA" ? (
        <Badge>
          <CircleCheck aria-hidden="true" />
          Confirmada
        </Badge>
      ) : (
        <Badge variant="outline">
          <CircleSlash aria-hidden="true" />
          Cancelada
        </Badge>
      )}
      {presente && (
        <Badge variant="secondary">
          <CheckCheck aria-hidden="true" />
          Asististe
        </Badge>
      )}
    </span>
  );
}
