# AGENTE.md — Contexto obligatorio antes de tocar FILO
> **Leé este archivo completo antes de escribir una sola línea de código.**
> Fue generado después de múltiples auditorías. Contiene decisiones tomadas, bugs conocidos, y convenciones que no son obvias leyendo el código solo.

---

## 1. QUÉ ES ESTE PROYECTO

**FILO (ReservasPro)** — SaaS multi-tenant de reservas para peluquerías/barberías.

Stack:
- **Next.js 16** (App Router) — monorepo con `apps/web` y `packages/`
- **Supabase** (PostgreSQL) — todas las tablas custom del negocio
- **Better Auth** — autenticación admin vía Prisma (tabla `user`, `member`, `organization`)
- **Resend** — emails transaccionales
- **Stripe** — suscripciones (planes: `trial`, `normal`, `pro`)

Separación crítica:
- **Rutas `/api/public/*`** → sin auth, accesibles por clientes finales del negocio
- **Rutas `/api/reservas/*`, `/api/business-config/*`, `/api/loyalty/*`, `/api/clients/*`** → requieren sesión admin autenticada

---

## 2. ESTADO ACTUAL — commit 816cb937

### ✅ RESUELTO (no tocar sin buena razón)

| Qué | Dónde | Cómo quedó |
|---|---|---|
| Conflictos git en `page.tsx` | `(public)/reservas/[slug]/page.tsx` | Resuelto, sin markers |
| Auth en rutas admin | `business-config`, `loyalty/levels`, `clients`, `blocked-slots`, `complete` | `verifyOwnership()` con Better Auth |
| `bookingId` en emails | `book/route.ts`, `cron/booking-reminders` | Incluido, links funcionan |
| PostgREST joins sin FK | `mis-reservas/route.ts` | Reemplazado por queries paralelas + Map |
| N+1 en cron | `cron/booking-reminders/route.ts` | Batch pre-loop con `orgIds/serviceIds/profIds` |
| Loyalty levels no atómico | `loyalty/levels/[organizationId]/route.ts` | Delete selectivo + upsert |
| XP doble en complete | `reservas/[bookingId]/complete/route.ts` | Guard `if (!existingXp)` antes del update |
| `client_profile_id` null en bookings | `book/route.ts` | Extraído del body e insertado |
| Nivel fidelidad siempre "Bronce" | `fidelidad/[bookingId]/route.ts` | Itera DESC sin columna `max_xp` |
| `plan` en checkout frágil | `checkout/route.ts` | Mapa explícito por env var |
| `min_advance_hours` ignorado | `page.tsx` | `isWithinMinHours()` implementado |
| BUG-1 timezone fee cancelación | `public/booking/.../cancel/route.ts` | `fromZonedTime` (`date-fns-tz`), export `appointmentInstantUtc`; verificación `apps/web/scripts/verify-cancel-tz.mjs` |
| BUG-2 email reprogramación | `public/booking/.../reprogramar/route.ts` + `booking-emails.ts` | `sendRescheduleEmail` (asunto y cuerpo “reprogramada”, antes/después) |
| BUG-3 doble fetch service | `reservas/.../complete/route.ts` | Un solo `select` servicio → `serviceName` + XP |
| DEUDA-4 logs públicos | `public/reservas/[slug]/route.ts` | Eliminados `console.log` de debug por slug/org |
| Rate limit POST book | `public/reservas/[slug]/book/route.ts` + `lib/rate-limit-memory.ts` | 30 req / 60s por IP+slug (memoria por proceso; ver nota Nivel 2) |
| Trial enforcement book | `public/reservas/[slug]/book/route.ts` | Si `plan === 'trial'` y `trial_ends_at` ya pasó → 403 |
| Cron Vercel | `vercel.json` (raíz) + `apps/web/vercel.json` | `crons`: GET diario `0 9 * * *` → `/api/cron/booking-reminders` (el route ya delega GET→POST) |
| Validación inputs públicos | `book`, `reprogramar`, `cancel` | Zod en body/query donde aplica |
| Admin listado + cancel emails | `packages/api/.../procedures/index.ts` | `listBookings`: `sortBy` acotado regex, `search` saneado, `countQuery` reasignado correctamente; `deleteBookings`: `maybeSingle`, nombres servicio/pro + `bookingId`/datos en emails |

### 🔴 PENDIENTE — ESTO ES LO QUE FALTA HACER

