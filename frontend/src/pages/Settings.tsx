import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { authApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import type { User } from '../types'
import { Trash2, UserPlus } from 'lucide-react'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function Settings() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { register: regPwd, handleSubmit: handlePwd, reset: resetPwd, formState: { isSubmitting: submittingPwd } } = useForm()
  const { register: regUser, handleSubmit: handleUser, reset: resetUser, formState: { isSubmitting: submittingUser } } = useForm<any>({
    defaultValues: { is_admin: false },
  })

  const loadUsers = async () => {
    if (!user?.is_admin) return
    const res = await authApi.listUsers()
    setUsers(res.data)
  }

  useEffect(() => { loadUsers() }, [])

  const onChangePwd = async (data: any) => {
    if (data.new_password !== data.confirm) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    try {
      await authApi.changePassword({ current_password: data.current_password, new_password: data.new_password })
      toast.success('Contraseña actualizada')
      resetPwd()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Error')
    }
  }

  const onCreateUser = async (data: any) => {
    try {
      await authApi.createUser(data)
      toast.success('Usuario creado')
      resetUser()
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Error')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await authApi.deleteUser(deleteId)
      toast.success('Usuario eliminado')
      setDeleteId(null)
      loadUsers()
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

      {/* Change password */}
      <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Cambiar Contraseña</h2>
        <form onSubmit={handlePwd(onChangePwd)} className="space-y-3 max-w-sm">
          {['current_password', 'new_password', 'confirm'].map((name, i) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i === 0 ? 'Contraseña actual' : i === 1 ? 'Nueva contraseña' : 'Confirmar nueva contraseña'}
              </label>
              <input type="password" {...regPwd(name, { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <button type="submit" disabled={submittingPwd} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {submittingPwd ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </section>

      {/* Users (admin only) */}
      {user?.is_admin && (
        <>
          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><UserPlus size={18} /> Nuevo Usuario</h2>
            <form onSubmit={handleUser(onCreateUser)} className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <input {...regUser('username', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input {...regUser('full_name', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" {...regUser('password', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" {...regUser('email')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...regUser('is_admin')} className="rounded" />
                  Administrador
                </label>
                <button type="submit" disabled={submittingUser} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submittingUser ? 'Creando…' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4">Usuarios del Sistema</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b">
                  <th className="pb-2">Usuario</th>
                  <th className="pb-2">Nombre</th>
                  <th className="pb-2">Rol</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="py-2.5 font-mono">{u.username}</td>
                    <td className="py-2.5">{u.full_name}</td>
                    <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.is_admin ? 'Admin' : 'Operador'}</span></td>
                    <td className="py-2.5"><span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'Activo' : 'Inactivo'}</span></td>
                    <td className="py-2.5 text-right">
                      {u.id !== user.id && (
                        <button onClick={() => setDeleteId(u.id)} className="text-red-400 hover:text-red-600 p-1">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        message="¿Eliminar este usuario?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  )
}
