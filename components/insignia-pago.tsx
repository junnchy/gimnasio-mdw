import { CircleCheck, CircleX, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EstadoPago } from "@/lib/schemas/_common";

/** El estado de un pago con color, ícono y palabra: nunca solo con color (spec §7). */
export function InsigniaPago({ estado }: { estado: EstadoPago }) {
  switch (estado) {
    case "APROBADO":
      return <Badge><CircleCheck aria-hidden="true" />Aprobado</Badge>;
    case "PENDIENTE":
      return <Badge variant="outline"><Clock aria-hidden="true" />Pendiente</Badge>;
    case "RECHAZADO":
      return <Badge variant="destructive"><CircleX aria-hidden="true" />Rechazado</Badge>;
  }
}