_(Nivel 1 BUG-1 a DEUDA-4: resuelto. Ver tabla arriba y sección “Nivel 2” abajo.)_

#### INFRA-5 (CRÍTICO, requiere acción del usuario, no del agente):
- **SQL Migration**: `sql-fix-all-reservas.sql` debe ejecutarse en Supabase SQL Editor. Sin esto, columnas como `reschedule_count`, `cancellation_fee_applied`, `blocked_slots`, `client_profile_id` en bookings NO EXISTEN en la DB y las rutas que las usan van a fallar silenciosamente.
- **Stripe Webhook**: Conectar en Stripe Dashboard → `https://codetix.es/api/webhooks/stripe` con estos 5 eventos: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`. Variable env `STRIPE_WEBHOOK_SECRET` requerida. El cron de Vercel debe llamar al route con **GET** (configurado); el handler exige `Authorization: Bearer <CRON_SECRET>`, header `x-cron-secret` o query `?secret=` — configurar en Vercel el secreto acorde a tu despliegue.

### Nivel 2 — Auditoría e implementación (2026-05-10)

| Tema | Estado previo | Acción |
|------|----------------|--------|
| **Rate limiting en `POST …/book`** | No existía | **Implementado:** `lib/rate-limit-memory.ts`, 30 req/min por `IP + slug`. **Límite:** solo por proceso Node; con muchas réplicas frías no es global → para hard cap usar Upstash/KV. |
| **Trial enforcement** | No existía en `book` | **Implementado:** si `business_config.plan === 'trial'` y `trial_ends_at` es fecha pasada → 403. Requiere columnas en DB (INFRA-5 / `sql-fix-all-reservas.sql`). |
| **Cron en `vercel.json`** | No había entrada `crons` | **Implementado:** `vercel.json` (raíz) y `apps/web/vercel.json` con `path: /api/cron/booking-reminders`, `schedule: "0 9 * * *"` (UTC). Ajustar hora si querés otro disparo diario. |
| **Validación de inputs** | `book` solo validaba presencia; reprogramar/cancel mínimo | **Implementado:** Zod en `book`, `reprogramar` (POST + email GET), `cancel` (POST). Horas `HH:MM` validadas donde aplica. |
| **Admin listado / cancelación bookings** | `listBookings` ya filtraba por `organization_id` activo; **bug:** `countQuery.or(...)` no se reasignaba (filtros de búsqueda no aplicaban al total). `deleteBookings` ya hacía soft cancel + org scope; emails con fallbacks genéricos | **Arreglado/mejorado:** `countQuery` como `let` + misma búsqueda saneada; `deleteBookings` con `maybeSingle`, fetch paralelo de servicio/profesional, `bookingId` y datos de negocio en emails de cancelación y notificación al salón. |

#### NOTA STRIPE-SDK (código — build / paquete `stripe` v19, Cursor)

**Autoría:** Estos cambios los aplicó el **asistente en Cursor** al pasar `pnpm build` con el SDK npm `stripe` v19 y la API tipada **Clover** (`2025-10-29.clover`). **No** consta que Kimi u otro agente hubiera editado estos archivos; el pie de este doc solo cita a Kimi en la **redacción de AGENTE.md**.

**Archivos tocados:** `apps/web/app/api/webhooks/stripe/route.ts`, `apps/web/app/api/checkout/route.ts`.

| Cambio | Detalle |
|--------|---------|
| `apiVersion` | En **webhook** y **checkout**, el string pasado a `new Stripe(...)` pasó de `"2025-02-24.acacia"` a **`"2025-10-29.clover"`** para coincidir con el literal que exige TypeScript del paquete instalado. Sin esto el build fallaba. |
| Evento `customer.subscription.canceled` | Se **eliminó** el `case` que compartía bloque con `customer.subscription.deleted`. En el union actual de `Stripe.Event['type']` ese nombre **no existe** y rompía compilación. La cancelación en código queda solo bajo **`customer.subscription.deleted`**. El Dashboard debe seguir usando ese evento (alineado con INFRA-5), no depender de un handler para `*.canceled`. |
| Facturas `invoice.payment_*` | El tipo `Stripe.Invoice` ya **no** expone `invoice.subscription`. Se añadió **`getSubscriptionIdFromInvoice(invoice)`**: si `invoice.parent?.type === "subscription_details"`, toma el id desde `parent.subscription_details.subscription` (string o objeto expandido). `handleInvoicePaymentSucceeded` y `handleInvoicePaymentFailed` usan eso en lugar de `invoice.subscription`. |

**Riesgos / comportamiento:** Si Stripe enviara una factura de suscripción sin `parent` en la forma esperada por Clover, el helper devuelve `null` y el handler sale sin actualizar `Purchase` (sin throw). Revisar logs `[Stripe Webhook]` si en producción faltan transiciones `active` / `past_due` tras pago de factura.

---

## 3. ARQUITECTURA — DECISIONES NO OBVIAS

### Supabase: joins PostgREST están PROHIBIDOS sin FK declaradas
PostgREST (`service:services(name)`) devuelve `null` silenciosamente si no hay FK en el schema de Supabase. **Siempre usar queries explícitas paralelas:**

```ts
// ❌ MAL — puede devolver null sin error
const { data } = await supabase
  .from("bookings")
  .select("id, service:services(name), professional:professionals(name)");

