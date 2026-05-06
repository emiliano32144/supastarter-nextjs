# 🚀 FILO en tu VPS + Dominio propio (Hostalia)

**Tu dominio propio.** Tu servidor propio. Sin depender de Vercel/Render.

---

## 📋 Requisitos del VPS

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| SO | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| RAM | 1 GB | 2 GB |
| CPU | 1 vCore | 2 vCore |
| Disco | 20 GB SSD | 40 GB SSD |
| Node.js | 20+ | 20+ (LTS) |
| Docker | Opcional pero recomendado | Sí |

> ⚠️ **Shared hosting con cPanel NO sirve** para Next.js. Necesitás VPS o Cloud.

---

## 🔧 Paso 1: Preparar el VPS

### Opción A: Con Docker (recomendado)

Conectate por SSH a tu VPS:

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Instalar Docker Compose
sudo apt-get install -y docker-compose-plugin
```

### Opción B: Sin Docker (directo con Node.js)

```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar pnpm
sudo corepack enable
sudo corepack prepare pnpm@10.14.0 --activate
```

---

## 📝 Paso 2: Variables de entorno

Copiá el archivo `.env.local.example` a `.env.production`:

```bash
cp .env.local.example .env.production
```

Editá `.env.production` con tus valores reales:

```env
# Database (Supabase — ya lo tenés)
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public"
DIRECT_URL="postgresql://postgres:TU_PASSWORD@db.xxxxx.supabase.co:5432/postgres?schema=public"

# Tu dominio
NEXT_PUBLIC_SITE_URL="https://filo.tudominio.com"

# Auth (generar nuevo para producción)
BETTER_AUTH_SECRET="TU_SECRET_AQUI_MINIMO_32_CHARS"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Email
RESEND_API_KEY="re_xxxx"

# Cron
CRON_SECRET="otro_secret_random"

# Stripe (si tenés pagos)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price IDs
NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY="price_..."
NEXT_PUBLIC_PRICE_ID_PRO_YEARLY="price_..."
NEXT_PUBLIC_PRICE_ID_LIFETIME="price_..."
```

> 🔑 **Generar secrets random**:
> ```bash
> openssl rand -base64 32
> ```

---

## 🐳 Paso 3: Deploy con Docker

### 3.1 Subir el código al VPS

Desde tu PC:

```bash
git add -A
git commit -m "production deploy"
git push origin main
```

En el VPS:

```bash
cd /opt
git clone https://github.com/TU_USUARIO/filo.git
cd filo
```

### 3.2 Configurar dominio en nginx

Editá `nginx.conf` y cambiá `server_name _;` por tu dominio:

```nginx
server_name filo.tudominio.com;
```

Y las rutas de SSL:
```nginx
ssl_certificate /etc/letsencrypt/live/filo.tudominio.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/filo.tudominio.com/privkey.pem;
```

### 3.3 Obtener certificado SSL (Let's Encrypt)

```bash
docker compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email \
  -d filo.tudominio.com
```

### 3.4 Arrancar todo

```bash
docker compose up -d --build
```

FILO estará disponible en `https://filo.tudominio.com`

---

## 🔄 Paso 4: DNS en Hostalia

Andá al panel de Hostalia (o donde gestionás tu dominio):

1. **Sección DNS / Gestión DNS**
2. Creá un registro **A**:
   - Nombre: `filo` (o `@` si querés el dominio raíz)
   - Valor: `IP_DE_TU_VPS`
   - TTL: 3600

3. Si querés `www` también, creá otro A o un CNAME:
   - Nombre: `www`
   - Valor: `filo.tudominio.com`
   - Tipo: CNAME

Esperá 5-30 minutos a que propaguen los DNS.

---

## 📱 Paso 5: Acceso desde iPhone

1. Abrí Safari
2. Andá a `https://filo.tudominio.com`
3. Safari → Compartir → "Agregar a Pantalla de Inicio"
4. Listo. Se ve como app nativa.

---

## 🔄 Actualizaciones futuras

Cuando hagás cambios en tu PC:

```bash
# En tu PC
git add -A
git commit -m "nuevos cambios"
git push origin main

# En el VPS (por SSH o desde el iPhone con app de terminal)
cd /opt/filo
git pull origin main
docker compose up -d --build
```

---

## 🛠 Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| `502 Bad Gateway` | FILO no arrancó | `docker compose logs filo` |
| Certificado no válido | Certbot falló | `docker compose run --rm certbot certonly ...` de nuevo |
| Prisma error | DB no conecta | Verificar `DATABASE_URL` en `.env.production` |
| Build muy lento | RAM insuficiente | Usar swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |

---

## 💰 Costo mensual estimado

| Servicio | Costo |
|----------|-------|
| Dominio Hostalia | ~€10-15/año |
| VPS (Hostalia Cloud o similar) | ~€5-10/mes |
| Supabase (Free tier) | €0 |
| Resend (Free tier) | €0 |
| SSL (Let's Encrypt) | €0 |
| **Total** | **~€5-10/mes** |

---

**Tu FILO. Tu dominio. Tu servidor.**
