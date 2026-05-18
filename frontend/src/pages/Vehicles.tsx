import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, Eye, Image, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { vehiclesApi, reportsApi } from '../services/api'
import type { VehicleListItem, Vehicle, PriceHistory } from '../types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const FUEL_OPTIONS = ['nafta', 'diesel', 'gnc', 'electrico', 'hibrido']
const TRANS_OPTIONS = ['manual', 'automatica', 'cvt']
const STATUS_OPTIONS = ['disponible', 'reservado', 'vendido']
const fmt = (n: number) => `$ ${n.toLocaleString('es-AR')}`

function VehicleForm({ vehicle, onSave, onClose }: { vehicle?: Vehicle; onSave: () => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: vehicle ?? {
      tipo_combustible: 'nafta', transmision: 'manual', estado: 'disponible',
      kilometraje: 0, precio_costo: 0, precio_venta: 0,
    },
  })

  const onSubmit = async (data: any) => {
    try {
      if (vehicle) {
        await vehiclesApi.update(vehicle.id, data)
        toast.success('Vehículo actualizado')
      } else {
        await vehiclesApi.create(data)
        toast.success('Vehículo creado')
      }
      onSave()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Error al guardar')
    }
  }

  const field = (label: string, name: string, opts: any = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...register(name as any, opts.validate ?? {})}
        type={opts.type ?? 'text'}
        placeholder={opts.placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {(errors as any)[name] && <p className="text-red-500 text-xs mt-1">{(errors as any)[name].message}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {field('Marca *', 'marca', { validate: { required: (v: string) => v?.trim() || 'Requerido' } })}
        {field('Modelo *', 'modelo', { validate: { required: (v: string) => v?.trim() || 'Requerido' } })}
        {field('Año *', 'anio', { type: 'number', validate: { required: (v: number) => v > 1900 || 'Inválido' } })}
        {field('Versión', 'version')}
        {field('Color', 'color')}
        {field('Kilometraje', 'kilometraje', { type: 'number' })}
        {field('N° Chasis', 'numero_chasis')}
        {field('Patente', 'patente')}
        {field('Precio Costo *', 'precio_costo', { type: 'number', validate: { required: (v: number) => v >= 0 || 'Inválido' } })}
        {field('Precio Venta *', 'precio_venta', { type: 'number', validate: { required: (v: number) => v >= 0 || 'Inválido' } })}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Combustible</label>
          <select {...register('tipo_combustible')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {FUEL_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Transmisión</label>
          <select {...register('transmision')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {TRANS_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select {...register('estado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea {...register('descripcion')} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancelar</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : vehicle ? 'Actualizar' : 'Crear Vehículo'}
        </button>
      </div>
    </form>
  )
}

function PhotoManager({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [photos, setPhotos] = useState(vehicle.photos)
  const [uploading, setUploading] = useState(false)

  const refresh = async () => {
    const res = await vehiclesApi.get(vehicle.id)
    setPhotos(res.data.photos)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setUploading(true)
    for (const file of Array.from(files)) {
      try {
        await vehiclesApi.uploadPhoto(vehicle.id, file, photos.length === 0)
        toast.success(`${file.name} subida`)
      } catch {
        toast.error(`Error al subir ${file.name}`)
      }
    }
    await refresh()
    setUploading(false)
  }

  const handleDelete = async (photoId: number) => {
    await vehiclesApi.deletePhoto(vehicle.id, photoId)
    toast.success('Foto eliminada')
    await refresh()
  }

  const handleSetMain = async (photoId: number) => {
    await vehiclesApi.setMainPhoto(vehicle.id, photoId)
    toast.success('Foto principal actualizada')
    await refresh()
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 hover:bg-blue-100 transition">
        <Image size={20} className="text-blue-500" />
        <span className="text-sm text-blue-600 font-medium">
          {uploading ? 'Subiendo...' : 'Seleccionar fotos (JPG, PNG, WEBP)'}
        </span>
        <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {photos.length === 0 ? (
        <p className="text-center text-gray-400 py-6">Sin fotos</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(p => (
            <div key={p.id} className="relative group rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={p.url ?? ''}
                alt=""
                className="w-full h-28 object-cover"
              />
              {p.is_main === 1 && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">Principal</span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                {p.is_main !== 1 && (
                  <button onClick={() => handleSetMain(p.id)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">Principal</button>
                )}
                <button onClick={() => handleDelete(p.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cerrar</button>
      </div>
    </div>
  )
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | undefined>()
  const [viewVehicle, setViewVehicle] = useState<Vehicle | null>(null)
  const [photoVehicle, setPhotoVehicle] = useState<Vehicle | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (statusFilter) params.estado = statusFilter
      const res = await vehiclesApi.list(params)
      setVehicles(res.data)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  const openEdit = async (id: number) => {
    const res = await vehiclesApi.get(id)
    setEditVehicle(res.data)
    setModalOpen(true)
  }

  const openView = async (id: number) => {
    const res = await vehiclesApi.get(id)
    setViewVehicle(res.data)
  }

  const openPhotos = async (id: number) => {
    const res = await vehiclesApi.get(id)
    setPhotoVehicle(res.data)
  }

  const openHistory = async (id: number) => {
    const res = await vehiclesApi.priceHistory(id)
    setPriceHistory(res.data)
    setHistoryOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await vehiclesApi.delete(deleteId)
      toast.success('Vehículo eliminado')
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
          <h1 className="text-2xl font-bold text-gray-800">Stock de Vehículos</h1>
          <p className="text-gray-500 text-sm">{vehicles.length} vehículos</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => reportsApi.exportStock()} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download size={16} /> Excel
          </button>
          <button
            onClick={() => { setEditVehicle(undefined); setModalOpen(true) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus size={16} /> Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar marca, modelo, patente, chasis…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Vehículo</th>
                <th className="px-4 py-3">Patente</th>
                <th className="px-4 py-3">Km</th>
                <th className="px-4 py-3">Precio Venta</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400">Sin resultados</td></tr>
              ) : vehicles.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {v.main_photo_url ? (
                      <img src={v.main_photo_url} alt="" className="w-12 h-10 object-cover rounded-lg" />
                    ) : (
                      <div className="w-12 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300">
                        <Image size={18} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{v.marca} {v.modelo}</p>
                    <p className="text-gray-400 text-xs">{v.anio}{v.version ? ` · ${v.version}` : ''}{v.color ? ` · ${v.color}` : ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.patente ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{v.kilometraje.toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{fmt(v.precio_venta)}</td>
                  <td className="px-4 py-3"><Badge value={v.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openView(v.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Ver"><Eye size={15} /></button>
                      <button onClick={() => openPhotos(v.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Fotos"><Image size={15} /></button>
                      <button onClick={() => openEdit(v.id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => setDeleteId(v.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditVehicle(undefined) }} title={editVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'} size="lg">
        <VehicleForm
          vehicle={editVehicle}
          onSave={() => { setModalOpen(false); setEditVehicle(undefined); load() }}
          onClose={() => { setModalOpen(false); setEditVehicle(undefined) }}
        />
      </Modal>

      {/* View Modal */}
      {viewVehicle && (
        <Modal open={!!viewVehicle} onClose={() => setViewVehicle(null)} title={`${viewVehicle.marca} ${viewVehicle.modelo} ${viewVehicle.anio}`} size="lg">
          <div className="space-y-4">
            {viewVehicle.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {viewVehicle.photos.map(p => (
                  <img key={p.id} src={p.url ?? ''} alt="" className="w-full h-32 object-cover rounded-lg" />
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ['Marca', viewVehicle.marca], ['Modelo', viewVehicle.modelo],
                ['Año', viewVehicle.anio], ['Versión', viewVehicle.version ?? '—'],
                ['Color', viewVehicle.color ?? '—'], ['Km', viewVehicle.kilometraje.toLocaleString()],
                ['Patente', viewVehicle.patente ?? '—'], ['Chasis', viewVehicle.numero_chasis ?? '—'],
                ['Combustible', viewVehicle.tipo_combustible], ['Transmisión', viewVehicle.transmision],
                ['Precio Costo', fmt(viewVehicle.precio_costo)], ['Precio Venta', fmt(viewVehicle.precio_venta)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-100 py-1.5">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-between pt-2">
              <button onClick={() => openHistory(viewVehicle.id)} className="text-sm text-blue-600 hover:underline">
                Ver historial de precios
              </button>
              <button onClick={() => setViewVehicle(null)} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cerrar</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Photos Modal */}
      {photoVehicle && (
        <Modal open={!!photoVehicle} onClose={() => { setPhotoVehicle(null); load() }} title={`Fotos — ${photoVehicle.marca} ${photoVehicle.modelo}`} size="lg">
          <PhotoManager vehicle={photoVehicle} onClose={() => { setPhotoVehicle(null); load() }} />
        </Modal>
      )}

      {/* Price History Modal */}
      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Historial de Precios" size="md">
        {priceHistory.length === 0 ? (
          <p className="text-center text-gray-400 py-6">Sin cambios registrados</p>
        ) : (
          <div className="space-y-3">
            {priceHistory.map(h => (
              <div key={h.id} className="border rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-400 text-xs mb-2">
                  <span>{new Date(h.changed_at).toLocaleString('es-AR')}</span>
                  <span>{h.changed_by}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Costo:</span>{' '}
                    <span className="line-through text-red-400">{fmt(h.precio_costo_anterior ?? 0)}</span>{' → '}
                    <span className="text-green-600 font-medium">{fmt(h.precio_costo_nuevo ?? 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Venta:</span>{' '}
                    <span className="line-through text-red-400">{fmt(h.precio_venta_anterior ?? 0)}</span>{' → '}
                    <span className="text-green-600 font-medium">{fmt(h.precio_venta_nuevo ?? 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteId !== null}
        message="¿Estás seguro de que querés eliminar este vehículo? También se eliminarán sus fotos."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
