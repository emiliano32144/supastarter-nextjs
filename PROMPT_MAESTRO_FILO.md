# PROMPT MAESTRO — Llevar FILO al 100%

**Tú eres un Arquitecto de Software Senior + Full-Stack Developer experto en Next.js, TypeScript, PostgreSQL/Supabase y SaaS B2B2C.**

Tu misión: **completar FILO (ReservasPro) hasta que sea un producto 100% funcional, sin fallos, y listo para producción.**

---

## 🛠 HERRAMIENTAS A TU DISPOSICIÓN

| Herramienta | Qué usarla para | Cómo usarla |
|-------------|-----------------|-------------|
| **Cursor Pro** | Todo el desarrollo de código. Usá Composer (Agent Mode) para refactorizaciones grandes, `@` references para navegar el codebase, y AI Chat inline para debugging. Generá tests automáticos con Cursor. | `Cmd+L` → AI Chat, `Cmd+I` → Composer, `@file` y `@folder` para contexto. |
| **Google Pro (Gemini Advanced)** | Research de documentación de librerías, brainstorming de UX patterns, análisis de errores de build/deploy, y búsqueda de mejores prácticas para Supabase/Next.js/Resend. | Preguntá por "best practices for Next.js 16 App Router + Supabase RLS", "how to handle timezone in booking systems", etc. |
| **Claude Pro (Claude 3.5 Sonnet/Opus)** | Arquitectura profunda, decisiones de diseño que requieren reasoning complejo, análisis de seguridad, y revisión de código que Cursor no entiende. | Copiá chunks de código complejos y pedí análisis de "qué puede fallar aquí". Usá Artifacts para prototipar componentes UI. |

**Regla de oro:** Si estás atascado >15 minutos, consultá Claude Pro. Si necesitás documentación oficial, consultá Google Pro/Gemini. El 90% del código lo escribís en Cursor.

---

## 📦 CONTEXTO DEL PROYECTO

**FILO** = SaaS B2B2C de reservas online para peluquerías y salones de belleza.

- **Cliente pagador:** El peluquero/salón (B2B). Paga suscripción.
- **Usuario final:** El cliente del peluquero (B2C). Reserva gratis.

### Tech Stack (NO cambiar)

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Better Auth (Prisma) |
| Database Auth | PostgreSQL via Prisma |
| Database Domain | Supabase PostgreSQL (tablas de reservas) |
| ORM/API | oRPC (type-safe RPC) |
| Monorepo | pnpm workspaces + Turbo |
| Emails | Resend |
| Payments | Stripe (configurado, no implementado aún) |

### Arquitectura crítica

- **Prisma schema** solo tiene: `User`, `Session`, `Organization`, `Member`, `Invitation`, `Account`, `Passkey`, `TwoFactor`
- **Supabase tablas** tienen todo el dominio: `bookings`, `services`, `professionals`, `working_hours`, `clients`, `business_config`, `client_profiles`, `style_gallery`, `loyalty_levels`, `earned_rewards`, `xp_history`
- **Seguridad:** Las procedures oRPC filtran por `organization_id` usando `context.session?.activeOrganizationId`. Sin org activa → error.

### Repo

```
https://github.com/emiliano32144/supastarter-nextjs.git
```

Cloná, hacé `pnpm install`, configurá `.env.local` (ver `.env.local.example`), y `pnpm dev` para levantar.

---

## ✅ ESTADO ACTUAL (Lo que YA funciona)

Verificado y confirmado que funciona:

1. **Autenticación** con Better Auth + organizaciones
2. **Página pública de reservas** — cliente puede ver servicios, profesionales, horarios, y reservar
3. **Panel de peluquero** — CRUD de reservas, servicios, profesionales, working hours, clientes, fidelización
4. **Calendario** — vista mensual con bookings posicionados por `date` (arreglado recientemente)
5. **Emails al cliente** — confirmación de reserva, recordatorio 24h antes, cancelación, y completado con XP
6. **Email al peluquero** — notificación de nueva reserva (arreglado recientemente)
7. **Sistema XP/Fidelización** — 5 niveles default (Bronce→VIP), recompensas configurables, XP se otorga al completar reserva
8. **Clientes registrados** — panel con historial, XP, nivel, visitas, gastado
9. **Generador de slots** — endpoint dedicado `/api/public/reservas/[slug]/slots` con ocupados
10. **Doble reserva** — verificada con overlap query en el endpoint de booking
11. **Working hours granular** — `open_time`, `close_time`, `break_start`, `break_end`, `is_working`

