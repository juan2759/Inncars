from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import date, datetime

from app.database import get_db
from app.models.workshop import WorkOrder, WorkOrderItem, WorkOrderStatus
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.schemas.workshop import WorkOrderCreate, WorkOrderUpdate, WorkOrderOut, WorkOrderItemCreate
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/workshop", tags=["workshop"])

def next_order_number(db: Session) -> str:
    count = db.query(func.count(WorkOrder.id)).scalar() + 1
    return f"OT-{count:05d}"

def wo_or_404(wo_id: int, db: Session) -> WorkOrder:
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    return wo

def enrich_wo(wo: WorkOrder, db: Session) -> dict:
    vehicle = db.query(Vehicle).filter(Vehicle.id == wo.vehicle_id).first() if wo.vehicle_id else None
    customer = db.query(Customer).filter(Customer.id == wo.customer_id).first() if wo.customer_id else None
    items = db.query(WorkOrderItem).filter(WorkOrderItem.work_order_id == wo.id).all()
    total = sum(i.subtotal for i in items)
    data = {c.name: getattr(wo, c.name) for c in wo.__table__.columns}
    data["items"] = [{c.name: getattr(i, c.name) for c in i.__table__.columns} for i in items]
    data["total"] = total
    data["vehicle_info"] = (
        f"{vehicle.marca} {vehicle.modelo} {vehicle.anio}" if vehicle else wo.vehiculo_externo
    )
    data["customer_info"] = f"{customer.nombre} {customer.apellido}" if customer else None
    return data

@router.get("", response_model=List[WorkOrderOut])
def list_work_orders(
    estado: Optional[WorkOrderStatus] = None,
    customer_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(WorkOrder)
    if estado:
        q = q.filter(WorkOrder.estado == estado)
    if customer_id:
        q = q.filter(WorkOrder.customer_id == customer_id)
    if fecha_desde:
        q = q.filter(func.date(WorkOrder.fecha_ingreso) >= fecha_desde)
    if fecha_hasta:
        q = q.filter(func.date(WorkOrder.fecha_ingreso) <= fecha_hasta)
    if search:
        term = f"%{search}%"
        q = q.filter(
            WorkOrder.numero.ilike(term) | WorkOrder.patente_externa.ilike(term) |
            WorkOrder.vehiculo_externo.ilike(term)
        )
    orders = q.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()
    return [enrich_wo(o, db) for o in orders]

@router.post("", response_model=WorkOrderOut, status_code=201)
def create_work_order(data: WorkOrderCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    items_data = data.items
    wo_data = data.model_dump(exclude={"items"})
    wo = WorkOrder(numero=next_order_number(db), **wo_data)
    db.add(wo)
    db.flush()
    for item in items_data:
        db.add(WorkOrderItem(work_order_id=wo.id, **item.model_dump()))
    db.commit()
    db.refresh(wo)
    return enrich_wo(wo, db)

@router.get("/{wo_id}", response_model=WorkOrderOut)
def get_work_order(wo_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return enrich_wo(wo_or_404(wo_id, db), db)

@router.put("/{wo_id}", response_model=WorkOrderOut)
def update_work_order(wo_id: int, data: WorkOrderUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wo = wo_or_404(wo_id, db)
    update_data = data.model_dump(exclude_none=True)
    if update_data.get("estado") == WorkOrderStatus.finalizado and not wo.fecha_finalizado:
        update_data["fecha_finalizado"] = datetime.now()
    for key, val in update_data.items():
        setattr(wo, key, val)
    db.commit()
    db.refresh(wo)
    return enrich_wo(wo, db)

@router.delete("/{wo_id}", status_code=204)
def delete_work_order(wo_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wo = wo_or_404(wo_id, db)
    db.delete(wo)
    db.commit()

@router.post("/{wo_id}/items", response_model=WorkOrderOut, status_code=201)
def add_item(wo_id: int, data: WorkOrderItemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wo = wo_or_404(wo_id, db)
    db.add(WorkOrderItem(work_order_id=wo.id, **data.model_dump()))
    db.commit()
    db.refresh(wo)
    return enrich_wo(wo, db)

@router.delete("/{wo_id}/items/{item_id}", status_code=204)
def delete_item(wo_id: int, item_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.query(WorkOrderItem).filter(
        WorkOrderItem.id == item_id, WorkOrderItem.work_order_id == wo_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    db.delete(item)
    db.commit()
