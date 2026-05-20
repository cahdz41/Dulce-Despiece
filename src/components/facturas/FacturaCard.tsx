import type { Factura } from '../../types/facturas'

interface Props {
  factura: Factura
  onClick: () => void
}

const BADGE: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  finalizada: 'bg-green-100 text-green-800 border-green-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
}

const LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  finalizada: 'Finalizada',
  cancelada: 'Cancelada',
}

const PAGO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  mixto: 'Mixto',
}

export default function FacturaCard({ factura, onClick }: Props) {
  const fecha = factura.fechaCreacion?.toDate?.()
  const fechaStr = fecha
    ? fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  const horaStr = fecha
    ? fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-150 group"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Izquierda */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-800 text-sm">#{factura.numeroFactura}</span>
            {factura.numeroCotizacion && (
              <span className="text-xs text-slate-400">· Cot. {factura.numeroCotizacion}</span>
            )}
          </div>
          <p className="text-slate-700 font-medium truncate">{factura.cliente}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-xs text-slate-500">{factura.vendedor}</span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">Chofer: {factura.chofer}</span>
            {factura.horaEntrega && (
              <>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">Entrega {factura.horaEntrega}</span>
              </>
            )}
            {factura.lugarEntrega && (
              <>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 truncate max-w-[140px]">{factura.lugarEntrega}</span>
              </>
            )}
          </div>
        </div>

        {/* Derecha */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${BADGE[factura.estatus]}`}>
            {LABEL[factura.estatus]}
          </span>
          <span className="text-lg font-bold text-slate-800">
            ${factura.montoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
            {PAGO_LABEL[factura.tipoPago]}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{fechaStr} · {horaStr}</span>
          {factura.fotoFacturaUrl && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
              Foto
            </span>
          )}
        </div>
        {factura.estatus === 'cancelada' && factura.motivoCancelacion && (
          <span className="text-xs text-red-500 truncate max-w-[200px]">
            Cancelada: {factura.motivoCancelacion}
          </span>
        )}
        {factura.tipoPago === 'transferencia' && factura.estatusTransferencia && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            factura.estatusTransferencia === 'confirmada'
              ? 'bg-green-50 text-green-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {factura.estatusTransferencia === 'confirmada' ? 'Transferencia confirmada' : 'Transferencia en proceso'}
          </span>
        )}
      </div>
    </button>
  )
}