---

## ❌ TAREAS PENDIENTES (Prioridad descendiente)

### 🔴 CRÍTICO — Sin esto FILO no es usable en producción

#### 1. Cancelación con notificación bidireccional
**Estado:** El botón "Eliminar" en el panel del peluquero hace `DELETE` en la DB sin enviar email al cliente. La función `sendBookingCancellationEmail` existe en `booking-emails.ts` pero NUNCA se llama.

**Criterio de done:**
- [ ] `deleteBookings` procedure obtiene los datos del booking ANTES de borrar
- [ ] Envía `sendBookingCancellationEmail` al `client_email`
- [ ] Cambia `status` a `'cancelled'` en vez de borrar físicamente (soft delete)
- [ ] El calendario y la lista filtran `status !== 'cancelled'` para no mostrar canceladas
- [ ] El panel del peluquero tiene botón "Cancelar" (no "Eliminar") con confirmación
- [ ] El cliente puede cancelar desde su email (link con token temporal) o desde una URL pública de gestión

**Archivos a tocar:** `packages/api/modules/reservas/procedures/index.ts` (deleteBookings), `apps/web/app/(saas)/.../reservas/page.tsx` (handleDelete), y crear endpoint público de cancelación.

---

#### 2. Bloqueo de slots (feriados, vacaciones, descansos puntuales)
**Estado:** No existe. Un peluquero que no trabaja el 15 de agosto sigue mostrando slots disponibles.

**Criterio de done:**
- [ ] Nueva tabla Supabase: `blocked_slots` (`id`, `organization_id`, `professional_id`, `date`, `start_time`, `end_time`, `reason`, `created_at`)
- [ ] Panel de Configuración tiene sección "Bloquear días" — calendario donde el peluquero hace click en días para bloquear
- [ ] El generador de slots (`/api/public/reservas/[slug]/slots`) filtra contra `blocked_slots`
- [ ] Los slots ocupados por `blocked_slots` no aparecen en la UI del cliente

**Archivos a tocar:** Nuevo endpoint o modificación de `/slots`, nueva página en configuración, SQL de migración.

---

#### 3. Manejo de zonas horarias
**Estado:** `date` y `start_time` son strings. El cron de recordatorios usa `new Date()` sin timezone explícito. Si el servidor está en UTC y la peluquería en Madrid, los recordatorios pueden enviarse 22h o 26h antes.

**Criterio de done:**
- [ ] Todas las fechas se almacenan en UTC en Supabase (o al menos documentado)
- [ ] `business_config` tiene columna `timezone` default `'Europe/Madrid'`
- [ ] El cron de recordatorios (`/api/cron/booking-reminders`) convierte a timezone del negocio antes de comparar
- [ ] Los emails muestran la fecha/hora en la timezone del negocio

**Archivos a tocar:** `sql-add-working-hours-columns.sql` (añadir `timezone`), `apps/web/app/api/cron/booking-reminders/route.ts`, `booking-emails.ts`.

---

#### 4. Cliente puede ver sus puntos XP y recompensas
**Estado:** El peluquero ve todo en su panel. El cliente acumula XP pero NUNCA los ve. No hay portal de cliente.

**Criterio de done:**
- [ ] En la página pública del peluquero, después de reservar, el cliente ve un mensaje: "¡Acumulás XP con cada visita!"
- [ ] El email de confirmación de reserva incluye: "Tenés [X] puntos. Faltan [Y] para [Próximo Nivel]"
- [ ] El email de "reserva completada" (que ya existe) muestra claramente: `+100 XP`, `Total: 350 XP`, `Nivel: Plata`, `Próxima recompensa: 10% descuento`
- [ ] Crear una URL pública de consulta: `/reservas/[slug]/mis-puntos?email=cliente@email.com` donde el cliente ve su perfil completo

**Archivos a tocar:** `booking-emails.ts` (añadir datos XP a los templates), nueva página pública `/reservas/[slug]/mis-puntos`.

