from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date

from app.database import get_db
from app.models.sale import Sale, SaleStatus
from app.models.vehicle import Vehicle, VehicleStatus
from app.models.customer import Customer
from app.schemas.sale import SaleCreate, SaleUpdate, SaleOut
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/sales", tags=["sales"])

def sale_or_404(sale_id: int, db: Session) -> Sale:
    s = db.query(Sale).filter(Sale.id == sale_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return s

def enrich_sale(sale: Sale, db: Session) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.id == sale.vehicle_id).first()
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()
    data = {c.name: getattr(sale, c.name) for c in sale.__table__.columns}
    data["vehicle_info"] = f"{vehicle.marca} {vehicle.modelo} {vehicle.anio}" if vehicle else None
    data["customer_info"] = f"{customer.nombre} {customer.apellido}" if customer else None
    return data

@router.get("", response_model=List[SaleOut])
def list_sales(
    estado: Optional[SaleStatus] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Sale)
    if estado:
        q = q.filter(Sale.estado == estado)
    if fecha_desde:
        q = q.filter(func.date(Sale.fecha_venta) >= fecha_desde)
    if fecha_hasta:
        q = q.filter(func.date(Sale.fecha_venta) <= fecha_hasta)
    if customer_id:
        q = q.filter(Sale.customer_id == customer_id)
    sales = q.order_by(Sale.fecha_venta.desc()).offset(skip).limit(limit).all()
    return [enrich_sale(s, db) for s in sales]

@router.post("", response_model=SaleOut, status_code=201)
def create_sale(data: SaleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if vehicle.estado == VehicleStatus.vendido:
        raise HTTPException(status_code=400, detail="El vehículo ya fue vendido")
    if not db.query(Customer).filter(Customer.id == data.customer_id).first():
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    sale = Sale(**data.model_dump(), created_by=current_user.username)
    db.add(sale)

    # Mark vehicle as sold when sale is created directly as cerrada, else reservado
    vehicle.estado = VehicleStatus.vendido if sale.estado == SaleStatus.cerrada else VehicleStatus.reservado
    db.commit()
    db.refresh(sale)
    return enrich_sale(sale, db)

@router.get("/{sale_id}", response_model=SaleOut)
def get_sale(sale_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return enrich_sale(sale_or_404(sale_id, db), db)

@router.put("/{sale_id}", response_model=SaleOut)
def update_sale(sale_id: int, data: SaleUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sale = sale_or_404(sale_id, db)
    update_data = data.model_dump(exclude_none=True)

    if "estado" in update_data:
        vehicle = db.query(Vehicle).filter(Vehicle.id == sale.vehicle_id).first()
        if update_data["estado"] == SaleStatus.cerrada and vehicle:
            vehicle.estado = VehicleStatus.vendido
        elif update_data["estado"] == SaleStatus.cancelada and vehicle:
            vehicle.estado = VehicleStatus.disponible

    for key, val in update_data.items():
        setattr(sale, key, val)
    db.commit()
    db.refresh(sale)
    return enrich_sale(sale, db)

@router.delete("/{sale_id}", status_code=204)
def delete_sale(sale_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sale = sale_or_404(sale_id, db)
    vehicle = db.query(Vehicle).filter(Vehicle.id == sale.vehicle_id).first()
    if vehicle and sale.estado != SaleStatus.cerrada:
        vehicle.estado = VehicleStatus.disponible
    db.delete(sale)
    db.commit()

@router.get("/stats/daily")
def daily_stats(fecha: Optional[date] = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    target = fecha or date.today()
    sales = db.query(Sale).filter(
        Sale.estado == SaleStatus.cerrada,
        func.date(Sale.fecha_venta) == target,
    ).all()
    return {
        "fecha": str(target),
        "cantidad": len(sales),
        "total": sum(s.precio_venta for s in sales),
    }