// ✅ BIEN — siempre funciona
const [{ data: service }, { data: professional }] = await Promise.all([
  supabase.from("services").select("name").eq("id", serviceId).maybeSingle(),
  supabase.from("professionals").select("name").eq("id", professionalId).maybeSingle(),
]);
```

### Rutas admin requieren `verifyOwnership()` SIEMPRE
Patrón en `business-config/route.ts`, `loyalty/levels/route.ts`, `blocked-slots/route.ts`:

```ts
import { auth } from "@repo/auth";

async function verifyOwnership(request: NextRequest, organizationId: string) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { error: "No autorizado", status: 401 };
  const { data: membership } = await supabase
    .from("member").select("id")
    .eq("userId", session.user.id)
    .eq("organizationId", organizationId)
    .maybeSingle();
  if (!membership) return { error: "Acceso denegado", status: 403 };
  return null;
}
```

### XP idempotencia — siempre verificar antes de otorgar
```ts
const { data: existingXp } = await supabase
  .from("xp_history").select("id").eq("booking_id", bookingId).maybeSingle();
if (!existingXp) {
  // recién acá actualizar client_profiles y insertar xp_history
}
```

### blocked_slots — semántica de NULL
- `start_time IS NULL AND end_time IS NULL` → bloqueo de **día completo** (usado en calendario)
- `start_time IS NOT NULL AND end_time IS NOT NULL` → bloqueo **parcial horario** (usado en slots)
- `professional_id IS NULL` → bloquea **todos** los profesionales

### Emails — `bookingId` es OBLIGATORIO
Sin `bookingId`, los links de cancelar/reprogramar en todos los emails quedan como `null`. Siempre pasar `bookingId: booking.id`.

### Plan de suscripción — nunca modificar desde rutas normales
El plan solo se puede cambiar vía Stripe webhook (`api/webhooks/stripe/route.ts`) o internamente. `business-config/route.ts` tiene guardia explícita para rechazar plan `normal`/`pro` en POST.

---

## 4. MAPA DE ARCHIVOS CRÍTICOS

```
apps/web/
├── app/
│   ├── (public)/reservas/[slug]/
│   │   ├── page.tsx                        ← UI pública de reservas (cliente final)
│   │   └── components/
│   │       ├── AuthModal.tsx               ← Login/registro de client_profiles
│   │       └── ClientProfile.tsx           ← Portal de fidelización
│   └── api/
│       ├── public/
│       │   ├── reservas/[slug]/
│       │   │   ├── route.ts                ← GET business data (services, professionals, working_hours, blockedDates)
│       │   │   ├── slots/route.ts          ← GET occupied slots + blocked partial slots
│       │   │   └── book/route.ts           ← POST crear reserva (zod, rate limit, trial)
│       │   ├── booking/[bookingId]/
│       │   │   ├── cancel/route.ts         ← POST cancelar (zod, fee con `fromZonedTime`)
│       │   │   └── reprogramar/route.ts    ← GET/POST reprogramar (zod, `sendRescheduleEmail`)
│       │   ├── fidelidad/[bookingId]/route.ts  ← GET portal fidelización cliente
│       │   ├── mis-reservas/route.ts       ← GET reservas del cliente por email
│       │   └── auth/
│       │       ├── login/route.ts
│       │       └── register/route.ts
│       ├── reservas/
│       │   ├── [bookingId]/complete/route.ts   ← POST marcar completada + XP
│       │   └── blocked-slots/route.ts          ← CRUD bloqueo de fechas/horarios
│       ├── loyalty/levels/[organizationId]/route.ts   ← GET/POST niveles XP
│       ├── business-config/[organizationId]/route.ts  ← GET/POST config del negocio
│       ├── clients/[organizationId]/route.ts          ← GET lista de clientes
│       ├── cron/booking-reminders/route.ts            ← POST cron 24h antes (protegido por CRON_SECRET)
│       ├── checkout/route.ts                          ← POST crear sesión Stripe
│       └── webhooks/stripe/route.ts                  ← POST webhook Stripe
└── lib/
    ├── email/booking-emails.ts             ← Todas las funciones de email (+ `sendRescheduleEmail`)
    └── rate-limit-memory.ts                ← Rate limit en memoria (POST book)

