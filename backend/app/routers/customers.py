from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List

from app.database import get_db
from app.models.customer import Customer, CustomerInteraction, CustomerReminder
from app.schemas.customer import (
    CustomerCreate, CustomerUpdate, CustomerOut, CustomerListOut,
    InteractionCreate, InteractionOut, ReminderCreate, ReminderOut,
)
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/customers", tags=["customers"])

def customer_or_404(customer_id: int, db: Session) -> Customer:
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return c

@router.get("", response_model=List[CustomerListOut])
def list_customers(
    search: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Customer)
    if search:
        term = f"%{search}%"
        q = q.filter(or_(
            Customer.nombre.ilike(term),
            Customer.apellido.ilike(term),
            Customer.dni_cuit.ilike(term),
            Customer.email.ilike(term),
            Customer.telefono.ilike(term),
        ))
    return q.order_by(Customer.apellido).offset(skip).limit(limit).all()

@router.post("", response_model=CustomerOut, status_code=201)
def create_customer(data: CustomerCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.query(Customer).filter(Customer.dni_cuit == data.dni_cuit).first():
        raise HTTPException(status_code=400, detail="Ya existe un cliente con ese DNI/CUIT")
    customer = Customer(**data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer

@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Customer).options(
        joinedload(Customer.interactions),
        joinedload(Customer.reminders),
    ).filter(Customer.id == customer_id).first() or customer_or_404(customer_id, db)

@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, data: CustomerUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    customer = customer_or_404(customer_id, db)
    for key, val in data.model_dump(exclude_none=True).items():
        setattr(customer, key, val)
    db.commit()
    db.refresh(customer)
    return customer

@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    customer = customer_or_404(customer_id, db)
    db.delete(customer)
    db.commit()

# Interactions
@router.post("/{customer_id}/interactions", response_model=InteractionOut, status_code=201)
def add_interaction(
    customer_id: int, data: InteractionCreate,
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    customer_or_404(customer_id, db)
    interaction = CustomerInteraction(
        customer_id=customer_id, **data.model_dump(), created_by=current_user.username
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction

@router.delete("/{customer_id}/interactions/{interaction_id}", status_code=204)
def delete_interaction(customer_id: int, interaction_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    item = db.query(CustomerInteraction).filter(
        CustomerInteraction.id == interaction_id, CustomerInteraction.customer_id == customer_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Interacción no encontrada")
    db.delete(item)
    db.commit()

# Reminders
@router.get("/{customer_id}/reminders", response_model=List[ReminderOut])
def list_reminders(customer_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    customer_or_404(customer_id, db)
    return db.query(CustomerReminder).filter(CustomerReminder.customer_id == customer_id).all()

@router.post("/{customer_id}/reminders", response_model=ReminderOut, status_code=201)
def add_reminder(customer_id: int, data: ReminderCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    customer_or_404(customer_id, db)
    reminder = CustomerReminder(customer_id=customer_id, **data.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.put("/{customer_id}/reminders/{reminder_id}/complete", status_code=200)
def complete_reminder(customer_id: int, reminder_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    reminder = db.query(CustomerReminder).filter(
        CustomerReminder.id == reminder_id, CustomerReminder.customer_id == customer_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Recordatorio no encontrado")
    reminder.completado = 1
    db.commit()
    return {"message": "Recordatorio completado"}

@router.get("/reminders/pending", response_model=List[ReminderOut])
def pending_reminders(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(CustomerReminder).filter(CustomerReminder.completado == 0).order_by(
        CustomerReminder.fecha_recordatorio
    ).all()
