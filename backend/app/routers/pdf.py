from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from fpdf import FPDF
import io
from datetime import datetime

from app.database import get_db
from app.models.sale import Sale, SaleStatus
from app.models.vehicle import Vehicle
from app.models.customer import Customer
from app.models.workshop import WorkOrder, WorkOrderItem
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/pdf", tags=["pdf"])

class AutoPDF(FPDF):
    def header(self):
        self.set_fill_color(30, 58, 95)
        self.rect(0, 0, 210, 25, "F")
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(255, 255, 255)
        self.cell(0, 15, "AUTOMOTORA", align="C", ln=True)
        self.set_font("Helvetica", "", 9)
        self.cell(0, 8, "Sistema de Gestión Automotora", align="C", ln=True)
        self.set_text_color(0, 0, 0)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Generado: {datetime.now().strftime('%d/%m/%Y %H:%M')} - Pág. {self.page_no()}", align="C")

    def section_title(self, title: str):
        self.set_fill_color(240, 244, 248)
        self.set_font("Helvetica", "B", 11)
        self.cell(0, 8, f"  {title}", ln=True, fill=True)
        self.ln(2)

    def labeled_row(self, label: str, value: str, w1=60, w2=130):
        self.set_font("Helvetica", "B", 10)
        self.cell(w1, 7, label + ":", border="B")
        self.set_font("Helvetica", "", 10)
        self.cell(w2, 7, str(value), border="B", ln=True)

@router.get("/sale/{sale_id}")
def sale_pdf(sale_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    vehicle = db.query(Vehicle).filter(Vehicle.id == sale.vehicle_id).first()
    customer = db.query(Customer).filter(Customer.id == sale.customer_id).first()

    pdf = AutoPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"CONTRATO DE COMPRAVENTA N° {sale.id:05d}", align="C", ln=True)
    pdf.ln(5)

    pdf.section_title("DATOS DEL VENDEDOR")
    pdf.labeled_row("Empresa", "Automotora")
    pdf.labeled_row("Fecha", sale.fecha_venta.strftime("%d/%m/%Y") if sale.fecha_venta else "")
    pdf.ln(4)

    pdf.section_title("DATOS DEL COMPRADOR")
    if customer:
        pdf.labeled_row("Nombre", f"{customer.nombre} {customer.apellido}")
        pdf.labeled_row("DNI / CUIT", customer.dni_cuit)
        pdf.labeled_row("Teléfono", customer.telefono or "-")
        pdf.labeled_row("Email", customer.email or "-")
        pdf.labeled_row("Dirección", customer.direccion or "-")
    pdf.ln(4)

    pdf.section_title("DATOS DEL VEHÍCULO")
    if vehicle:
        pdf.labeled_row("Marca / Modelo", f"{vehicle.marca} {vehicle.modelo}")
        pdf.labeled_row("Año", str(vehicle.anio))
        pdf.labeled_row("Versión", vehicle.version or "-")
        pdf.labeled_row("Color", vehicle.color or "-")
        pdf.labeled_row("Patente", vehicle.patente or "-")
        pdf.labeled_row("Chasis N°", vehicle.numero_chasis or "-")
        pdf.labeled_row("Km", f"{vehicle.kilometraje:,} km")
    pdf.ln(4)

    pdf.section_title("CONDICIONES DE VENTA")
    pdf.labeled_row("Precio de Venta", f"$ {sale.precio_venta:,.2f}")
    pdf.labeled_row("Forma de Pago", sale.forma_pago.value.capitalize())
    if sale.vehiculo_permuta:
        pdf.labeled_row("Vehículo Permuta", sale.vehiculo_permuta)
        pdf.labeled_row("Valor Permuta", f"$ {sale.valor_permuta:,.2f}" if sale.valor_permuta else "-")
    if sale.entidad_financiera:
        pdf.labeled_row("Entidad Financiera", sale.entidad_financiera)
        pdf.labeled_row("Monto Financiado", f"$ {sale.monto_financiado:,.2f}" if sale.monto_financiado else "-")
        pdf.labeled_row("Cuotas", str(sale.cuotas) if sale.cuotas else "-")
    pdf.ln(4)

    if sale.observaciones:
        pdf.section_title("OBSERVACIONES")
        pdf.set_font("Helvetica", "", 10)
        pdf.multi_cell(0, 7, sale.observaciones)
        pdf.ln(4)

    pdf.ln(20)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(80, 7, "_" * 30, align="C")
    pdf.cell(30, 7, "")
    pdf.cell(80, 7, "_" * 30, align="C", ln=True)
    pdf.cell(80, 7, "Firma del Vendedor", align="C")
    pdf.cell(30, 7, "")
    pdf.cell(80, 7, "Firma del Comprador", align="C", ln=True)

    output = io.BytesIO(pdf.output())
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=contrato_{sale_id:05d}.pdf"},
    )

