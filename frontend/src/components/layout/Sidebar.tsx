import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Car, Users, ShoppingCart,
  Wrench, BarChart3, LogOut, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import clsx from 'clsx'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/vehicles', icon: Car, label: 'Stock' },
  { to: '/customers', icon: Users, label: 'Clientes' },
  { to: '/sales', icon: ShoppingCart, label: 'Ventas' },
  { to: '/workshop', icon: Wrench, label: 'Taller' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={clsx(
      'flex flex-col bg-brand-900 text-white min-h-screen transition-all duration-300 relative',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-800">
        <Car size={26} className="text-blue-300 shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg tracking-wide leading-tight">
            Automotora
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
            )}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-blue-800 p-3 space-y-1">
        {user?.is_admin && (
          <NavLink
            to="/settings"
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              isActive ? 'bg-blue-600 text-white' : 'text-blue-300 hover:bg-blue-800 hover:text-white'
            )}
          >
            <Settings size={18} className="shrink-0" />
            {!collapsed && <span>Configuración</span>}
          </NavLink>
        )}
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-blue-400">
            <div className="font-medium text-blue-200">{user?.full_name}</div>
            <div>{user?.is_admin ? 'Administrador' : 'Operador'}</div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-300 hover:bg-red-700 hover:text-white transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-brand-900 border border-blue-700 rounded-full p-1 text-blue-300 hover:text-white"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}
