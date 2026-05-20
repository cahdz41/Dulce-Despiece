import { useState } from 'react'
import type { Factura } from '../../types/facturas'
import FinalizarModal from './FinalizarModal'
import CancelarModal from './CancelarModal'
import { actualizarEstatusTransferencia } from '../../services/firestore'
import type { EstatusTransferencia } from '../../types/facturas'

interface Props {
  factura: Factura
  onVolver: () => void
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

function Fila({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex justify-between items-start py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <span className="text-sm text-slate-700 text-right max-w-[60%]">{value}</span>
    </div>
  )
}

export default function FacturaDetalle({ factura, onVolver }: Props) {
  const [showFinalizar, setShowFinalizar] = useState(false)
  const [showCancelar, setShowCancelar] = useState(false)
  const [actualizandoTransf, setActualizandoTransf] = useState(false)

  const fecha = factura.fechaCreacion?.toDate?.()
  const fechaStr = fecha?.toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) ?? '—'

  const fechaFin = factura.fechaFinalizacion?.toDate?.()
  const fechaFinStr = fechaFin?.toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const fechaCan = factura.fechaCancelacion?.toDate?.()
  const fechaCanStr = fechaCan?.toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  async function cambiarEstatusTransf(estatus: EstatusTransferencia) {
    setActualizandoTransf(true)
    try {
      await actualizarEstatusTransferencia(factura.id, estatus)
    } finally {
      setActualizandoTransf(false)
    }
  }

  const tieneEfectivo = factura.tipoPago === 'efectivo' || factura.tipoPago === 'mixto'
  const tieneTransferencia = factura.tipoPago === 'transferencia' || factura.tipoPago === 'mixto'

  return (
    <div className="max-w-2xl mx-auto">
      {/* Volver */}
      <button
        onClick={onVolver}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Volver a la lista
      </button>

      {/* Encabezado */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
        <div className="px-6 py-5 flex items-start justify-between border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-800">#{factura.numeroFactura}</h1>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${BADGE[factura.estatus]}`}>
                {LABEL[factura.estatus]}
              </span>
            </div>
            <p className="text-slate-500 text-sm">{factura.cliente}</p>
            <p className="text-xs text-slate-400 mt-0.5">{fechaStr}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800">
              ${factura.montoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            {factura.descuento > 0 && (
              <p className="text-xs text-slate-400">
                Total: ${factura.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} · Desc: ${factura.descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>

        {/* Datos */}
        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Información</p>
            <Fila label="N° Cotización" value={factura.numeroCotizacion || '—'} />
            <Fila label="Vendedor" value={factura.vendedor} />
            <Fila label="Chofer" value={factura.chofer} />
            <Fila label="Hora de entrega" value={factura.horaEntrega || '—'} />
            {factura.descuento > 0 && (
              <Fila label="Autorizó descuento" value={factura.autorizaDescuento} />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Pago</p>
            <Fila
              label="Tipo de pago"
              value={{ efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta', mixto: 'Mixto' }[factura.tipoPago]}
            />
            {factura.tipoPago === 'mixto' && (
              <>
                {factura.montoEfectivo > 0 && <Fila label="Efectivo" value={`$${factura.montoEfectivo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />}
                {factura.montoTransferencia > 0 && <Fila label="Transferencia" value={`$${factura.montoTransferencia.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />}
                {factura.montoTarjeta > 0 && <Fila label="Tarjeta" value={`$${factura.montoTarjeta.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`} />}
              </>
            )}
            {tieneEfectivo && (
              <>
                <Fila label="Dinero recibido" value={factura.dineroRecibido ? `$${factura.dineroRecibido.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—'} />
                <Fila label="Quién recibió" value={factura.quienRecibio} />
              </>
            )}
          </div>
        </div>

        {/* Estado transferencia (editable si está pendiente) */}
        {tieneTransferencia && (
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado de la transferencia</p>
            {factura.estatus === 'pendiente' ? (
              <div className="flex gap-2">
                {([['proceso_confirmacion', 'En proceso', 'yellow'], ['confirmada', 'Confirmada', 'green']] as [EstatusTransferencia, string, string][]).map(([val, label, color]) => (
                  <button
                    key={val}
                    onClick={() => cambiarEstatusTransf(val)}
                    disabled={actualizandoTransf}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 ${
                      factura.estatusTransferencia === val
                        ? color === 'green'
                          ? 'bg-green-600 text-white border-green-600'
                          : 'bg-yellow-500 text-white border-yellow-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                factura.estatusTransferencia === 'confirmada'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {factura.estatusTransferencia === 'confirmada' ? 'Confirmada' : 'En proceso de confirmación'}
              </span>
            )}
          </div>
        )}

        {/* Info de finalización */}
        {factura.estatus === 'finalizada' && (
          <div className="border-t border-slate-100 bg-green-50">
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Finalizada</p>
              {fechaFinStr && <p className="text-sm text-green-700">{fechaFinStr}</p>}
            </div>
            {factura.fotoFacturaUrl && (
              <div className="px-6 pb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Factura firmada</p>
                <a href={factura.fotoFacturaUrl} target="_blank" rel="noopener noreferrer" className="block group">
                  <img
                    src={factura.fotoFacturaUrl}
                    alt="Factura firmada"
                    className="w-full max-h-64 object-cover rounded-xl border border-green-200 group-hover:opacity-90 transition-opacity"
                  />
                  <p className="text-xs text-green-600 mt-1.5 text-center">Toca para ver en tamaño completo</p>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Info de cancelación */}
        {factura.estatus === 'cancelada' && (
          <div className="px-6 py-4 border-t border-slate-100 bg-red-50">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Cancelada</p>
            {fechaCanStr && <p className="text-sm text-red-700 mb-1">{fechaCanStr}</p>}
            {factura.motivoCancelacion && (
              <p className="text-sm text-red-700"><strong>Motivo:</strong> {factura.motivoCancelacion}</p>
            )}
            {factura.quienCancelo && (
              <p className="text-sm text-red-700"><strong>Canceló:</strong> {factura.quienCancelo}</p>
            )}
          </div>
        )}
      </div>

      {/* Acciones (solo si está pendiente) */}
      {factura.estatus === 'pendiente' && (
        <div className="flex gap-3">
          <button
            onClick={() => setShowFinalizar(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Finalizar Factura
          </button>
          <button
            onClick={() => setShowCancelar(true)}
            className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 px-5 rounded-xl font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
        </div>
      )}

      {showFinalizar && (
        <FinalizarModal
          facturaId={factura.id}
          numeroFactura={factura.numeroFactura}
          onClose={() => setShowFinalizar(false)}
          onFinalizada={() => { setShowFinalizar(false); onVolver() }}
        />
      )}

      {showCancelar && (
        <CancelarModal
          facturaId={factura.id}
          numeroFactura={factura.numeroFactura}
          onClose={() => setShowCancelar(false)}
          onCancelada={() => { setShowCancelar(false); onVolver() }}
        />
      )}
    </div>
  )
}
