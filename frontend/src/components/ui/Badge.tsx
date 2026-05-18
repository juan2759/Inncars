import clsx from 'clsx'

const variants: Record<string, string> = {
  disponible: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  reservado:  'bg-amber-50 text-amber-700 border border-amber-200',
  vendido:    'bg-gray-100 text-gray-500 border border-gray-200',
  en_proceso: 'bg-blue-50 text-blue-700 border border-blue-200',
  cerrada:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelada:  'bg-red-50 text-red-600 border border-red-200',
  pendiente:  'bg-orange-50 text-orange-700 border border-orange-200',
  finalizado: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  entregado:  'bg-purple-50 text-purple-700 border border-purple-200',
  contado:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  financiado: 'bg-blue-50 text-blue-700 border border-blue-200',
  permuta:    'bg-violet-50 text-violet-700 border border-violet-200',
  mixto:      'bg-teal-50 text-teal-700 border border-teal-200',
}

const dots: Record<string, string> = {
  disponible: 'bg-emerald-500',
  reservado:  'bg-amber-500',
  vendido:    'bg-gray-400',
  en_proceso: 'bg-blue-500',
  cerrada:    'bg-emerald-500',
  cancelada:  'bg-red-500',
  pendiente:  'bg-orange-500',
  finalizado: 'bg-emerald-500',
  entregado:  'bg-purple-500',
}

const labels: Record<string, string> = {
  disponible: 'Disponible', reservado: 'Reservado', vendido: 'Vendido',
  en_proceso: 'En trámite', cerrada: 'Cerrada', cancelada: 'Cancelada',
  pendiente: 'Pendiente', finalizado: 'Finalizado', entregado: 'Entregado',
  contado: 'Contado', financiado: 'Financiado', permuta: 'Permuta', mixto: 'Mixto',
  nafta: 'Nafta', diesel: 'Diésel', gnc: 'GNC', electrico: 'Eléctrico', hibrido: 'Híbrido',
  manual: 'Manual', automatica: 'Automática', cvt: 'CVT',
}

interface Props { value: string; dot?: boolean; className?: string }

export default function Badge({ value, dot = false, className }: Props) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
      variants[value] ?? 'bg-gray-100 text-gray-600 border border-gray-200',
      className,
    )}>
      {(dot || dots[value]) && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dots[value] ?? 'bg-gray-400')} />
      )}
      {labels[value] ?? value}
    </span>
  )
}
