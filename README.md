# Automotora — Sistema de Gestión

Sistema completo para concesionarias: stock, CRM, ventas, taller y reportes.  
Funciona tanto en local como desplegado en la nube (Render / Railway).

---

## Despliegue en la nube (Render — recomendado)

### Paso 1 — Subir el código a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/automotora.git
git push -u origin main
```

### Paso 2 — Cuenta Cloudinary (para las fotos)

1. Crear cuenta gratis en [cloudinary.com](https://cloudinary.com)
2. En el Dashboard ir a **API Keys**
3. Copiar **Cloud Name**, **API Key** y **API Secret**

### Paso 3 — Desplegar en Render

1. Ir a [render.com](https://render.com) → **New → Blueprint**
2. Conectar el repositorio de GitHub
3. Render detectará el `render.yaml` automáticamente y creará:
   - Un **Web Service** (backend + frontend)
   - Una **PostgreSQL** database (plan free)
4. En el Web Service → **Environment** → agregar las variables de Cloudinary:
   ```
   CLOUDINARY_CLOUD_NAME   = tu-cloud-name
   CLOUDINARY_API_KEY      = tu-api-key
   CLOUDINARY_API_SECRET   = tu-api-secret
   ```
5. Hacer clic en **Deploy** — el primer deploy tarda ~5 minutos
6. La URL del sistema queda en la sección **Domains** del servicio

> **Usuario inicial:** `admin` / `admin123` — cambiar inmediatamente.

---

## Despliegue en Railway

### Paso 1 — Subir a GitHub (igual que arriba)

### Paso 2 — Crear proyecto en Railway

```bash
# Opción CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

O desde [railway.app](https://railway.app):
1. **New Project → Deploy from GitHub repo**
2. Conectar el repo

### Paso 3 — Agregar PostgreSQL

En el proyecto de Railway: **New → Database → PostgreSQL**  
Railway inyecta `DATABASE_URL` automáticamente.

### Paso 4 — Variables de entorno

En Railway → tu servicio → **Variables**:
```
SECRET_KEY              = (generar con: python -c "import secrets; print(secrets.token_hex(32))")
CLOUDINARY_CLOUD_NAME   = tu-cloud-name
CLOUDINARY_API_KEY      = tu-api-key
CLOUDINARY_API_SECRET   = tu-api-secret
ALLOWED_ORIGINS         = (dejar vacío)
```

---

## Ejecución local (desarrollo)

### Requisitos
- Python 3.10+ → [python.org](https://python.org) o `winget install Python.Python.3.12`
- Node.js 18+ → [nodejs.org](https://nodejs.org) o `winget install OpenJS.NodeJS.LTS`

### Inicio rápido (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

Abre automáticamente `http://localhost:5173`.

### Inicio manual

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend (en otra terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

## Arquitectura

```
automotora/
├── backend/                    ← FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── main.py             ← Punto de entrada; sirve el frontend en prod
│   │   ├── database.py         ← SQLite (local) / PostgreSQL (prod)
│   │   ├── auth.py             ← JWT + bcrypt
│   │   ├── models/             ← ORM models
│   │   ├── schemas/            ← Pydantic validation
│   │   └── routers/            ← auth / vehicles / customers / sales / workshop / reports / pdf
│   └── static/frontend/        ← Build de React (generado por build.sh)
├── frontend/                   ← React + TypeScript + Tailwind
│   └── src/
│       ├── pages/              ← Dashboard / Vehicles / Customers / Sales / Workshop / Reports
│       ├── components/         ← Sidebar, Modal, Badge, StatCard, etc.
│       ├── services/api.ts     ← Cliente HTTP centralizado
│       └── types/              ← Tipos TypeScript
├── build.sh                    ← Build script (frontend → backend/static)
├── render.yaml                 ← Config Render (infra como código)
├── railway.toml                ← Config Railway
└── start.ps1                   ← Inicio local Windows
```

### Almacenamiento de fotos

| Entorno | Backend |
|---------|---------|
| Local (sin Cloudinary) | Carpeta `uploads/vehicles/` |
| Producción | [Cloudinary](https://cloudinary.com) (free: 25 GB) |

La detección es automática: si las variables `CLOUDINARY_*` están presentes, se usa Cloudinary; si no, se usa el sistema de archivos local.

### Base de datos

| Entorno | Motor |
|---------|-------|
| Local | SQLite (`backend/automotora.db`) |
| Producción | PostgreSQL (Railway/Render lo proveen) |

La detección es automática por la variable `DATABASE_URL`.

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí (prod) | URL de PostgreSQL — plataformas la inyectan automáticamente |
| `SECRET_KEY` | Sí (prod) | Clave JWT — generar con `secrets.token_hex(32)` |
| `CLOUDINARY_CLOUD_NAME` | Sí (prod) | Nombre del cloud de Cloudinary |
| `CLOUDINARY_API_KEY` | Sí (prod) | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | Sí (prod) | API Secret de Cloudinary |
| `ALLOWED_ORIGINS` | No | CORS — dejar vacío en producción |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Duración sesión (default: 480 = 8h) |

---

## API

Documentación interactiva (Swagger): `https://tu-app.onrender.com/docs`
