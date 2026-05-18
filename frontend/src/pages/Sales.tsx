import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, FileText, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { salesApi, vehiclesApi, customersApi, reportsApi } from '../services/api'
import type { Sale, VehicleListItem, CustomerListItem } from '../types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const fmt = (n: number) => `$ ${n.toLocaleString('es-AR')}`
const PAY_METHODS = ['contado', 'financiado', 'permuta', 'mixto']
const STATUSES = ['en_proceso', 'cerrada', 'cancelada']

function SaleForm({ sale, onSave, onClose }: { sale?: Sale; onSave: () => void; onClose: () => void }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: sale ?? { forma_pago: 'contado', estado: 'en_proceso' },
  })
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([])
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const formaPago = watch('forma_pago')

  useEffect(() => {
    vehiclesApi.list({ estado: 'disponible' }).then(r => setVehicles(r.data))
    customersApi.list().then(r => setCustomers(r.data))
  }, [])

  const onSubmit = async (data: any) => {
    try {
      data.precio_venta = parseFloat(data.precio_venta)
      if (sale) {
        await salesApi.update(sale.id, data)
        toast.success('Venta actualizada')
      } else {
        await salesApi.create(data)
        toast.success('Venta registrada')
      }
      onSave()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!sale && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo *</label>
            <select {...register('vehicle_id', { required: 'Requerido' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar vehículo…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.anio} — {v.patente ?? 'Sin patente'} — {fmt(v.precio_venta)}</option>)}
            </select>
            {errors.vehicle_id && <p className="text-red-500 text-xs mt-1">Requerido</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select {...register('customer_id', { required: 'Requerido' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar cliente…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido} — {c.dni_cuit}</option>)}
            </select>
            {errors.customer_id && <p className="text-red-500 text-xs mt-1">Requerido</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta *</label>
          <input type="number" {...register('precio_venta', { required: 'Requerido' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pago</label>
          <select {...register('forma_pago')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PAY_METHODS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select {...register('estado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {(formaPago === 'permuta' || formaPago === 'mixto') && (
        <div className="grid grid-cols-2 gap-3 p-3 bg-violet-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo Permuta</label>
            <input {...register('vehiculo_permuta')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Marca, modelo, año…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Permuta</label>
            <input type="number" {...register('valor_permuta')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      {(formaPago === 'financiado' || formaPago === 'mixto') && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entidad Financiera</label>
            <input {...register('entidad_financiera')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Financiado</label>
            <input type="number" {...register('monto_financiado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cuotas</label>
            <input type="number" {...register('cuotas')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea {...register('observaciones')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : sale ? 'Actualizar' : 'Registrar Venta'}
        </button>
      </div>
    </form>
  )
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editSale, setEditSale] = useState<Sale | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.estado = statusFilter
      const res = await salesApi.list(params)
      setSales(res.data)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await salesApi.delete(deleteId)
      toast.success('Venta eliminada')
      setDeleteId(null)
      load()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const totalCerradas = sales.filter(s => s.estado === 'cerrada').reduce((a, s) => a + s.precio_venta, 0)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <p className="text-gray-500 text-sm">{sales.length} registros — Total cerradas: {fmt(totalCerradas)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => reportsApi.exportSales(statusFilter ? { estado: statusFilter } : {})} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download size={16} /> Excel
          </button>
          <button onClick={() => { setEditSale(undefined); setModalOpen(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Plus size={16} /> Nueva Venta
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Forma de Pago</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Sin ventas registradas</td></tr>
              ) : sales.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{s.vehicle_info ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{s.customer_info ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(s.precio_venta)}</td>
                  <td className="px-4 py-3"><Badge value={s.forma_pago} /></td>
                  <td className="px-4 py-3"><Badge value={s.estado} /></td>
                  <td className="px-4 py-3 text-gray-400">{new Date(s.fecha_venta).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <a href={salesApi.pdf(s.id)} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="PDF"><FileText size={15} /></a>
                      <button onClick={() => { setEditSale(s); setModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditSale(undefined) }} title={editSale ? 'Editar Venta' : 'Nueva Venta'} size="lg">
        <SaleForm
          sale={editSale}
          onSave={() => { setModalOpen(false); setEditSale(undefined); load() }}
          onClose={() => { setModalOpen(false); setEditSale(undefined) }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        message="¿Eliminar esta venta? El vehículo volverá a estado disponible."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
