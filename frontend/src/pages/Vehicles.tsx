import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, SlidersHorizontal, Edit2, Trash2, Image as ImageIcon,
  X, ChevronLeft, ChevronRight, Download, Car, Heart, Share2, Eye,
  Fuel, Gauge, Calendar, Layers,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { vehiclesApi, reportsApi } from '../services/api'
import type { VehicleListItem, Vehicle, PriceHistory } from '../types'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// ── Utils ──────────────────────────────────────────────────────────────────

const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
const fmtPrice = (n: number) => `USD ${new Intl.NumberFormat('es-AR').format(n)}`
const fmtId   = (id: number) => `AUTO-${String(id).padStart(4, '0')}`
const fmtKm   = (n: number) => `${new Intl.NumberFormat('es-AR').format(n)} km`

const FUEL_OPTIONS   = ['nafta', 'diesel', 'gnc', 'electrico', 'hibrido']
const TRANS_OPTIONS  = ['manual', 'automatica', 'cvt']
const STATUS_OPTIONS = ['disponible', 'reservado', 'vendido']
const PAGE_SIZE = 6

// ── VehicleForm ────────────────────────────────────────────────────────────

function VehicleForm({ vehicle, onSave, onClose }: { vehicle?: Vehicle; onSave: () => void; onClose: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: vehicle ?? {
      tipo_combustible: 'nafta', transmision: 'manual',
      estado: 'disponible', kilometraje: 0, precio_costo: 0, precio_venta: 0,
    },
  })

  const onSubmit = async (data: any) => {
    try {
      vehicle ? await vehiclesApi.update(vehicle.id, data) : await vehiclesApi.create(data)
      toast.success(vehicle ? 'Vehículo actualizado' : 'Vehículo creado')
      onSave()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Error al guardar')
    }
  }

  const field = (label: string, name: string, opts: any = {}) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      <input
        {...register(name as any, opts.validate ?? {})}
        type={opts.type ?? 'text'}
        placeholder={opts.placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
      {(errors as any)[name] && (
        <p className="text-red-500 text-xs mt-1">{(errors as any)[name].message}</p>
      )}
    </div>
  )

  const sel = (label: string, name: string, options: string[]) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">{label}</label>
      <select
        {...register(name as any)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {options.map(o => <option key={o} value={o}>{cap(o)}</option>)}
      </select>
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {field('Marca *', 'marca', { validate: { r: (v: string) => v?.trim() || 'Requerido' } })}
        {field('Modelo *', 'modelo', { validate: { r: (v: string) => v?.trim() || 'Requerido' } })}
        {field('Año *', 'anio', { type: 'number' })}
        {field('Versión', 'version')}
        {field('Color', 'color')}
        {field('Kilometraje', 'kilometraje', { type: 'number' })}
        {field('N° Chasis', 'numero_chasis')}
        {field('Patente', 'patente')}
        {field('Precio Costo *', 'precio_costo', { type: 'number' })}
        {field('Precio Venta *', 'precio_venta', { type: 'number' })}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sel('Combustible', 'tipo_combustible', FUEL_OPTIONS)}
        {sel('Transmisión', 'transmision', TRANS_OPTIONS)}
        {sel('Estado', 'estado', STATUS_OPTIONS)}
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Descripción</label>
        <textarea
          {...register('descripcion')}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="flex gap-3 justify-end pt-1">
        <button type="button" onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting}
          className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm font-medium disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : vehicle ? 'Actualizar' : 'Crear vehículo'}
        </button>
      </div>
    </form>
  )
}

// ── PhotoManager ───────────────────────────────────────────────────────────

