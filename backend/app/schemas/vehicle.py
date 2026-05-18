from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from app.models.vehicle import FuelType, TransmissionType, VehicleStatus

class VehiclePhotoOut(BaseModel):
    id: int
    url: Optional[str] = None
    is_main: int
    uploaded_at: datetime
    model_config = {"from_attributes": True}

class PriceHistoryOut(BaseModel):
    id: int
    precio_costo_anterior: Optional[float]
    precio_venta_anterior: Optional[float]
    precio_costo_nuevo: Optional[float]
    precio_venta_nuevo: Optional[float]
    changed_at: datetime
    changed_by: Optional[str]
    model_config = {"from_attributes": True}

class VehicleBase(BaseModel):
    marca: str
    modelo: str
    anio: int
    version: Optional[str] = None
    color: Optional[str] = None
    kilometraje: int = 0
    numero_chasis: Optional[str] = None
    patente: Optional[str] = None
    tipo_combustible: FuelType = FuelType.nafta
    transmision: TransmissionType = TransmissionType.manual
    precio_costo: float
    precio_venta: float
    estado: VehicleStatus = VehicleStatus.disponible
    descripcion: Optional[str] = None

    @field_validator("anio")
    @classmethod
    def validate_year(cls, v):
        if v < 1900 or v > 2030:
            raise ValueError("Año inválido")
        return v

    @field_validator("precio_costo", "precio_venta")
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("El precio no puede ser negativo")
        return v

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    version: Optional[str] = None
    color: Optional[str] = None
    kilometraje: Optional[int] = None
    numero_chasis: Optional[str] = None
    patente: Optional[str] = None
    tipo_combustible: Optional[FuelType] = None
    transmision: Optional[TransmissionType] = None
    precio_costo: Optional[float] = None
    precio_venta: Optional[float] = None
    estado: Optional[VehicleStatus] = None
    descripcion: Optional[str] = None

class VehicleOut(VehicleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    photos: List[VehiclePhotoOut] = []
    model_config = {"from_attributes": True}

class VehicleListOut(BaseModel):
    id: int
    marca: str
    modelo: str
    anio: int
    version: Optional[str]
    color: Optional[str]
    kilometraje: int
    patente: Optional[str]
    precio_venta: float
    estado: VehicleStatus
    main_photo_url: Optional[str] = None
    model_config = {"from_attributes": True}