@router.get("/workorder/{wo_id}")
def work_order_pdf(wo_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    wo = db.query(WorkOrder).filter(WorkOrder.id == wo_id).first()
    if not wo:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    items = db.query(WorkOrderItem).filter(WorkOrderItem.work_order_id == wo_id).all()
    customer = db.query(Customer).filter(Customer.id == wo.customer_id).first() if wo.customer_id else None
    vehicle = db.query(Vehicle).filter(Vehicle.id == wo.vehicle_id).first() if wo.vehicle_id else None
    total = sum(i.subtotal for i in items)

    pdf = AutoPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, f"ORDEN DE TRABAJO {wo.numero}", align="C", ln=True)
    pdf.ln(5)

    pdf.section_title("DATOS DEL VEHÍCULO")
    if vehicle:
        pdf.labeled_row("Vehículo", f"{vehicle.marca} {vehicle.modelo} {vehicle.anio}")
        pdf.labeled_row("Patente", vehicle.patente or "-")
    elif wo.vehiculo_externo:
        pdf.labeled_row("Vehículo", wo.vehiculo_externo)
        pdf.labeled_row("Patente", wo.patente_externa or "-")
    pdf.labeled_row("Km Ingreso", f"{wo.kilometraje_ingreso:,} km" if wo.kilometraje_ingreso else "-")
    pdf.labeled_row("Fecha Ingreso", wo.fecha_ingreso.strftime("%d/%m/%Y") if wo.fecha_ingreso else "-")
    pdf.ln(4)

    if customer:
        pdf.section_title("DATOS DEL CLIENTE")
        pdf.labeled_row("Nombre", f"{customer.nombre} {customer.apellido}")
        pdf.labeled_row("Teléfono", customer.telefono or "-")
        pdf.ln(4)

    pdf.section_title("DESCRIPCIÓN DEL TRABAJO")
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 7, wo.descripcion_problema)
    pdf.ln(4)

    if items:
        pdf.section_title("DETALLE DE SERVICIOS Y REPUESTOS")
        # Table header
        pdf.set_fill_color(30, 58, 95)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(20, 7, "Tipo", fill=True, border=1)
        pdf.cell(90, 7, "Descripción", fill=True, border=1)
        pdf.cell(20, 7, "Cant.", fill=True, border=1, align="C")
        pdf.cell(30, 7, "P. Unit.", fill=True, border=1, align="R")
        pdf.cell(30, 7, "Subtotal", fill=True, border=1, align="R", ln=True)
        pdf.set_text_color(0, 0, 0)
        pdf.set_font("Helvetica", "", 9)

        for i, item in enumerate(items):
            fill = i % 2 == 0
            if fill:
                pdf.set_fill_color(245, 247, 250)
            pdf.cell(20, 7, item.tipo.capitalize(), fill=fill, border=1)
            pdf.cell(90, 7, item.descripcion[:50], fill=fill, border=1)
            pdf.cell(20, 7, str(item.cantidad), fill=fill, border=1, align="C")
            pdf.cell(30, 7, f"$ {item.precio_unitario:,.0f}", fill=fill, border=1, align="R")
            pdf.cell(30, 7, f"$ {item.subtotal:,.0f}", fill=fill, border=1, align="R", ln=True)

        pdf.set_font("Helvetica", "B", 11)
        pdf.cell(160, 8, "TOTAL:", align="R")
        pdf.cell(30, 8, f"$ {total:,.2f}", align="R", border="T", ln=True)

    output = io.BytesIO(pdf.output())
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=orden_{wo.numero}.pdf"},
    )
