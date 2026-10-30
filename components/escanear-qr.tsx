"use client";

import { startTransition, useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";
import { registrarEscaneoAction } from "@/app/(app)/escanear/acciones";
import { EstadoFormulario } from "@/components/estado-formulario";
import { Button } from "@/components/ui/button";
import { SIN_ENVIAR } from "@/lib/schemas/formulario";

export function EscanearQr() {
  const [estado, enviar, pendiente] = useActionState(registrarEscaneoAction, SIN_ENVIAR);
  const [activa, setActiva] = useState(false);
  const [preparando, setPreparando] = useState(false);
  const [errorLector, setErrorLector] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const controles = useRef<IScannerControls | null>(null);
  const generacion = useRef(0);
  const enviado = useRef(false);
  const campoId = useId();
  const errorCampo = estado.errores?.qrToken?.join(" ");

  const apagar = useCallback(() => {
    generacion.current++;
    controles.current?.stop();
    controles.current = null;
    const stream = video.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    if (video.current) video.current.srcObject = null;
  }, []);

  useEffect(() => () => apagar(), [apagar]);

  function registrar(token: string) {
    if (enviado.current) return;
    enviado.current = true; // El callback de cámara puede correr varias veces antes del render.
    apagar();
    setActiva(false);
    setPreparando(false);
    const form = new FormData();
    form.set("qrToken", token);
    startTransition(() => enviar(form));
  }

  async function abrirCamara() {
    apagar();
    const turno = generacion.current;
    enviado.current = false;
    setErrorLector("");
    setPreparando(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("SIN_CAMARA");
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      if (turno !== generacion.current || !video.current) return;
      setActiva(true);
      const lector = new BrowserQRCodeReader();
      const control = await lector.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video.current,
        (resultado, _error, controlLectura) => {
          if (turno !== generacion.current) { controlLectura.stop(); return; }
          if (resultado && !enviado.current) {
            controlLectura.stop();
            registrar(resultado.getText());
          }
        });
      // El usuario pudo salir mientras estaba abierto el permiso de cámara.
      if (turno !== generacion.current) { control.stop(); return; }
      controles.current = control;
      setPreparando(false);
    } catch (error) {
      if (turno !== generacion.current) return;
      apagar();
      setActiva(false);
      setPreparando(false);
      setErrorLector(error instanceof DOMException && error.name === "NotAllowedError"
        ? "No tenemos permiso para usar la cámara. Habilitalo en tu navegador o seleccioná una imagen del QR."
        : "No pudimos abrir la cámara. Revisá que esté disponible, usá una conexión HTTPS o seleccioná una imagen del QR.");
    }
  }

  async function leerImagen(archivo: File) {
    apagar();
    setActiva(false);
    setPreparando(true);
    setErrorLector("");
    enviado.current = false;
    const turno = generacion.current;
    const url = URL.createObjectURL(archivo);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const resultado = await new BrowserQRCodeReader().decodeFromImageUrl(url);
      if (turno === generacion.current) registrar(resultado.getText());
    } catch {
      if (turno === generacion.current) setErrorLector("No encontramos un QR legible en esa imagen. Elegí una foto nítida del QR de la puerta.");
    } finally {
      URL.revokeObjectURL(url);
      if (turno === generacion.current) setPreparando(false);
    }
  }

  return (
    <section className="space-y-5" aria-label="Lector de QR" aria-busy={pendiente || preparando}>
      <EstadoFormulario estado={estado} />
      <p className="text-muted-foreground">Apuntá al QR de la puerta. Pulso registra tu ingreso o tu salida según tu visita actual.</p>
      <video ref={video} muted playsInline aria-label="Vista de la cámara para leer el QR"
        className={activa ? "aspect-square w-full rounded-xl border bg-muted object-cover sm:max-w-md" : "hidden"} />
      {activa ? <p role="status">Buscando el QR de la puerta…</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={abrirCamara} disabled={pendiente || preparando || activa} className="min-h-12">
          {pendiente ? "Registrando…" : preparando ? "Preparando lector…" : "Abrir cámara"}
        </Button>
        {activa || preparando ? <Button type="button" variant="outline" className="min-h-12" onClick={() => { apagar(); setActiva(false); setPreparando(false); }}>Detener lector</Button> : null}
      </div>
      <div className="space-y-2">
        <label htmlFor={campoId} className="block font-medium">O seleccioná una imagen del QR</label>
        <input id={campoId} type="file" accept="image/*" disabled={pendiente || preparando}
          aria-invalid={Boolean(errorCampo || errorLector)} aria-describedby={`${campoId}-ayuda${errorCampo ? ` ${campoId}-error` : ""}${errorLector ? ` ${campoId}-lector` : ""}`}
          className="block min-h-12 w-full min-w-0 rounded-lg border border-input p-3 text-base focus-visible:ring-2 focus-visible:ring-ring"
          onChange={(evento) => { const archivo = evento.target.files?.[0]; evento.target.value = ""; if (archivo) void leerImagen(archivo); }} />
        <p id={`${campoId}-ayuda`} className="text-sm text-muted-foreground">La imagen se lee en tu dispositivo. Se envía únicamente el contenido del QR.</p>
        {errorCampo ? <p id={`${campoId}-error`} role="alert" className="text-destructive">{errorCampo}</p> : null}
        {errorLector ? <p id={`${campoId}-lector`} role="alert" className="text-destructive">{errorLector}</p> : null}
      </div>
      <p className="text-sm text-muted-foreground" role="status">{pendiente ? "Registrando el movimiento. Esperá la confirmación." : "Entre dos movimientos tenés que esperar al menos 60 segundos."}</p>
    </section>
  );
}
