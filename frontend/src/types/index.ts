export type FuelType = 'nafta' | 'diesel' | 'gnc' | 'electrico' | 'hibrido'
export type TransmissionType = 'manual' | 'automatica' | 'cvt'
export type VehicleStatus = 'disponible' | 'reservado' | 'vendido'

export interface VehiclePhoto {
  id: number
  url?: string
  is_main: number
  uploaded_at: string
}

export interface Vehicle {
  id: number
  marca: string
  modelo: string
  anio: number
  version?: string
  color?: string
  kilometraje: number
  numero_chasis?: string
  patente?: string
  tipo_combustible: FuelType
  transmision: TransmissionType
  precio_costo: number
  precio_venta: number
  estado: VehicleStatus
  descripcion?: string
  created_at: string
  updated_at?: string
  photos: VehiclePhoto[]
}

export interface VehicleListItem {
  id: number
  marca: string
  modelo: string
  anio: number
  version?: string
  color?: string
  kilometraje: number
  patente?: string
  tipo_combustible?: FuelType
  transmision?: TransmissionType
  precio_venta: number
  estado: VehicleStatus
  main_photo_url?: string
}

export interface PriceHistory {
  id: number
  precio_costo_anterior?: number
  precio_venta_anterior?: number
  precio_costo_nuevo?: number
  precio_venta_nuevo?: number
  changed_at: string
  changed_by?: string
}

export interface Customer {
  id: number
  nombre: string
  apellido: string
  dni_cuit: string
  telefono?: string
  email?: string
  direccion?: string
  ciudad?: string
  notas?: string
  created_at: string
  updated_at?: string
  interactions: Interaction[]
  reminders: Reminder[]
}

export interface CustomerListItem {
  id: number
  nombre: string
  apellido: string
  dni_cuit: string
  telefono?: string
  email?: string
  ciudad?: string
  created_at: string
}

export interface Interaction {
  id: number
  tipo: string
  descripcion: string
  created_at: string
  created_by?: string
}

export interface Reminder {
  id: number
  titulo: string
  descripcion?: string
  fecha_recordatorio: string
  completado: number
  created_at: string
}

export type PaymentMethod = 'contado' | 'financiado' | 'permuta' | 'mixto'
export type SaleStatus = 'en_proceso' | 'cerrada' | 'cancelada'

export interface Sale {
  id: number
  vehicle_id: number
  customer_id: number
  precio_venta: number
  forma_pago: PaymentMethod
  estado: SaleStatus
  observaciones?: string
  vehiculo_permuta?: string
  valor_permuta?: number
  entidad_financiera?: string
  monto_financiado?: number
  cuotas?: number
  fecha_venta: string
  created_at: string
  vehicle_info?: string
  customer_info?: string
}

export type WorkOrderStatus = 'pendiente' | 'en_proceso' | 'finalizado' | 'entregado'

export interface WorkOrderItem {
  id: number
  tipo: string
  descripcion: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface WorkOrder {
  id: number
  numero: string
  vehicle_id?: number
  customer_id?: number
  vehiculo_externo?: string
  patente_externa?: string
  kilometraje_ingreso?: number
  descripcion_problema: string
  estado: WorkOrderStatus
  fecha_ingreso: string
  fecha_estimada?: string
  fecha_finalizado?: string
  observaciones?: string
  items: WorkOrderItem[]
  total: number
  vehicle_info?: string
  customer_info?: string
}

export interface DashboardStats {
  stock: { total: number; disponible: number; reservado: number; vendido: number }
  ventas: { hoy_cantidad: number; hoy_total: number; mes_cantidad: number; mes_total: number }
  taller: { pendientes: number; en_proceso: number; ingresos_mes: number }
  clientes: { nuevos_mes: number; total: number }
}

export interface User {
  id: number
  username: string
  full_name: string
  email?: string
  is_admin: boolean
  is_active: boolean
}