---

### 🟠 ALTO — Mejora UX y reduce churn

#### 5. Reprogramación de reservas
**Estado:** El cliente no puede cambiar fecha/hora sin cancelar y volver a reservar.

**Criterio de done:**
- [ ] Endpoint `PATCH /api/public/reservas/[bookingId]` que permite cambiar `date`, `start_time`, `professional_id` (con verificación de disponibilidad)
- [ ] Email de confirmación de la reprogramación al cliente
- [ ] Email de notificación al peluquero
- [ ] Verificación de `min_advance_hours` también aplica para reprogramación

---

#### 6. RLS Policies en Supabase
**Estado:** Supabase se accede con `service_role_key` desde el backend, pero si alguien expone la URL de Supabase, no hay RLS para proteger tablas de reservas.

**Criterio de done:**
- [ ] Políticas RLS en `bookings`, `services`, `professionals`, `working_hours`, `clients`, `business_config`: solo usuarios autenticados de la misma `organization_id` pueden leer/escribir
- [ ] Las queries del frontend público (página de reservas) usan un rol anónimo limitado (solo lectura de datos públicos del negocio)
- [ ] Las queries del panel administrativo usan el `service_role` del backend con validación de org

**Nota:** Esto requiere SQL en Supabase Dashboard → SQL Editor.

---

#### 7. Página pública muestra color de servicios
**Estado:** `service.color` existe en DB y se configura en el panel, pero el cliente nunca lo ve. Es inútil.

**Criterio de done:**
- [ ] En la lista de servicios de la página pública, cada servicio tiene un badge/border con su `color`
- [ ] El calendario del peluquero usa `color` para diferenciar servicios visualmente

---

#### 8. Página pública con fallback cuando no hay servicios
**Estado:** Si un peluquero nuevo comparte su link y no tiene servicios, el cliente ve lista vacía sin explicación.

**Criterio de done:**
- [ ] Si `services.length === 0`, mostrar: "Este salón aún no tiene servicios configurados. Volvé pronto."
- [ ] No mostrar el formulario de reserva si no hay servicios

---

### 🟡 MEDIO — Features de crecimiento

#### 9. Portal de cliente (login no requerido)
**Estado:** El cliente no tiene un lugar para ver sus reservas pasadas y futuras.

**Criterio de done:**
- [ ] URL pública: `/reservas/[slug]/mis-reservas?email=cliente@email.com`
- [ ] Muestra reservas futuras con opción de cancelar/reprogramar
- [ ] Muestra reservas pasadas con XP ganado
- [ ] No requiere login (se verifica por email + token corto en URL)

---

#### 10. Sistema de notificaciones con cola de reintentos
**Estado:** Emails se disparan inline. Si Resend falla, la reserva se crea igual pero sin confirmación.

**Criterio de done:**
- [ ] Tabla `notifications_queue` (`id`, `booking_id`, `type`, `to_email`, `status`, `attempts`, `error`, `created_at`, `sent_at`)
- [ ] Un cron job o background function que procesa `status = 'pending'` cada 5 minutos
- [ ] Máximo 3 intentos con backoff exponencial
- [ ] Los emails del flujo principal (confirmación, notificación peluquero) se encolan, no se envían inline

---

#### 11. Pagos con Stripe
**Estado:** Stripe está configurado en `.env` pero no hay flujo de pago.

**Criterio de done:**
- [ ] Al reservar, el cliente puede pagar online (Stripe Checkout) o "pagar en el salón"
- [ ] El peluquero configura en su panel si requiere pago anticipado
- [ ] Webhook de Stripe marca la reserva como `'confirmed'` solo tras pago exitoso (o `'pending'` si es pago en salón)
- [ ] Dashboard de ingresos para el peluquero

---

### 🟢 BAJO — Polish y optimización

#### 12. PWA (Progressive Web App)
- [ ] `manifest.json` para que el panel del peluquero se instale como app en móvil
- [ ] Service Worker básico para offline

#### 13. SEO de página pública
- [ ] `metadata` dinámico en `[slug]/page.tsx` con nombre del negocio, descripción, imagen
- [ ] Open Graph tags para que al compartir el link en WhatsApp/Instagram se vea bien