function PhotoManager({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const [photos, setPhotos] = useState(vehicle.photos)
  const [uploading, setUploading] = useState(false)

  const refresh = async () => {
    const res = await vehiclesApi.get(vehicle.id)
    setPhotos(res.data.photos)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setUploading(true)
    for (const file of Array.from(e.target.files)) {
      try {
        await vehiclesApi.uploadPhoto(vehicle.id, file, photos.length === 0)
        toast.success(`${file.name} subida`)
      } catch { toast.error(`Error con ${file.name}`) }
    }
    await refresh()
    setUploading(false)
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 cursor-pointer bg-red-50 border-2 border-dashed border-red-200 rounded-xl p-4 hover:bg-red-100 transition">
        <ImageIcon size={20} className="text-red-500" />
        <span className="text-sm text-red-600 font-medium">
          {uploading ? 'Subiendo…' : 'Seleccionar fotos (JPG, PNG, WEBP)'}
        </span>
        <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleUpload} disabled={uploading} />
      </label>

      {photos.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Sin fotos cargadas</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map(p => (
            <div key={p.id} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100">
              <img src={p.url ?? ''} alt="" className="w-full h-full object-cover" />
              {p.is_main === 1 && (
                <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Principal
                </span>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                {p.is_main !== 1 && (
                  <button onClick={async () => { await vehiclesApi.setMainPhoto(vehicle.id, p.id); refresh(); toast.success('Foto principal actualizada') }}
                    className="text-xs bg-white text-gray-800 px-2 py-1 rounded-lg font-medium">
                    Principal
                  </button>
                )}
                <button onClick={async () => { await vehiclesApi.deletePhoto(vehicle.id, p.id); refresh(); toast.success('Foto eliminada') }}
                  className="text-xs bg-red-600 text-white px-2 py-1 rounded-lg font-medium">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
          Cerrar
        </button>
      </div>
    </div>
  )
}

// ── VehicleCard ────────────────────────────────────────────────────────────

function VehicleCard({
  v, isSelected, onSelect, onEdit, onPhotos, onDelete,
}: {
  v: VehicleListItem
  isSelected: boolean
  onSelect: (id: number) => void
  onEdit: (id: number) => void
  onPhotos: (id: number) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden group cursor-pointer
      ${isSelected ? 'border-red-400 shadow-md ring-1 ring-red-300' : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'}`}
    >
      {/* Photo */}
      <div className="relative aspect-[3/2] bg-gray-100 overflow-hidden" onClick={() => onSelect(v.id)}>
        {v.main_photo_url ? (
          <img src={v.main_photo_url} alt={`${v.marca} ${v.modelo}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <Car size={36} />
            <span className="text-xs mt-1 text-gray-400">Sin foto</span>
          </div>
        )}
        <button className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          onClick={e => e.stopPropagation()} title="Guardar">
          <Heart size={13} className="text-gray-400" />
        </button>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 mb-1.5 flex-wrap">
          <span className="flex items-center gap-1"><Calendar size={10} />{v.anio}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Gauge size={10} />{fmtKm(v.kilometraje)}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Fuel size={10} />{cap(v.tipo_combustible ?? '')}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Layers size={10} />{cap(v.transmision ?? '')}</span>
        </div>

        <h3 className="font-bold text-gray-900 text-sm leading-snug truncate" onClick={() => onSelect(v.id)}>
          {v.marca} {v.modelo} {v.version ?? ''}
        </h3>

        <div className="flex items-center justify-between mt-2.5">
          <span className="text-red-600 font-black text-lg leading-none">{fmtPrice(v.precio_venta)}</span>
          <Badge value={v.estado} dot />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 mt-3.5 pt-3 border-t border-gray-100">
          <button onClick={() => onSelect(v.id)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors">
            <Eye size={12} /> Ver ficha
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(v.id) }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
            <Edit2 size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); onPhotos(v.id) }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Fotos">
            <ImageIcon size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(v.id) }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── VehicleDetailPanel ─────────────────────────────────────────────────────

function VehicleDetailPanel({
  vehicle, loading, onClose, onEdit, onDelete, onPhotos,
}: {
  vehicle: Vehicle | null
  loading: boolean
  onClose: () => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onPhotos: (id: number) => void
}) {
  const [tab, setTab] = useState<'info' | 'comercial' | 'historial'>('info')
  const [activePhoto, setActivePhoto] = useState(0)
  const [history, setHistory] = useState<PriceHistory[]>([])

  useEffect(() => { setActivePhoto(0); setTab('info') }, [vehicle?.id])
  useEffect(() => {
    if (tab === 'historial' && vehicle) {
      vehiclesApi.priceHistory(vehicle.id).then(r => setHistory(r.data)).catch(() => {})
    }
  }, [tab, vehicle])

  const isOpen = !!vehicle || loading

  return (
    <div className={`fixed top-0 right-0 h-screen w-[380px] bg-white border-l border-gray-200 shadow-2xl z-20
      flex flex-col transition-transform duration-300 ease-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {loading || !vehicle ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-400">Cargando ficha…</p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between bg-white shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="font-bold text-gray-900 text-base leading-tight truncate">
                {vehicle.marca} {vehicle.modelo} {vehicle.version ?? ''}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge value={vehicle.estado} dot />
                <span className="text-xs text-red-500 font-mono font-semibold">{fmtId(vehicle.id)}</span>
              </div>
            </div>
            <button onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
              <X size={17} />
            </button>
          </div>

          {/* Photos */}
          <div className="bg-gray-950 shrink-0">
            {vehicle.photos.length > 0 ? (
              <>
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={vehicle.photos[activePhoto]?.url ?? ''}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                {vehicle.photos.length > 1 && (
                  <div className="flex gap-1.5 p-2 overflow-x-auto">
                    {vehicle.photos.map((p, i) => (
                      <button key={p.id} onClick={() => setActivePhoto(i)}
                        className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-all
                          ${i === activePhoto ? 'border-red-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                        <img src={p.url ?? ''} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-gray-600">
                <Car size={40} className="opacity-20 mb-2" />
                <p className="text-xs text-gray-500">Sin fotos</p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 bg-white shrink-0 text-sm">
            {([['info', 'Información'], ['comercial', 'Comercial'], ['historial', 'Historial']] as const).map(([key, lbl]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 py-2.5 font-medium transition-colors
                  ${tab === key ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-400 hover:text-gray-700'}`}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">

            {/* Información */}
            {tab === 'info' && (
              <div className="p-4 space-y-1.5">
                {([
                  ['Marca / Modelo', `${vehicle.marca} ${vehicle.modelo}`],
                  ['Año',            vehicle.anio],
                  ['Kilómetros',     fmtKm(vehicle.kilometraje)],
                  ['Motor / Chasis', vehicle.numero_chasis ?? '—'],
                  ['Combustible',    cap(vehicle.tipo_combustible)],
                  ['Caja',           cap(vehicle.transmision)],
                  ['Matrícula',      vehicle.patente ?? '—'],
                  ['Color',          vehicle.color ?? '—'],
                  ['Versión',        vehicle.version ?? '—'],
                ] as [string, string | number][]).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-400 flex items-center gap-2">{k}</span>
                    <span className="font-semibold text-gray-800 text-right">{v}</span>
                  </div>
                ))}
                {vehicle.descripcion && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Observaciones</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">
                      {vehicle.descripcion}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Comercial */}
            {tab === 'comercial' && (() => {
              const ganancia = vehicle.precio_venta - vehicle.precio_costo
              const margen   = vehicle.precio_costo > 0
                ? ((ganancia / vehicle.precio_costo) * 100).toFixed(1) : '0'
              return (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { lbl: 'Precio de costo',  val: fmtPrice(vehicle.precio_costo),  cls: 'text-gray-700' },
                      { lbl: 'Precio de venta',  val: fmtPrice(vehicle.precio_venta),  cls: 'text-red-600'  },
                      { lbl: 'Ganancia est.',     val: fmtPrice(ganancia), cls: ganancia >= 0 ? 'text-emerald-600' : 'text-red-600' },
                    ].map(({ lbl, val, cls }) => (
                      <div key={lbl} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-gray-400 mb-1 leading-tight">{lbl}</p>
                        <p className={`font-bold text-xs ${cls}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Margen sobre costo</p>
                    <p className={`text-3xl font-black ${parseFloat(margen) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {margen}%
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Historial */}
            {tab === 'historial' && (
              <div className="p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <p className="text-sm">Sin cambios de precio registrados</p>
                  </div>
                ) : history.map(h => (
                  <div key={h.id} className="border border-gray-100 rounded-xl p-3.5 text-xs">
                    <div className="flex justify-between text-gray-400 mb-2">
                      <span>{new Date(h.changed_at).toLocaleString('es-AR')}</span>
                      <span className="font-medium">{h.changed_by}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Precio venta:</span>
                      <span>
                        <span className="line-through text-gray-300 mr-1">{fmtPrice(h.precio_venta_anterior ?? 0)}</span>
                        <span className="text-emerald-600 font-semibold">{fmtPrice(h.precio_venta_nuevo ?? 0)}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-gray-100 bg-white shrink-0 flex gap-2">
            <button onClick={() => onEdit(vehicle.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors">
              <Edit2 size={14} /> Editar
            </button>
            <button onClick={() => onPhotos(vehicle.id)}
              className="px-3 py-2 border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-colors" title="Fotos">
              <ImageIcon size={16} />
            </button>
            <button onClick={() => { onDelete(vehicle.id); onClose() }}
              className="px-3 py-2 border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar">
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Vehicles (page) ────────────────────────────────────────────────────────

export default function Vehicles() {
  const [all, setAll] = useState<VehicleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    estado: '', marca: '', anio_min: '', anio_max: '', precio_min: '', precio_max: '',
  })
  const [page, setPage] = useState(1)

  // Modals
  const [formOpen, setFormOpen] = useState(false)
  const [editVehicle, setEditVehicle] = useState<Vehicle | undefined>()
  const [photoVehicle, setPhotoVehicle] = useState<Vehicle | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Detail panel
  const [panelVehicle, setPanelVehicle] = useState<Vehicle | null>(null)
  const [panelLoading, setPanelLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (search) params.search = search
      if (filters.estado) params.estado = filters.estado
      if (filters.marca)  params.marca  = filters.marca
      if (filters.anio_min) params.anio_min = filters.anio_min
      if (filters.anio_max) params.anio_max = filters.anio_max
      if (filters.precio_min) params.precio_min = filters.precio_min
      if (filters.precio_max) params.precio_max = filters.precio_max
      const res = await vehiclesApi.list({ ...params, limit: 200 })
      setAll(res.data)
      setPage(1)
    } finally {
      setLoading(false)
    }
  }, [search, filters])

  useEffect(() => { load() }, [load])

  const openPanel = async (id: number) => {
    setPanelLoading(true)
    setPanelVehicle(null)
    try {
      const res = await vehiclesApi.get(id)
      setPanelVehicle(res.data)
    } finally {
      setPanelLoading(false)
    }
  }

  const openEdit = async (id: number) => {
    const res = await vehiclesApi.get(id)
    setEditVehicle(res.data)
    setFormOpen(true)
  }

  const openPhotos = async (id: number) => {
    const res = await vehiclesApi.get(id)
    setPhotoVehicle(res.data)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await vehiclesApi.delete(deleteId)
      toast.success('Vehículo eliminado')
      setDeleteId(null)
      if (panelVehicle?.id === deleteId) setPanelVehicle(null)
      load()
    } catch { toast.error('Error al eliminar') }
    finally { setDeleting(false) }
  }

  const clearFilters = () => {
    setFilters({ estado: '', marca: '', anio_min: '', anio_max: '', precio_min: '', precio_max: '' })
    setSearch('')
  }

  const totalPages = Math.ceil(all.length / PAGE_SIZE)
  const paginated  = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const isPanelOpen = !!panelVehicle || panelLoading

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isPanelOpen ? 'mr-[380px]' : ''}`}>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100 shrink-0">
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-xl">Catálogo de Stock</h1>
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por marca, modelo, matrícula…"
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors
              ${showFilters ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <SlidersHorizontal size={15} /> Filtros
          </button>
          <button onClick={() => reportsApi.exportStock()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={15} />
          </button>
          <button onClick={() => { setEditVehicle(undefined); setFormOpen(true) }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={15} /> Agregar auto
          </button>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex items-end gap-3 px-6 py-3 bg-white border-b border-gray-100 flex-wrap shrink-0">
            {[
              { label: 'Marca',  key: 'marca',     type: 'text'   },
              { label: 'Año desde', key: 'anio_min', type: 'number' },
              { label: 'Año hasta', key: 'anio_max', type: 'number' },
              { label: 'Precio mín.', key: 'precio_min', type: 'number' },
              { label: 'Precio máx.', key: 'precio_max', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</label>
                <input
                  type={type}
                  value={(filters as any)[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={type === 'number' ? '—' : 'Todos'}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium">Estado</label>
              <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Todos</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{cap(s)}</option>)}
              </select>
            </div>
            <button onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-700 font-medium pb-1.5 ml-1 transition-colors">
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full" />
            </div>
          ) : all.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Car size={48} className="opacity-20 mb-3" />
              <p className="text-base font-medium">Sin vehículos</p>
              <p className="text-sm">Usá el botón "Agregar auto" para cargar el stock</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginated.map(v => (
                  <VehicleCard
                    key={v.id}
                    v={v}
                    isSelected={panelVehicle?.id === v.id}
                    onSelect={openPanel}
                    onEdit={openEdit}
                    onPhotos={openPhotos}
                    onDelete={id => setDeleteId(id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  Mostrando {Math.min((page - 1) * PAGE_SIZE + 1, all.length)}–{Math.min(page * PAGE_SIZE, all.length)} de {all.length} resultados
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                        ${p === page ? 'bg-red-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Detail Panel ──────────────────────────────────────────────────── */}
      <VehicleDetailPanel
        vehicle={panelVehicle}
        loading={panelLoading}
        onClose={() => { setPanelVehicle(null); setPanelLoading(false) }}
        onEdit={id => { setPanelVehicle(null); openEdit(id) }}
        onDelete={id => setDeleteId(id)}
        onPhotos={id => { openPhotos(id) }}
      />

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditVehicle(undefined) }}
        title={editVehicle ? 'Editar vehículo' : 'Agregar auto'}
        size="lg"
      >
        <VehicleForm
          vehicle={editVehicle}
          onSave={() => { setFormOpen(false); setEditVehicle(undefined); load() }}
          onClose={() => { setFormOpen(false); setEditVehicle(undefined) }}
        />
      </Modal>

      {photoVehicle && (
        <Modal
          open
          onClose={() => { setPhotoVehicle(null); load(); if (panelVehicle) openPanel(panelVehicle.id) }}
          title={`Fotos — ${photoVehicle.marca} ${photoVehicle.modelo}`}
          size="lg"
        >
          <PhotoManager
            vehicle={photoVehicle}
            onClose={() => { setPhotoVehicle(null); load(); if (panelVehicle) openPanel(panelVehicle.id) }}
          />
        </Modal>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        message="¿Eliminar este vehículo? Se borrarán también sus fotos y no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
