import { CircleAlert, DoorClosed, DoorOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EstadoVisita } from "@/lib/schemas/_common";

/** El estado de una visita con color, ícono y palabra: nunca solo con color (spec §7). */
export function InsigniaVisita({ estado }: { estado: EstadoVisita }) {
  switch (estado) {
    case "ABIERTA":
      return (
        <Badge>
          <DoorOpen aria-hidden="true" />
          Adentro
        </Badge>
      );
    case "CERRADA":
      return (
        <Badge variant="secondary">
          <DoorClosed aria-hidden="true" />
          Salió
        </Badge>
      );
    case "INCOMPLETA":
      return (
        <Badge variant="outline">
          <CircleAlert aria-hidden="true" />
          Sin salida
        </Badge>
      );
  }
}
