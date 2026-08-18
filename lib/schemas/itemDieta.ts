import { z } from "zod";
import { id, momentoComida } from "./_common";

export const itemDietaSchema = z.object({
  dietaId: id,
  momento: momentoComida,
  descripcion: z.string().min(2).max(300),
  calorias: z.number().int().nonnegative().max(10000),
});
export type ItemDieta = z.infer<typeof itemDietaSchema>;
