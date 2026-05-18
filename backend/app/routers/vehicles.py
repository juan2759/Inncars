from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List
import os, shutil, uuid
from pathlib import Path

from app.database import get_db
from app.models.vehicle import Vehicle, VehiclePhoto, VehiclePriceHistory, VehicleStatus
from app.schemas.vehicle import VehicleCreate, VehicleUpdate, VehicleOut, VehicleListOut, PriceHistoryOut
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/vehicles", tags=["vehicles"])

# ── Almacenamiento: Cloudinary o local ───────────────────────────────────────

_CLOUDINARY_CONFIGURED = all([
    os.getenv("CLOUDINARY_CLOUD_NAME"),
    os.getenv("CLOUDINARY_API_KEY"),
    os.getenv("CLOUDINARY_API_SECRET"),
])

if _CLOUDINARY_CONFIGURED:
    import cloudinary
    import cloudinary.uploader
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    )

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "../uploads")) / "vehicles"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

def _upload_photo(file: UploadFile) -> dict:
    """Upload a photo and return {'url': ..., 'filename': ..., 'cloud_public_id': ...}."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Formato no permitido (JPG, PNG, WEBP)")

    if _CLOUDINARY_CONFIGURED:
        result = cloudinary.uploader.upload(
            file.file,
            folder="automotora/vehicles",
            resource_type="image",
            transformation=[{"quality": "auto", "fetch_format": "auto"}],
        )
        return {
            "url": result["secure_url"],
            "filename": None,
            "cloud_public_id": result["public_id"],
        }
    else:
        filename = f"{uuid.uuid4()}{ext}"
        dest = UPLOAD_DIR / filename
        with dest.open("wb") as f:
            shutil.copyfileobj(file.file, f)
        return {
            "url": f"/uploads/vehicles/{filename}",
            "filename": filename,
            "cloud_public_id": None,
        }

def _delete_photo_storage(photo: VehiclePhoto):
    """Delete photo from storage backend."""
    if photo.cloud_public_id and _CLOUDINARY_CONFIGURED:
        try:
            cloudinary.uploader.destroy(photo.cloud_public_id)
        except Exception:
            pass
    elif photo.filename:
        path = UPLOAD_DIR / photo.filename
        if path.exists():
            path.unlink()

# ── Helpers ───────────────────────────────────────────────────────────────────

def vehicle_or_404(vehicle_id: int, db: Session) -> Vehicle:
    v = db.query(Vehicle).options(joinedload(Vehicle.photos)).filter(Vehicle.id == vehicle_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return v

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[VehicleListOut])
def list_vehicles(
    search: Optional[str] = Query(None),
    estado: Optional[VehicleStatus] = None,
    marca: Optional[str] = None,
    anio_min: Optional[int] = None,
    anio_max: Optional[int] = None,
    precio_min: Optional[float] = None,
    precio_max: Optional[float] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Vehicle)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(
            Vehicle.marca.ilike(term), Vehicle.modelo.ilike(term),
            Vehicle.patente.ilike(term), Vehicle.numero_chasis.ilike(term),
        ))
    if estado:
        q = q.filter(Vehicle.estado == estado)
    if marca:
        q = q.filter(Vehicle.marca.ilike(f"%{marca}%"))
    if anio_min:
        q = q.filter(Vehicle.anio >= anio_min)
    if anio_max:
        q = q.filter(Vehicle.anio <= anio_max)
    if precio_min is not None:
        q = q.filter(Vehicle.precio_venta >= precio_min)
    if precio_max is not None:
        q = q.filter(Vehicle.precio_venta <= precio_max)

    vehicles = q.order_by(Vehicle.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for v in vehicles:
        photos = db.query(VehiclePhoto).filter(VehiclePhoto.vehicle_id == v.id).all()
        main_url = next((p.url for p in photos if p.is_main), None)
        if not main_url and photos:
            main_url = photos[0].url
        result.append(VehicleListOut(
            id=v.id, marca=v.marca, modelo=v.modelo, anio=v.anio,
            version=v.version, color=v.color, kilometraje=v.kilometraje,
            patente=v.patente, precio_venta=v.precio_venta,
            estado=v.estado, main_photo_url=main_url,
        ))
    return result

@router.post("", response_model=VehicleOut, status_code=201)
def create_vehicle(data: VehicleCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if data.patente and db.query(Vehicle).filter(Vehicle.patente == data.patente).first():
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con esa patente")
    if data.numero_chasis and db.query(Vehicle).filter(Vehicle.numero_chasis == data.numero_chasis).first():
        raise HTTPException(status_code=400, detail="Ya existe un vehículo con ese número de chasis")
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return vehicle_or_404(vehicle_id, db)

@router.put("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int, data: VehicleUpdate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    vehicle = vehicle_or_404(vehicle_id, db)
    update_data = data.model_dump(exclude_none=True)

    price_changed = "precio_costo" in update_data or "precio_venta" in update_data
    if price_changed:
        db.add(VehiclePriceHistory(
            vehicle_id=vehicle.id,
            precio_costo_anterior=vehicle.precio_costo,
            precio_venta_anterior=vehicle.precio_venta,
            precio_costo_nuevo=update_data.get("precio_costo", vehicle.precio_costo),
            precio_venta_nuevo=update_data.get("precio_venta", vehicle.precio_venta),
            changed_by=current_user.username,
        ))

    for key, val in update_data.items():
        setattr(vehicle, key, val)
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.delete("/{vehicle_id}", status_code=204)
def delete_vehicle(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vehicle = vehicle_or_404(vehicle_id, db)
    photos = db.query(VehiclePhoto).filter(VehiclePhoto.vehicle_id == vehicle_id).all()
    for photo in photos:
        _delete_photo_storage(photo)
    db.delete(vehicle)
    db.commit()

@router.get("/{vehicle_id}/price-history", response_model=List[PriceHistoryOut])
def price_history(vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vehicle_or_404(vehicle_id, db)
    return db.query(VehiclePriceHistory).filter(
        VehiclePriceHistory.vehicle_id == vehicle_id
    ).order_by(VehiclePriceHistory.changed_at.desc()).all()

@router.post("/{vehicle_id}/photos", status_code=201)
async def upload_photo(
    vehicle_id: int,
    file: UploadFile = File(...),
    is_main: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicle_or_404(vehicle_id, db)
    stored = _upload_photo(file)

    if is_main:
        db.query(VehiclePhoto).filter(VehiclePhoto.vehicle_id == vehicle_id).update({"is_main": 0})

    photo = VehiclePhoto(
        vehicle_id=vehicle_id,
        filename=stored["filename"],
        cloud_public_id=stored["cloud_public_id"],
        url=stored["url"],
        is_main=1 if is_main else 0,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return {"id": photo.id, "url": photo.url}

@router.delete("/{vehicle_id}/photos/{photo_id}", status_code=204)
def delete_photo(vehicle_id: int, photo_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    photo = db.query(VehiclePhoto).filter(
        VehiclePhoto.id == photo_id, VehiclePhoto.vehicle_id == vehicle_id
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    _delete_photo_storage(photo)
    db.delete(photo)
    db.commit()

@router.put("/{vehicle_id}/photos/{photo_id}/main")
def set_main_photo(vehicle_id: int, photo_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vehicle_or_404(vehicle_id, db)
    db.query(VehiclePhoto).filter(VehiclePhoto.vehicle_id == vehicle_id).update({"is_main": 0})
    photo = db.query(VehiclePhoto).filter(VehiclePhoto.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    photo.is_main = 1
    db.commit()
    return {"message": "Foto principal actualizada"}
