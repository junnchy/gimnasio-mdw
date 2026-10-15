import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obtenerUsuario, signIn } from "@/lib/auth";
import { parametrosIngreso, type CodigoErrorIngreso } from "@/lib/schemas/ingreso";

export const metadata: Metadata = { title: "Ingresar" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Qué decirle a la persona según el código que manda Auth.js en `?error=`
 * (ya validado como unión literal en `lib/schemas/ingreso.ts`).
 * `AccessDenied` sale cuando nuestro callback `signIn` rechaza la cuenta
 * (mail de Google sin verificar). El resto se agrupa en un mensaje genérico:
 * el detalle técnico queda en los logs, no en la pantalla.
 */
const MENSAJE_DE_ERROR: Record<CodigoErrorIngreso, string> = {
  AccessDenied: "Esa cuenta de Google no está habilitada para entrar. Probá con otra cuenta o consultá en recepción.",
  Configuration: "No pudimos iniciar sesión. Probá de nuevo en un momento.",
  Verification: "No pudimos iniciar sesión. Probá de nuevo en un momento.",
  Default: "No pudimos iniciar sesión. Probá de nuevo en un momento.",
};

/**
 * /ingresar, la puerta de entrada (clase 10).
 *
 * Reemplaza a la página genérica de Auth.js: la misma acción (entrar con
 * Google), con la marca y en castellano. Las pantallas con sesión mandan acá
 * con `?callbackUrl=` para que, al entrar, la persona vuelva a donde iba.
 */
export default async function Ingresar({ searchParams }: Props) {
  // Entrada externa: se valida con Zod. Un valor raro se ignora, no rompe.
  const resultado = parametrosIngreso.safeParse(await searchParams);
  const { callbackUrl, error } = resultado.success ? resultado.data : {};
  const destino = callbackUrl ?? "/";

  // Con sesión, esta pantalla no tiene nada que ofrecer: un botón de "entrar"
  // que devuelve al mismo lugar donde ya estabas.
  if (await obtenerUsuario()) redirect(destino);

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No pudiste entrar</AlertTitle>
          <AlertDescription>{MENSAJE_DE_ERROR[error]}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl font-bold">Entrá a Pulso</h1>
          </CardTitle>
          <CardDescription>
            Usá tu cuenta de Google. Si es la primera vez, tu cuenta se crea como socio.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/*
            Un <form> con una Server Action y no un botón con onClick: corre en
            el servidor, funciona sin JavaScript y se envía con Enter. Por eso
            esta pantalla no necesita ningún componente de cliente.
          */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: destino });
            }}
          >
            <Button type="submit" size="lg" className="w-full">
              Entrar con Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
