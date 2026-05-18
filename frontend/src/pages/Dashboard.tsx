import { useEffect, useState } from 'react'
import { Car, Users, ShoppingCart, Wrench, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { reportsApi } from '../services/api'
import StatCard from '../components/ui/StatCard'
import type { DashboardStats } from '../types'

const fmt = (n: number) => `$ ${n.toLocaleString('es-AR', { minimumFractionDigits: 0 })}`

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [salesChart, setSalesChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportsApi.dashboard(),
      reportsApi.salesByPeriod({ period: 'month' }),
    ]).then(([dashRes, salesRes]) => {
      setStats(dashRes.data)
      setSalesChart(salesRes.data.slice(-12))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (!stats) return null

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Resumen del negocio</p>
      </div>

      {/* Stock */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Stock</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Vehículos" value={stats.stock.total} icon={<Car size={22} />} color="blue" />
          <StatCard label="Disponibles" value={stats.stock.disponible} icon={<CheckCircle size={22} />} color="green" />
          <StatCard label="Reservados" value={stats.stock.reservado} icon={<Clock size={22} />} color="yellow" />
          <StatCard label="Vendidos" value={stats.stock.vendido} icon={<Car size={22} />} color="purple" />
        </div>
      </section>

      {/* Ventas */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ventas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Ventas Hoy"
            value={stats.ventas.hoy_cantidad}
            icon={<ShoppingCart size={22} />}
            color="green"
            sub={fmt(stats.ventas.hoy_total)}
          />
          <StatCard
            label="Ventas del Mes"
            value={stats.ventas.mes_cantidad}
            icon={<TrendingUp size={22} />}
            color="blue"
            sub={fmt(stats.ventas.mes_total)}
          />
          <StatCard
            label="Ingresos Mes"
            value={fmt(stats.ventas.mes_total)}
            icon={<TrendingUp size={22} />}
            color="green"
          />
          <StatCard
            label="Clientes Nuevos"
            value={stats.clientes.nuevos_mes}
            icon={<Users size={22} />}
            color="purple"
            sub={`${stats.clientes.total} total`}
          />
        </div>
      </section>

      {/* Taller */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Taller</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Órdenes Pendientes" value={stats.taller.pendientes} icon={<AlertCircle size={22} />} color="orange" />
          <StatCard label="En Proceso" value={stats.taller.en_proceso} icon={<Wrench size={22} />} color="blue" />
          <StatCard label="Ingresos Taller (mes)" value={fmt(stats.taller.ingresos_mes)} icon={<TrendingUp size={22} />} color="green" />
        </div>
      </section>

      {/* Chart */}
      {salesChart.length > 0 && (
        <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Ventas por Mes</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesChart} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number, n: string) =>
                  n === 'total' ? [fmt(v), 'Total'] : [v, 'Cantidad']
                }
              />
              <Bar dataKey="cantidad" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      )}
    </div>
  )
}
