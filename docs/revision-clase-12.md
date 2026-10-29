# Revisión de clase 12

## Qué revisar
- Ingresar como socio y abrir `/escanear`. Permitir cámara o seleccionar una imagen del QR de prueba. Comprobar ingreso, espera de 60 segundos, salida y duración; probar QR inválido y permiso denegado.
- Abrir `/clases`, elegir una clase con cupo, reservar y comprobar el detalle. Cancelar desde el detalle y comprobar el cupo liberado. Probar membresía vencida y una clase sin cupo.
- Recorrer formularios con Tab y Enter a 375 px. Revisar mensajes, foco, estados pendientes y que no se pierda la selección al fallar.
- Revisar cada Server Action: sesión y rol primero; identificadores autorizados; schemas Zod; casos de uso compartidos; revalidación después de escribir.
- Probar preview con datos aislados y un teléfono real, con datos móviles. Registrar dispositivo, navegador y lo observado. No dar por probados la cámara real o producción sin evidencia.

## Pruebas automáticas
`npm run lint`, `npm run typecheck`, `npm test` y `npm run build`. Para integración, levantar PostgreSQL local con base `pulso_test`, aplicar migraciones existentes y configurar `TEST_DATABASE_URL` hacia esa base. No usar credenciales ni datos de producción.

**Pendiente:** en la prueba local, cuatro escenarios concurrentes fallaron al iniciar una transacción simultánea por timeout de Prisma. Investigar antes de aprobar: todavía no se acredita que las garantías de concurrencia funcionen en el entorno de despliegue. Las pruebas restantes de integración pasaron.
