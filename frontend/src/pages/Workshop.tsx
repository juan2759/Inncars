import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, FileText, PlusCircle, MinusCircle } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import toast from 'react-hot-toast'
import { workshopApi, vehiclesApi, customersApi } from '../services/api'
import type { WorkOrder, VehicleListItem, CustomerListItem } from '../types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const fmt = (n: number) => `$ ${n.toLocaleString('es-AR')}`
const STATUSES = ['pendiente', 'en_proceso', 'finalizado', 'entregado']
const ITEM_TYPES = ['repuesto', 'mano_obra', 'servicio']

function WorkOrderForm({ wo, onSave, onClose }: { wo?: WorkOrder; onSave: () => void; onClose: () => void }) {
  const { register, handleSubmit, watch, control, setValue, formState: { isSubmitting } } = useForm({
    defaultValues: (wo ?? {
      estado: 'pendiente',
      items: [{ tipo: 'servicio', descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }],
    }) as any,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([])
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const items = watch('items')

  useEffect(() => {
    vehiclesApi.list().then(r => setVehicles(r.data))
    customersApi.list().then(r => setCustomers(r.data))
  }, [])

  // Auto-calculate subtotal when qty or price changes
  const updateSubtotal = (index: number) => {
    const item = items[index]
    if (item) {
      const sub = (parseFloat(item.cantidad as any) || 0) * (parseFloat(item.precio_unitario as any) || 0)
      setValue(`items.${index}.subtotal`, sub)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      data.items = data.items.map((i: any) => ({
        ...i,
        cantidad: parseFloat(i.cantidad),
        precio_unitario: parseFloat(i.precio_unitario),
        subtotal: parseFloat(i.cantidad) * parseFloat(i.precio_unitario),
      }))
      if (wo) {
        await workshopApi.update(wo.id, { estado: data.estado, observaciones: data.observaciones })
        toast.success('Orden actualizada')
      } else {
        await workshopApi.create(data)
        toast.success('Orden de trabajo creada')
      }
      onSave()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Error al guardar')
    }
  }

  const total = (items as any[]).reduce((a: number, i: any) => a + (parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0)), 0)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {!wo && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo (stock)</label>
              <select {...register('vehicle_id')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin vehículo en stock</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.marca} {v.modelo} — {v.patente ?? 'Sin patente'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select {...register('customer_id')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin cliente</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehículo externo (si no está en stock)</label>
              <input {...register('vehiculo_externo')} placeholder="Marca, modelo, año…" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
              <input {...register('patente_externa')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Km al ingreso</label>
              <input type="number" {...register('kilometraje_ingreso')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha estimada de entrega</label>
              <input type="datetime-local" {...register('fecha_estimada')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del problema *</label>
        <textarea {...register('descripcion_problema', { required: true })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
        <select {...register('estado')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {!wo && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Items (servicios / repuestos)</label>
            <button type="button" onClick={() => append({ tipo: 'servicio', descripcion: '', cantidad: 1, precio_unitario: 0, subtotal: 0 } as any)} className="text-blue-600 text-xs flex items-center gap-1">
              <PlusCircle size={14} /> Agregar item
            </button>
          </div>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-2">
                  <select {...register(`items.${idx}.tipo`)} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs">
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <input {...register(`items.${idx}.descripcion`)} placeholder="Descripción" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <div className="col-span-2">
                  <input type="number" step="0.01" {...register(`items.${idx}.cantidad`)} onBlur={() => updateSubtotal(idx)} placeholder="Cant." className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <div className="col-span-2">
                  <input type="number" {...register(`items.${idx}.precio_unitario`)} onBlur={() => updateSubtotal(idx)} placeholder="Precio" className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs" />
                </div>
                <div className="col-span-1 text-xs text-right text-gray-600 font-medium">
                  {fmt((parseFloat(items[idx]?.cantidad as any || 0)) * (parseFloat(items[idx]?.precio_unitario as any || 0)))}
                </div>
                <div className="col-span-1 flex justify-center">
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600"><MinusCircle size={16} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-right font-semibold text-gray-800 mt-2">Total: {fmt(total)}</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
        <textarea {...register('observaciones')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : wo ? 'Actualizar' : 'Crear Orden'}
        </button>
      </div>
    </form>
  )
}

export default function Workshop() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editWo, setEditWo] = useState<WorkOrder | undefined>()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.estado = statusFilter
      if (search) params.search = search
      const res = await workshopApi.list(params)
      setOrders(res.data)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await workshopApi.delete(deleteId)
      toast.success('Orden eliminada')
      setDeleteId(null)
      load()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Taller / Reparaciones</h1>
          <p className="text-gray-500 text-sm">{orders.length} órdenes</p>
        </div>
        <button onClick={() => { setEditWo(undefined); setModalOpen(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Nueva Orden
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Buscar por número, patente, vehículo…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos</option>
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
                <th className="px-4 py-3">N° Orden</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Problema</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Ingreso</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-400">Sin órdenes</td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-blue-700">{o.numero}</td>
                  <td className="px-4 py-3 text-gray-700">{o.vehicle_info ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{o.customer_info ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{o.descripcion_problema}</td>
                  <td className="px-4 py-3"><Badge value={o.estado} /></td>
                  <td className="px-4 py-3 font-semibold">{fmt(o.total)}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(o.fecha_ingreso).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <a href={workshopApi.pdf(o.id)} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="PDF"><FileText size={15} /></a>
                      <button onClick={() => { setEditWo(o); setModalOpen(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => setDeleteId(o.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditWo(undefined) }} title={editWo ? `Editar ${editWo.numero}` : 'Nueva Orden de Trabajo'} size="xl">
        <WorkOrderForm
          wo={editWo}
          onSave={() => { setModalOpen(false); setEditWo(undefined); load() }}
          onClose={() => { setModalOpen(false); setEditWo(undefined) }}
        />
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        message="¿Eliminar esta orden de trabajo?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
