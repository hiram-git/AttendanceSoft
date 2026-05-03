# AttendanceSoft Mobile

Aplicación móvil para clientes (Capacitor 7 + TanStack Router SPA).
Reusa los componentes y rutas del portal del proyecto web — los archivos
en `src/routes/` son thin wrappers que reasignan el `Route` de
`../../src/routes/portal*.tsx`.

Las rutas que se incluyen son **solo las del cliente**:

- `/` → redirect a `/portal`
- `/login`, `/forgot-password`, `/reset-password`
- `/portal` (home)
- `/portal/book` (wizard de reserva)
- `/portal/appointments` (historial + cancelar)
- `/portal/profile` (perfil + cambio de contraseña)
- `/portal/signup` (registro abierto)
- `/portal/invite/$token` (aceptar invitación)

Quedan **fuera**: el landing, todo `/backoffice/*` y `/dashboard`.

## Setup local

```bash
cp mobile/.env.example mobile/.env.local
bun install                # instala el workspace
bun run mobile:dev         # SPA en http://localhost:3100 (browser)
```

El servidor API debe estar corriendo (`bun run dev:api` desde la raíz)
para que `PUBLIC_API_URL=http://localhost:3001` funcione.

## Construir el bundle estático

```bash
bun run mobile:build       # genera mobile/dist/
```

Este `dist/` es lo que Capacitor empaqueta dentro de la app nativa.

## Agregar las plataformas nativas

Requiere toolchain local (Xcode en macOS, Android Studio + JDK):

```bash
cd mobile
bunx cap add ios
bunx cap add android
```

Esto crea las carpetas `mobile/ios/` y `mobile/android/` con los
proyectos Xcode/Gradle. Quedan **gitignored** — cada dev las regenera.

## Sincronizar el bundle con los nativos

Cada vez que rebuilds la SPA hay que copiar el `dist/` al proyecto nativo:

```bash
bun run mobile:build
bun run mobile:sync        # equivale a `cd mobile && cap sync`
```

## Correr en el dispositivo / simulador

```bash
bun --cwd mobile run ios:run        # iOS simulator
bun --cwd mobile run android:run    # Android emulator
# o abrir el IDE para hacer Run desde ahí:
bun --cwd mobile run ios:open
bun --cwd mobile run android:open
```

## Apuntar al API correcto

| Entorno | `PUBLIC_API_URL` |
|---|---|
| iOS simulator | `http://localhost:3001` |
| Android emulator | `http://10.0.2.2:3001` |
| Dispositivo físico (LAN) | `http://192.168.x.y:3001` |
| Producción | `https://api.attendancesoft.com` |

## Iconos y splash

Los placeholders viven en `mobile/resources/icon.svg` y
`mobile/resources/splash.svg`. Para regenerar todos los tamaños
nativos:

```bash
# Reemplaza los SVG (o agrega icon.png 1024×1024 / splash.png 2732×2732)
bun --cwd mobile run assets
```

`@capacitor/assets` escribe los PNG por plataforma dentro de
`mobile/ios/App/...` y `mobile/android/app/src/main/...`. Después corre
`cap sync` para que el proyecto nativo recoja los cambios.

## Deep links

La app responde al esquema personalizado `attendancesoft://`. Útil para
las invitaciones del backoffice:

```
attendancesoft://invite/<token>   →   /portal/invite/<token>
```

Para probar en simulador iOS:

```bash
xcrun simctl openurl booted "attendancesoft://invite/abc123"
```

En Android emulator:

```bash
adb shell am start -W -a android.intent.action.VIEW -d "attendancesoft://invite/abc123" mx.attendancesoft.app
```

Universal links (HTTPS) quedan para cuando haya dominio confirmado.

## Notificaciones

- **Local**: cada vez que un cliente reserva, la app programa una
  notificación 1h antes de la cita. Funciona offline. La permission
  prompt aparece la primera vez.
- **Push**: la app registra el token APN/FCM contra
  `POST /api/portal/devices` en cada cold start. El envío real
  (Firebase Admin / APN keys) queda como follow-up — primero hay que
  configurar el proyecto de Firebase y subir las APN keys a Capacitor.

## Pendientes

- Sending side de push notifications (FCM + APN credenciales).
- Add-to-calendar nativo.
- Biometric login opt-in.
- Universal / App Links contra el dominio definitivo.
- Pipeline de build (TestFlight + Play Internal).
