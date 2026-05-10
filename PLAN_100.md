# FILO — Plan al 100%

## Estado actual: ~88-90%

---

## 🟢 FIXES QUE PUEDO HACER AHORA (sin dependencias)

### 1. UI Admin — Gestión de blocked_slots
**Estado:** API oRPC completa (list/create/delete). Sin pantalla en el panel.
**Archivo objetivo:** `apps/web/app/(saas)/app/(organizations)/[organizationSlug]/reservas/configuracion/page.tsx`
**Acción:** Agregar tab "Días bloqueados" con:
- Tabla de bloqueos existentes
- Formulario para crear bloqueo (fecha, motivo, profesional opcional, franja horaria opcional)
- Botón eliminar

### 2. Fix HTML en booking-emails.ts
**Estado:** Estructura `<div>` anidados redundantes. Funciona pero es feo.
**Archivo:** `apps/web/lib/email/booking-emails.ts`
**Acción:** Limpiar HTML, asegurar cierre correcto de tags.

### 3. Link "Ver mis reservas" en emails
**Estado:** Los emails de confirmación no tienen link al portal `/mis-reservas`.
**Archivo:** `apps/web/lib/email/booking-emails.ts`
**Acción:** Agregar botón/link "📅 Ver mis reservas" en confirmación y recordatorio.

### 4. Íconos PWA
**Estado:** `manifest.json` referencia `/icons/icon-*.png` pero no existen.
**Archivo:** `apps/web/public/icons/`
**Acción:** Generar SVG inline como PNG placeholders (dorado #D4AF37 sobre negro #1a1a1a).

### 5. Screenshots PWA
**Estado:** `manifest.json` referencia `/screenshots/` pero no existen.
**Archivo:** `apps/web/public/screenshots/`
**Acción:** Crear placeholders o capturas descriptivas.

### 6. Hook useBlockedSlots en frontend admin
**Estado:** No existe hook para consumir la API oRPC de blocked_slots desde React.
**Archivo:** `apps/web/src/hooks/use-reservas.ts`
**Acción:** Exportar `useBlockedSlots`, `useCreateBlockedSlot`, `useDeleteBlockedSlot`.

---

## 🔴 BLOQUEADOS POR EL USUARIO

| # | Qué necesita | Cuándo se desbloquea |
|---|-------------|----------------------|
| SQL v4 en Supabase | Ejecutar `sql-fix-all-reservas.sql` en la DB live | Usuario lo corre o me da acceso |
| Stripe (Tarea #11) | Cuenta en stripe.com + `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Usuario crea cuenta |
| Analytics (Tarea #14) | Cuenta GA4 o Plausible + tracking ID | Usuario crea cuenta |

---

## 📊 Target realista al 100%

Sin Stripe ni Analytics (dependen de cuentas de terceros):
- 97-98% técnico

Con Stripe + Analytics:
- 100%

---

## Orden de ejecución

1. Hook useBlockedSlots
2. UI admin blocked_slots (usa el hook)
3. Fix HTML emails + link mis-reservas
4. Íconos PWA
5. Screenshots PWA
6. Commit + push
7. Actualizar memory
