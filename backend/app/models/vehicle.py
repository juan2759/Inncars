from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class FuelType(str, enum.Enum):
    nafta = "nafta"
    diesel = "diesel"
    gnc = "gnc"
    electrico = "electrico"
    hibrido = "hibrido"

class TransmissionType(str, enum.Enum):
    manual = "manual"
    automatica = "automatica"
    cvt = "cvt"

class VehicleStatus(str, enum.Enum):
    disponible = "disponible"
    reservado = "reservado"
    vendido = "vendido"

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    marca = Column(String(50), nullable=False, index=True)
    modelo = Column(String(100), nullable=False, index=True)
    anio = Column(Integer, nullable=False)
    version = Column(String(100), nullable=True)
    color = Column(String(50), nullable=True)
    kilometraje = Column(Integer, default=0)
    numero_chasis = Column(String(50), unique=True, nullable=True, index=True)
    patente = Column(String(20), unique=True, nullable=True, index=True)
    tipo_combustible = Column(Enum(FuelType), default=FuelType.nafta)
    transmision = Column(Enum(TransmissionType), default=TransmissionType.manual)
    precio_costo = Column(Float, nullable=False, default=0)
    precio_venta = Column(Float, nullable=False, default=0)
    estado = Column(Enum(VehicleStatus), default=VehicleStatus.disponible, index=True)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    photos = relationship("VehiclePhoto", back_populates="vehicle", cascade="all, delete-orphan")
    price_history = relationship("VehiclePriceHistory", back_populates="vehicle", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="vehicle")
    work_orders = relationship("WorkOrder", back_populates="vehicle")


class VehiclePhoto(Base):
    __tablename__ = "vehicle_photos"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    # Almacenamiento local (desarrollo)
    filename = Column(String(255), nullable=True)
    # Almacenamiento Cloudinary (producción)
    cloud_public_id = Column(String(255), nullable=True)
    # URL final (siempre presente — local path o Cloudinary URL)
    url = Column(String(500), nullable=True)
    is_main = Column(Integer, default=0)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    vehicle = relationship("Vehicle", back_populates="photos")


class VehiclePriceHistory(Base):
    __tablename__ = "vehicle_price_history"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    precio_costo_anterior = Column(Float, nullable=True)
    precio_venta_anterior = Column(Float, nullable=True)
    precio_costo_nuevo = Column(Float, nullable=True)
    precio_venta_nuevo = Column(Float, nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    changed_by = Column(String(100), nullable=True)

    vehicle = relationship("Vehicle", back_populates="price_history")