sql-fix-all-reservas.sql                    ← Migration idempotente (EJECUTAR EN SUPABASE)
apps/web/scripts/verify-cancel-tz.mjs       ← Verificación matemática BUG-1 (`fromZonedTime` vs UTC)
packages/api/modules/reservas/procedures/index.ts  ← listBookings / deleteBookings / updateBookings
```

---

## 5. VARIABLES DE ENTORNO REQUERIDAS

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Better Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

# Resend (emails)
RESEND_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PRICE_NORMAL=
NEXT_PUBLIC_STRIPE_PRICE_PRO=
NEXT_PUBLIC_PRICE_ID_BASICO_MONTHLY=
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY=

# Cron
CRON_SECRET=

# App
NEXT_PUBLIC_SITE_URL=https://codetix.es
```

---

## 6. REGLAS PARA EL AGENTE

### Antes de editar cualquier archivo:
1. **Leer el archivo completo** — no editar basándose en fragmentos del contexto anterior
2. **Grep para confirmar** — si vas a cambiar una función, verificar con grep que no hay otras referencias
3. **No asumir que está arreglado** — si el commit dice "fix X", leer el archivo y confirmar que X está realmente arreglado

### Antes de hacer commit:
1. **Verificar con `node -e`** o similar cualquier función de cálculo (timezone, fechas, math)
2. **Buscar conflict markers** en cualquier archivo que toques: `grep -r "<<<<<<" apps/`
3. **Confirmar que los imports existen**: si importás `sendRescheduleEmail`, verificar que está exportado en `booking-emails.ts`

### Convenciones de código:
- **Never** usar `.single()` cuando el resultado puede ser 0 filas → usar `.maybeSingle()`
- **Never** hacer joins PostgREST sin FK declaradas → usar queries paralelas
- **Always** pasar `bookingId` a funciones de email
- **Always** verificar ownership en rutas admin
- **Always** usar `if (!existingXp)` antes de otorgar XP

### Si encontrás algo roto que no está en esta lista:
Documentarlo en este archivo antes de cerrar la sesión.

---

## 7. HISTORIAL DE BUGS MAYORES (para no repetirlos)

| Bug | Causa | Fix |
|---|---|---|
| XP doble al completar reserva | `client_profiles.update` antes del guard de idempotencia | Mover `existingXp` check antes del update |
| Nivel fidelización siempre "Bronce" | Columna `max_xp` no existe en DB, código la usaba | Iterar `loyalty_levels` DESC por `min_xp` |
| `client_profile_id` null en todas las reservas | `book/route.ts` no extraía del body ni insertaba | Extraer del body, pasar en INSERT |
| Conflictos git en `page.tsx` | Merge sin resolver entre dos ramas | Resolver manualmente conservando funcionalidades de ambas |
| Joins PostgREST devuelven null | Sin FK declaradas en Supabase | Reemplazar por queries paralelas explícitas |
| Timezone drift en fee cancelación | `appointmentLocalDateTime` / parse UTC incorrecto | `fromZonedTime` + script `apps/web/scripts/verify-cancel-tz.mjs` |
| Niveles borrados en guardado | DELETE + INSERT no atómico | Delete selectivo + upsert |

---

*Última actualización: 2026-05-10 — Nivel 1 (BUG-1…DEUDA-4) + Nivel 2 (rate limit, trial, cron, zod, admin list/cancel); contenido auditado previo: 2026-05-12 | Commit base: 816cb937*
*Generado tras auditorías de Claude, OpenClaw/Kimi*
