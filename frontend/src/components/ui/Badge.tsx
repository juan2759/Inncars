import clsx from 'clsx'

const variants: Record<string, string> = {
  disponible: 'bg-green-100 text-green-800',
  reservado: 'bg-yellow-100 text-yellow-800',
  vendido: 'bg-gray-100 text-gray-700',
  en_proceso: 'bg-blue-100 text-blue-800',
  cerrada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-700',
  pendiente: 'bg-orange-100 text-orange-800',
  finalizado: 'bg-green-100 text-green-800',
  entregado: 'bg-purple-100 text-purple-800',
  contado: 'bg-emerald-100 text-emerald-800',
  financiado: 'bg-blue-100 text-blue-800',
  permuta: 'bg-violet-100 text-violet-800',
  mixto: 'bg-teal-100 text-teal-800',
}

const labels: Record<string, string> = {
  disponible: 'Disponible', reservado: 'Reservado', vendido: 'Vendido',
  en_proceso: 'En proceso', cerrada: 'Cerrada', cancelada: 'Cancelada',
  pendiente: 'Pendiente', finalizado: 'Finalizado', entregado: 'Entregado',
  contado: 'Contado', financiado: 'Financiado', permuta: 'Permuta', mixto: 'Mixto',
  nafta: 'Nafta', diesel: 'Diesel', gnc: 'GNC', electrico: 'Eléctrico', hibrido: 'Híbrido',
  manual: 'Manual', automatica: 'Automática', cvt: 'CVT',
}

interface Props { value: string; className?: string }

export default function Badge({ value, className }: Props) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[value] ?? 'bg-gray-100 text-gray-600',
      className,
    )}>
      {labels[value] ?? value}
    </span>
  )
}
