from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class PaymentMethod(str, enum.Enum):
    contado = "contado"
    financiado = "financiado"
    permuta = "permuta"
    mixto = "mixto"

class SaleStatus(str, enum.Enum):
    en_proceso = "en_proceso"
    cerrada = "cerrada"
    cancelada = "cancelada"

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    precio_venta = Column(Float, nullable=False)
    forma_pago = Column(Enum(PaymentMethod), nullable=False)
    estado = Column(Enum(SaleStatus), default=SaleStatus.en_proceso, index=True)
    observaciones = Column(Text, nullable=True)
    # Permuta
    vehiculo_permuta = Column(String(200), nullable=True)
    valor_permuta = Column(Float, nullable=True)
    # Financiado
    entidad_financiera = Column(String(100), nullable=True)
    monto_financiado = Column(Float, nullable=True)
    cuotas = Column(Integer, nullable=True)
    # Fechas
    fecha_venta = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100), nullable=True)

    vehicle = relationship("Vehicle", back_populates="sales")
    customer = relationship("Customer", back_populates="sales")
