import { useState } from 'react'
import { Download, BarChart2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { reportsApi } from '../services/api'

const fmt = (n: number) => `$ ${n.toLocaleString('es-AR')}`

export default function Reports() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: any = { period }
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const res = await reportsApi.salesByPeriod(params)
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reportes y Estadísticas</h1>
        <p className="text-gray-500 text-sm">Análisis del rendimiento del negocio</p>
      </div>

      {/* Exports */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Exportaciones</h2>
        <div className="flex gap-3">
          <button
            onClick={() => reportsApi.exportStock()}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
          >
            <Download size={16} /> Stock de Vehículos (.xlsx)
          </button>
          <button
            onClick={() => reportsApi.exportSales()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Download size={16} /> Ventas (.xlsx)
          </button>
          <button
            onClick={() => reportsApi.exportSales({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta })}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm hover:bg-blue-50"
          >
            <Download size={16} /> Ventas filtradas
          </button>
        </div>
      </section>

      {/* Sales chart */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2"><BarChart2 size={18} /> Ventas por Período</h2>
          <div className="flex gap-2 flex-wrap">
            {(['day', 'week', 'month', 'year'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded-full text-xs font-medium ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          </div>
          <div className="flex items-end">
            <button onClick={load} disabled={loading} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Cargando…' : 'Generar'}
            </button>
          </div>
        </div>

        {data.length > 0 ? (
          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Cantidad de ventas</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v, 'Ventas']} />
                  <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Ingresos ($)</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [fmt(v), 'Total']} />
                  <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Summary table */}
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Detalle</p>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th className="px-4 py-2 text-left">Período</th>
                      <th className="px-4 py-2 text-right">Cantidad</th>
                      <th className="px-4 py-2 text-right">Total</th>
                      <th className="px-4 py-2 text-right">Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.map((d: any) => (
                      <tr key={d.periodo} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{d.periodo}</td>
                        <td className="px-4 py-2 text-right">{d.cantidad}</td>
                        <td className="px-4 py-2 text-right">{fmt(d.total)}</td>
                        <td className="px-4 py-2 text-right">{d.cantidad > 0 ? fmt(d.total / d.cantidad) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-2">Total</td>
                      <td className="px-4 py-2 text-right">{data.reduce((a: number, d: any) => a + d.cantidad, 0)}</td>
                      <td className="px-4 py-2 text-right">{fmt(data.reduce((a: number, d: any) => a + d.total, 0))}</td>
                      <td className="px-4 py-2 text-right">—</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
            <p>Configurá los filtros y hacé clic en "Generar" para ver el reporte</p>
          </div>
        )}
      </section>
    </div>
  )
}
