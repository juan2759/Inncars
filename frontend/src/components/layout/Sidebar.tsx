import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Car, Users, ShoppingCart, Wrench,
  BarChart3, LogOut, Settings, Bell, ArrowLeftRight, Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { reportsApi } from '../../services/api'
import clsx from 'clsx'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/vehicles',  icon: Car,             label: 'Stock'           },
  { to: '/sales',     icon: ShoppingCart,    label: 'Ventas'          },
  { to: '/customers', icon: Users,           label: 'Clientes'        },
  { to: '/sales',     icon: ArrowLeftRight,  label: 'Permutas'        },
  { to: '/reports',   icon: Wallet,          label: 'Finanzas'        },
  { to: '/reports',   icon: BarChart3,       label: 'Reportes'        },
  { to: '/workshop',  icon: Wrench,          label: 'Taller'          },
  { to: '/customers', icon: Bell,            label: 'Recordatorios'   },
]

interface QuickStats {
  disponible: number
  reservado: number
  vendidos_mes: number
  en_tramite: number
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<QuickStats | null>(null)

  useEffect(() => {
    reportsApi.dashboard()
      .then(res => setStats({
        disponible:   res.data.stock.disponible,
        reservado:    res.data.stock.reservado,
        vendidos_mes: res.data.ventas.mes_cantidad,
        en_tramite:   res.data.taller.en_proceso,
      }))
      .catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-[#111111] text-white min-h-screen">

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="bg-red-600 rounded-lg p-2 shrink-0">
          <Car size={18} className="text-white" />
        </div>
        <div className="leading-tight">
          <div className="font-black tracking-widest text-white text-base">INNCARS</div>
          <div className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">Automotora</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }, idx) => (
          <NavLink
            key={`${to}-${idx}`}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}

        <NavLink
          to="/settings"
          className={({ isActive }) => clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-1',
            isActive ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white',
          )}
        >
          <Settings size={17} className="shrink-0" />
          <span>Configuración</span>
        </NavLink>
      </nav>

      {/* ── Quick stats ── */}
      <div className="px-4 py-4 border-t border-white/10 border-b border-white/10">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Resumen rápido
        </p>
        <div className="space-y-2">
          {[
            { label: 'Stock disponible',    value: stats?.disponible,   dot: 'bg-blue-400'  },
            { label: 'Reservados',          value: stats?.reservado,    dot: 'bg-amber-400' },
            { label: 'Vendidos (este mes)', value: stats?.vendidos_mes, dot: 'bg-emerald-400' },
            { label: 'En trámite',          value: stats?.en_tramite,   dot: 'bg-blue-300'  },
          ].map(({ label, value, dot }) => (
            <div key={label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-gray-400">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', dot)} />
                {label}
              </span>
              <span className="text-white font-semibold tabular-nums">
                {value ?? '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── User ── */}
      <div className="flex items-center gap-3 px-4 py-4">
        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold shrink-0">
          {user?.full_name?.charAt(0).toUpperCase() ?? 'A'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email ?? user?.username}</p>
        </div>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="text-gray-500 hover:text-red-500 transition-colors shrink-0"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