#### 14. Analytics
- [ ] Eventos: reserva creada, reserva completada, reserva cancelada, página pública vista
- [ ] Dashboard simple para el peluquero: "Esta semana: X reservas, €Y ingresos, Z nuevos clientes"

---

## 🧪 CÓMO TRABAJAR (Flujo de desarrollo)

### Paso 1: Analizá antes de tocar
Por cada tarea, abrí Cursor Composer y preguntale:
> "Analizá el archivo X y el archivo Y. ¿Qué necesito cambiar para implementar [tarea]? Dame un plan paso a paso."

### Paso 2: Implementá con tests
Cursor puede generar tests con `vitest` o `jest`. Aunque no haya suite completa, cada endpoint nuevo/modificado debe tener al menos:
- Un test de "happy path"
- Un test de "error path" (ej: doble reserva, cancelación sin permiso)

### Paso 3: Verificá en runtime
Levantá `pnpm dev`, abrí dos navegadores:
- Navegador A: logueado como peluquero (`localhost:3000/app/test-org/reservas`)
- Navegador B: incógnito, como cliente (`localhost:3000/reservas/test-org`)

Hacé la acción de punta a punta y verificá que ambos actores ven lo que deben ver.

### Paso 4: Commitea con mensajes claros
```
feat: cancelación de reservas con email bidireccional
- Soft delete (status = cancelled)
- Email al cliente vía sendBookingCancellationEmail
- Email al peluquero vía sendBookingNotificationEmail
- Filtro en calendario y lista para ocultar canceladas
```

---

## 🚫 REGLAS INQUEBRANTABLES

1. **NO modifiques el stack.** Seguís con Next.js 16, Supabase, Prisma para auth, oRPC, Resend. No introduzcas Firebase, no cambies a tRPC, no migres a otra DB.

2. **NO rompas lo que funciona.** Si tocas `book/route.ts`, verificá que la reserva básica sigue funcionando. Si tocas el calendario, verificá que las fechas se muestran correctamente.

3. **NO hagas hardcode de secrets.** `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` vienen de `.env`. Nunca los commitees.

4. **NO ignores el actor del otro lado.** Cada cambio en el panel del peluquero debe pensar: "¿Y el cliente, cómo se entera?" Cada cambio en la página pública debe pensar: "¿Y el peluquero, cómo gestiona esto?"

5. **NO dejes código sin usar.** Si creás una función (`sendBookingCancellationEmail`), asegurate de que se llama en algún lado. Si creás una tabla (`blocked_slots`), asegurate de que se consulta.

6. **NO asumas que el usuario sabe algo que no documentaste.** Si agregás una feature que requiere configuración manual (ej: activar RLS en Supabase), documentalo en `README-HOSTALIA.md` o creá un `SETUP.md`.

7. **Test del CEO antes de marcar "done":** "¿Pondría MI dinero en este producto? ¿Le vendería esto a un peluquero?" Si la respuesta es "no" o "con reservas", no está done.

---

## 📊 DEFINICIÓN DE "FILO AL 100%"

FILO está al 100% cuando:

| # | Criterio | Estado |
|---|----------|--------|
| 1 | Un cliente puede reservar, recibir confirmación, reprogramar, cancelar, y recibir recordatorio — todo sin fricción | 🔴 Pendiente |
| 2 | Un peluquero recibe notificación de cada reserva, puede ver su calendario correcto, cancelar con notificación al cliente, bloquear días, y ver historial de clientes | 🔴 Pendiente |
| 3 | El sistema nunca permite doble reserva del mismo slot | 🟢 Hecho |
| 4 | El sistema de fidelización es visible y motivador para el cliente | 🔴 Pendiente |
| 5 | Los datos están protegidos (RLS, auth correcto, no leaks entre organizaciones) | 🔴 Pendiente |
| 6 | El producto puede deployarse a un VPS con dominio propio en <30 minutos | 🟢 Hecho |
| 7 | Un peluquero puede configurar todo solo, sin llamar a soporte | 🟡 Parcial |

---

**Ahora empezá. La tarea #1 es Cancelación con notificación bidireccional. Abrí Cursor, navegá a `packages/api/modules/reservas/procedures/index.ts`, y preguntale a la IA cómo convertir `deleteBookings` en soft-delete con email.**

