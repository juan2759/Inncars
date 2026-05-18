import Modal from './Modal'

interface Props {
  open: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmDialog({ open, title = 'Confirmar', message, onConfirm, onCancel, loading }: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  )
}
