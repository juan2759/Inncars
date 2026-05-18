from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    apellido = Column(String(100), nullable=False, index=True)
    dni_cuit = Column(String(20), unique=True, nullable=False, index=True)
    telefono = Column(String(30), nullable=True)
    email = Column(String(100), nullable=True)
    direccion = Column(String(200), nullable=True)
    ciudad = Column(String(100), nullable=True)
    notas = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    interactions = relationship("CustomerInteraction", back_populates="customer", cascade="all, delete-orphan")
    reminders = relationship("CustomerReminder", back_populates="customer", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="customer")
    work_orders = relationship("WorkOrder", back_populates="customer")


class CustomerInteraction(Base):
    __tablename__ = "customer_interactions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(50), nullable=False)  # llamada, email, visita, whatsapp
    descripcion = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100), nullable=True)

    customer = relationship("Customer", back_populates="interactions")


class CustomerReminder(Base):
    __tablename__ = "customer_reminders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_recordatorio = Column(DateTime(timezone=True), nullable=False)
    completado = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="reminders")
