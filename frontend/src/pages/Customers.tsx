import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Eye, MessageSquare, Bell } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { customersApi } from '../services/api'
import type { Customer, CustomerListItem, Interaction, Reminder } from '../types'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

function CustomerForm({ customer, onSave, onClose }: { customer?: Customer; onSave: () => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: customer })

  const onSubmit = async (data: any) => {
    try {
      if (customer) {
        await customersApi.update(customer.id, data)
        toast.success('Cliente actualizado')
      } else {
        await customersApi.create(data)
        toast.success('Cliente creado')
      }
      onSave()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Error al guardar')
    }
  }

  const f = (label: string, name: string, required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
      <input
        {...register(name as any, required ? { required: 'Requerido' } : {})}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {(errors as any)[name] && <p className="text-red-500 text-xs mt-1">{(errors as any)[name].message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {f('Nombre', 'nombre', true)}
        {f('Apellido', 'apellido', true)}
        {f('DNI / CUIT', 'dni_cuit', true)}
        {f('Teléfono', 'telefono')}
        {f('Email', 'email')}
        {f('Ciudad', 'ciudad')}
      </div>
      {f('Dirección', 'direccion')}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <textarea {...register('notas')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : customer ? 'Actualizar' : 'Crear Cliente'}
        </button>
      </div>
    </form>
  )
}

function CustomerDetail({ customer, onClose, onRefresh }: { customer: Customer; onClose: () => void; onRefresh: () => void }) {
  const [tab, setTab] = useState<'info' | 'interactions' | 'reminders'>('info')
  const [interDesc, setInterDesc] = useState('')
  const [interTipo, setInterTipo] = useState('llamada')
  const [remTitle, setRemTitle] = useState('')
  const [remDate, setRemDate] = useState('')
  const [detail, setDetail] = useState<Customer>(customer)

  const refreshDetail = async () => {
    const res = await customersApi.get(customer.id)
    setDetail(res.data)
    onRefresh()
  }

  const addInteraction = async () => {
    if (!interDesc.trim()) return
    await customersApi.addInteraction(customer.id, { tipo: interTipo, descripcion: interDesc })
    setInterDesc('')
    toast.success('Interacción registrada')
    refreshDetail()
  }

  const addReminder = async () => {
    if (!remTitle.trim() || !remDate) return
    await customersApi.addReminder(customer.id, { titulo: remTitle, fecha_recordatorio: remDate })
    setRemTitle(''); setRemDate('')
    toast.success('Recordatorio creado')
    refreshDetail()
  }

  const completeReminder = async (reminderId: number) => {
    await customersApi.completeReminder(customer.id, reminderId)
    toast.success('Recordatorio completado')
    refreshDetail()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {(['info', 'interactions', 'reminders'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'info' ? 'Información' : t === 'interactions' ? 'Interacciones' : 'Recordatorios'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {[
            ['Nombre', `${detail.nombre} ${detail.apellido}`],
            ['DNI/CUIT', detail.dni_cuit],
            ['Teléfono', detail.telefono ?? '—'],
            ['Email', detail.email ?? '—'],
            ['Ciudad', detail.ciudad ?? '—'],
            ['Dirección', detail.direccion ?? '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-gray-100 py-1.5">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
          {detail.notas && (
            <div className="col-span-2 mt-2">
              <p className="text-gray-500 text-xs mb-1">Notas</p>
              <p className="text-sm bg-gray-50 rounded p-2">{detail.notas}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'interactions' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select value={interTipo} onChange={e => setInterTipo(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
              {['llamada', 'email', 'visita', 'whatsapp', 'otro'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={interDesc} onChange={e => setInterDesc(e.target.value)} placeholder="Descripción…" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={addInteraction} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">Agregar</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {detail.interactions.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Sin interacciones</p>
            ) : detail.interactions.slice().reverse().map((i: Interaction) => (
              <div key={i.id} className="border rounded-lg p-3 text-sm">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="capitalize font-medium text-blue-600">{i.tipo}</span>
                  <span>{new Date(i.created_at).toLocaleString('es-AR')}</span>
                </div>
                <p className="text-gray-700">{i.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reminders' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={remTitle} onChange={e => setRemTitle(e.target.value)} placeholder="Recordatorio…" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            <input type="datetime-local" value={remDate} onChange={e => setRemDate(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" />
            <button onClick={addReminder} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">Agregar</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {detail.reminders.length === 0 ? (
              <p className="text-center text-gray-400 py-4">Sin recordatorios</p>
            ) : detail.reminders.map((r: Reminder) => (
              <div key={r.id} className={`border rounded-lg p-3 text-sm ${r.completado ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${r.completado ? 'line-through' : ''}`}>{r.titulo}</p>
                    <p className="text-xs text-gray-400">{new Date(r.fecha_recordatorio).toLocaleString('es-AR')}</p>
                  </div>
                  {!r.completado && (
                    <button onClick={() => completeReminder(r.id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Completar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cerrar</button>
      </div>
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>()
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await customersApi.list(search ? { search } : {})
      setCustomers(res.data)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { load() }, [load])

  const openEdit = async (id: number) => {
    const res = await customersApi.get(id)
    setEditCustomer(res.data)
    setModalOpen(true)
  }

  const openView = async (id: number) => {
    const res = await customersApi.get(id)
    setViewCustomer(res.data)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await customersApi.delete(deleteId)
      toast.success('Cliente eliminado')
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
          <h1 className="text-2xl font-bold text-gray-800">Clientes / CRM</h1>
          <p className="text-gray-500 text-sm">{customers.length} clientes</p>
        </div>
        <button onClick={() => { setEditCustomer(undefined); setModalOpen(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, DNI/CUIT, email, teléfono…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">DNI / CUIT</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Sin resultados</td></tr>
              ) : customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.nombre} {c.apellido}</td>
                  <td className="px-4 py-3 text-gray-600">{c.dni_cuit}</td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.ciudad ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openView(c.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Ver"><Eye size={15} /></button>
                      <button onClick={() => openEdit(c.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => setDeleteId(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditCustomer(undefined) }} title={editCustomer ? 'Editar Cliente' : 'Nuevo Cliente'} size="md">
        <CustomerForm
          customer={editCustomer}
          onSave={() => { setModalOpen(false); setEditCustomer(undefined); load() }}
          onClose={() => { setModalOpen(false); setEditCustomer(undefined) }}
        />
      </Modal>

      {viewCustomer && (
        <Modal open={!!viewCustomer} onClose={() => setViewCustomer(null)} title={`${viewCustomer.nombre} ${viewCustomer.apellido}`} size="md">
          <CustomerDetail customer={viewCustomer} onClose={() => setViewCustomer(null)} onRefresh={load} />
        </Modal>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        message="¿Estás seguro de que querés eliminar este cliente?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
