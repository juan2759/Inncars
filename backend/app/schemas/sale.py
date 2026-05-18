from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.sale import PaymentMethod, SaleStatus

class SaleBase(BaseModel):
    vehicle_id: int
    customer_id: int
    precio_venta: float
    forma_pago: PaymentMethod
    observaciones: Optional[str] = None
    vehiculo_permuta: Optional[str] = None
    valor_permuta: Optional[float] = None
    entidad_financiera: Optional[str] = None
    monto_financiado: Optional[float] = None
    cuotas: Optional[int] = None
    fecha_venta: Optional[datetime] = None

class SaleCreate(SaleBase):
    pass

class SaleUpdate(BaseModel):
    estado: Optional[SaleStatus] = None
    observaciones: Optional[str] = None
    precio_venta: Optional[float] = None

class SaleOut(SaleBase):
    id: int
    estado: SaleStatus
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: Optional[str]
    # Nested info
    vehicle_info: Optional[str] = None
    customer_info: Optional[str] = None
    model_config = {"from_attributes": True}
