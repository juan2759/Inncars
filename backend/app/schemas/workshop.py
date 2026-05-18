from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.workshop import WorkOrderStatus

class WorkOrderItemBase(BaseModel):
    tipo: str
    descripcion: str
    cantidad: float = 1
    precio_unitario: float
    subtotal: float

class WorkOrderItemCreate(WorkOrderItemBase):
    pass

class WorkOrderItemOut(WorkOrderItemBase):
    id: int
    model_config = {"from_attributes": True}

class WorkOrderBase(BaseModel):
    vehicle_id: Optional[int] = None
    customer_id: Optional[int] = None
    vehiculo_externo: Optional[str] = None
    patente_externa: Optional[str] = None
    kilometraje_ingreso: Optional[int] = None
    descripcion_problema: str
    fecha_estimada: Optional[datetime] = None
    observaciones: Optional[str] = None

class WorkOrderCreate(WorkOrderBase):
    items: List[WorkOrderItemCreate] = []

class WorkOrderUpdate(BaseModel):
    estado: Optional[WorkOrderStatus] = None
    observaciones: Optional[str] = None
    fecha_estimada: Optional[datetime] = None
    fecha_finalizado: Optional[datetime] = None

class WorkOrderOut(WorkOrderBase):
    id: int
    numero: str
    estado: WorkOrderStatus
    fecha_ingreso: datetime
    fecha_finalizado: Optional[datetime]
    created_at: datetime
    items: List[WorkOrderItemOut] = []
    total: float = 0
    vehicle_info: Optional[str] = None
    customer_info: Optional[str] = None
    model_config = {"from_attributes": True}
