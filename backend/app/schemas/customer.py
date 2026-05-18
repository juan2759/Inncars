from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class InteractionBase(BaseModel):
    tipo: str
    descripcion: str

class InteractionCreate(InteractionBase):
    pass

class InteractionOut(InteractionBase):
    id: int
    created_at: datetime
    created_by: Optional[str]
    model_config = {"from_attributes": True}

class ReminderBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    fecha_recordatorio: datetime

class ReminderCreate(ReminderBase):
    pass

class ReminderOut(ReminderBase):
    id: int
    completado: int
    created_at: datetime
    model_config = {"from_attributes": True}

class CustomerBase(BaseModel):
    nombre: str
    apellido: str
    dni_cuit: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    notas: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    notas: Optional[str] = None

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    interactions: List[InteractionOut] = []
    reminders: List[ReminderOut] = []
    model_config = {"from_attributes": True}

class CustomerListOut(BaseModel):
    id: int
    nombre: str
    apellido: str
    dni_cuit: str
    telefono: Optional[str]
    email: Optional[str]
    ciudad: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}
