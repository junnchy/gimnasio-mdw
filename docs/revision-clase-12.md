# Revisión de clase 12

## Qué revisar
- Ingresar como socio y abrir `/escanear`. Permitir cámara o seleccionar una imagen del QR de prueba. Comprobar ingreso, espera de 60 segundos, salida y duración; probar QR inválido y permiso denegado.
- Abrir `/clases`, elegir una clase con cupo, reservar y comprobar el detalle. Cancelar desde el detalle y comprobar el cupo liberado. Probar membresía vencida y una clase sin cupo.
- Recorrer formularios con Tab y Enter a 375 px. Revisar mensajes, foco, estados pendientes y que no se pierda la selección al fallar.
- Revisar cada Server Action: sesión y rol primero; identificadores autorizados; schemas Zod; casos de uso compartidos; revalidación después de escribir.
- El preview comparte base con producción: no crear, cancelar ni escanear datos allí hasta contar con una base aislada. Luego probar con un teléfono real, con datos móviles. Registrar dispositivo, navegador y lo observado. No dar por probados la cámara real o producción sin evidencia.

## Pruebas automáticas
`npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. Para integración, levantar PostgreSQL local con base `pulso_test`, aplicar migraciones existentes y configurar `TEST_DATABASE_URL` hacia esa base. No usar credenciales ni datos de producción.

**Pendiente:** en la prueba local anterior, cuatro escenarios concurrentes fallaron al iniciar transacciones simultáneas por timeout. La URL local usada era `postgresql://...@localhost:55432/pulso_test` y luego se repitió con `connection_limit=5`. Se agregó `maxWait=10000`, `timeout=15000` y reintento acotado para P2034 o P2028 únicamente si la transacción no llegó a iniciar. No se capturó el código exacto del fallo original. Docker no estuvo disponible para repetir la integración después del ajuste. Falta verificar la configuración del pool de producción: no hubo acceso al equipo de Vercel. No se acredita todavía la concurrencia en despliegue.
