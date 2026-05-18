from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os

from app.database import engine, Base
from app.models import *  # noqa: F401
from app.routers import auth, vehicles, customers, sales, workshop, reports, pdf
from app.auth import hash_password

# ── Rutas de archivos ─────────────────────────────────────────────────────────

BASE_DIR = Path(__file__).parent.parent           # backend/
FRONTEND_DIST = BASE_DIR / "static" / "frontend"  # built React app
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR.parent / "uploads")))
(UPLOAD_DIR / "vehicles").mkdir(parents=True, exist_ok=True)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Automotora API",
    version="1.0.0",
    docs_url="/docs",
    # En producción solo exponer /docs si se desea; cambiar a None para ocultarlo
)

# CORS — en producción se permite el mismo origen; en dev se agrega el dev server
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _allowed_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Archivos subidos localmente (solo en modo local sin Cloudinary)
if UPLOAD_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ── API Routers ───────────────────────────────────────────────────────────────

for r in [auth.router, vehicles.router, customers.router,
          sales.router, workshop.router, reports.router, pdf.router]:
    app.include_router(r)

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    _create_default_admin()

def _create_default_admin():
    from app.database import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                full_name="Administrador",
                hashed_password=hash_password("admin123"),
                is_admin=True,
                is_active=True,
            ))
            db.commit()
            print("✓ Usuario admin creado (user: admin / pass: admin123)")
    finally:
        db.close()

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

# ── Servir frontend React (SPA) ───────────────────────────────────────────────
# Debe ir DESPUÉS de todos los routers para no interceptar rutas /api/*

if FRONTEND_DIST.exists():
    # Servir archivos estáticos del build (/assets/*, /favicon*, etc.)
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Catch-all: devuelve index.html para que React Router maneje las rutas."""
        return FileResponse(str(FRONTEND_DIST / "index.html"))
