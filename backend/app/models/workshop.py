from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class WorkOrderStatus(str, enum.Enum):
    pendiente = "pendiente"
    en_proceso = "en_proceso"
    finalizado = "finalizado"
    entregado = "entregado"

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), unique=True, nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    # Datos del vehículo manual si no está en stock
    vehiculo_externo = Column(String(200), nullable=True)
    patente_externa = Column(String(20), nullable=True)
    kilometraje_ingreso = Column(Integer, nullable=True)
    descripcion_problema = Column(Text, nullable=False)
    estado = Column(Enum(WorkOrderStatus), default=WorkOrderStatus.pendiente, index=True)
    fecha_ingreso = Column(DateTime(timezone=True), server_default=func.now())
    fecha_estimada = Column(DateTime(timezone=True), nullable=True)
    fecha_finalizado = Column(DateTime(timezone=True), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    vehicle = relationship("Vehicle", back_populates="work_orders")
    customer = relationship("Customer", back_populates="work_orders")
    items = relationship("WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan")

    @property
    def total(self):
        return sum(item.subtotal for item in self.items)


class WorkOrderItem(Base):
    __tablename__ = "work_order_items"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(20), nullable=False)  # repuesto / mano_obra / servicio
    descripcion = Column(String(300), nullable=False)
    cantidad = Column(Float, default=1)
    precio_unitario = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    work_order = relationship("WorkOrder", back_populates="items")
