import type { ReactNode } from "react";

type Props = {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  /** Recibe los atributos que conectan el campo con su ayuda y su error (clase 12). */
  children: (aria: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
};

/** Un campo con su etiqueta, su ayuda y su error debajo, conectados con `aria-describedby`. */
export function CampoFormulario({ id, etiqueta, error, ayuda, children }: Props) {
  const describe = [ayuda ? `${id}-ayuda` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-medium">{etiqueta}</label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describe || undefined })}
      {ayuda ? <p id={`${id}-ayuda`} className="text-sm text-muted-foreground">{ayuda}</p> : null}
      {error ? <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
