# 🚀 Deploy FILO — Acceso desde iPhone/Android

**Tu PC no necesita estar prendida.** FILO corre en la nube. Accedés desde Safari/Chrome en tu celular.

---

## Opción recomendada: Vercel (Gratis para Next.js)

### 1. Preparar variables de entorno

Necesitás estas 5 variables (las que ya usás localmente):

| Variable | Dónde conseguirla |
|----------|-------------------|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection String (URI) |
| `DIRECT_URL` | Igual que DATABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → URL |
| `RESEND_API_KEY` | Resend → API Keys → Crear nueva |
| `BETTER_AUTH_SECRET` | Generar: `openssl rand -base64 32` o cualquier string random largo |
| `NEXT_PUBLIC_SITE_URL` | `https://filo-tuusuario.vercel.app` (la URL que te dé Vercel) |

**Opcionales** (si querés login social):
- `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` → GitHub Developer Settings
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → Google Cloud Console

### 2. Subir a GitHub

Desde tu PC (ahora, antes de salir):

```bash
cd filo-repo
git remote add origin https://github.com/TU_USUARIO/filo.git
git add -A
git commit -m "ready for deploy"
git push -u origin main
```

### 3. Deploy en Vercel (desde el iPhone)

1. Andá a [vercel.com](https://vercel.com) en Safari
2. Logueate con GitHub
3. **"Add New Project"** → Importá `filo`
4. En la config:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `apps/web`
5. Click **"Environment Variables"** y agregá una por una las variables del paso 1
6. Click **"Deploy"**

### 4. Listo

- Te dará una URL tipo `https://filo-abc123.vercel.app`
- Guardala en favoritos de Safari
- Desde ahi podés:
  - Ver reservas
  - Configurar servicios/profesionales
  - Ver el calendario
  - Todo lo que hacías en la PC

---

## ⚠️ Problemas conocidos en móvil

| Problema | Solución |
|----------|----------|
| Better Auth cookies en dominio `.vercel.app` | En `.env` poner `NEXT_PUBLIC_SITE_URL` exactamente igual a la URL de Vercel |
| Prisma no se migra solo | En local corrés `npx prisma migrate dev`, en Vercel no. Tenés que tener la DB ya migrada en Supabase |
| Imágenes de galería no cargan | Supabase Storage tiene CORS. Configurar bucket `style_gallery` con CORS `*` en Supabase |

---

## 💰 Costo

| Servicio | Costo |
|----------|-------|
| Vercel (Hobby plan) | **Gratis** |
| Supabase (Free tier) | **Gratis** (500MB, 2GB transferencia) |
| Resend (Free tier) | **Gratis** (3000 emails/mes) |
| Tu PC prendida | **No necesaria** |

---

## 📱 Acceso desde iPhone

- **Safari**: Abrí la URL de Vercel
- **Agregar a Home Screen**: Safari → Compartir → "Agregar a Pantalla de Inicio" → se ve como app nativa
- **Notificaciones**: Vercel no envía push nativas, pero podés usar el cron de recordatorios (ya está configurado en `/api/cron/booking-reminders`)

---

## 🔄 Si querés editar código desde el iPhone

Las opciones son limitadas pero existen:

1. **GitHub Mobile app**: Podés mergear PRs, ver issues, aprobar cambios
2. **Safari + github.com/TU_USUARIO/filo**: Editá archivos directamente (incómodo pero posible para cambios chicos)
3. **Working Copy** (app de iOS, $15.99): Cliente Git completo para iPhone
4. **Textastic** (app de iOS, $9.99): Editor de código con soporte Git

**Recomendación práctica**: Si se te ocurre un cambio mientras estás afuera, anotarlo en Notas del iPhone y aplicarlo cuando volvás a la PC.

---

## 🔒 Seguridad

- `SUPABASE_SERVICE_ROLE_KEY`: **Nunca la commitees**. Solo en Vercel Environment Variables.
- `BETTER_AUTH_SECRET`: Generá una nueva para producción, distinta a la de local.
- `CRON_SECRET`: Generá una random también.

---

**FILO en tu bolsillo. Sin PC. Gratis.**
