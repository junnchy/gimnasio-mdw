/**
 * La ruta que publica Auth.js: login, logout y el callback de Google.
 * No se vuelve a tocar; todo lo que hay para decidir está en `lib/auth.ts`.
 *
 * Pública a propósito: es la puerta de entrada.
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
