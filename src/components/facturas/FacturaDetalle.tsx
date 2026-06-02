import { useState } from 'react'
import type { Factura } from '../../types/facturas'
import FinalizarModal from './FinalizarModal'
import CancelarModal from './CancelarModal'
import CambiarFotoModal from './CambiarFotoModal'
import { actualizarEstatusTransferencia, actualizarFactura } from '../../services/firestore'
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
  const [showCambiarFoto, setShowCambiarFoto] = useState(false)
  const [actualizandoTransf, setActualizandoTransf] = useState(false)
  const [editandoNumero, setEditandoNumero] = useState(false)
  const [numeroEditado, setNumeroEditado] = useState(factura.numeroFactura ?? '')
  const [guardandoNumero, setGuardandoNumero] = useState(false)

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

  const requiereTransferenciaConfirmada =
    factura.tipoPago === 'transferencia' ||
    (factura.tipoPago === 'mixto' && factura.montoTransferencia > 0)
  const transferenciaConfirmada = factura.estatusTransferencia === 'confirmada'
  const tieneNumeroFactura = !!factura.numeroFactura?.trim()
  const puedeFinalizar = tieneNumeroFactura && (!requiereTransferenciaConfirmada || transferenciaConfirmada)

  async function guardarNumeroFactura() {
    const nuevo = numeroEditado.trim()
    if (!nuevo) return
    setGuardandoNumero(true)
    try {
      await actualizarFactura(factura.id, { numeroFactura: nuevo })
      setEditandoNumero(false)
    } finally {
      setGuardandoNumero(false)
    }
  }

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
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              {/* Número de factura — editable si está pendiente */}
              {factura.estatus === 'pendiente' && editandoNumero ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={numeroEditado}
                    onChange={e => setNumeroEditado(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') guardarNumeroFactura(); if (e.key === 'Escape') setEditandoNumero(false) }}
                    placeholder="Ej: 1042"
                    autoFocus
                    className="w-32 border-2 border-blue-400 rounded-lg px-2 py-1 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    onClick={guardarNumeroFactura}
                    disabled={guardandoNumero || !numeroEditado.trim()}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {guardandoNumero ? '...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => { setEditandoNumero(false); setNumeroEditado(factura.numeroFactura ?? '') }}
                    className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {tieneNumeroFactura
                    ? <h1 className="text-2xl font-bold text-slate-800">#{factura.numeroFactura}</h1>
                    : <h1 className="text-lg font-semibold text-amber-600 italic">Sin número de factura</h1>
                  }
                  {factura.estatus === 'pendiente' && (
                    <button
                      onClick={() => setEditandoNumero(true)}
                      title={tieneNumeroFactura ? 'Editar número' : 'Agregar número de factura'}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
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
            <Fila label="Lugar de entrega" value={factura.lugarEntrega || '—'} />
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
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Factura firmada</p>
                  <button
                    onClick={() => setShowCambiarFoto(true)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                    Cambiar foto
                  </button>
                </div>
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
        <div className="space-y-3">
          {!tieneNumeroFactura && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Número de factura requerido para finalizar</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Usa el ícono de lápiz junto al encabezado para agregar el número antes de finalizar.
                </p>
              </div>
            </div>
          )}
          {requiereTransferenciaConfirmada && !transferenciaConfirmada && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-yellow-800">Transferencia pendiente de confirmación</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  No se puede finalizar la factura hasta que la transferencia esté confirmada. Usa los botones de arriba para marcarla como confirmada.
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFinalizar(true)}
              disabled={!puedeFinalizar}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm disabled:cursor-not-allowed"
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
      </div>
      )}

      {showFinalizar && (
        <FinalizarModal
          facturaId={factura.id}
          numeroFactura={factura.numeroFactura}
          tipoPago={factura.tipoPago}
          montoTransferencia={factura.montoTransferencia}
          estatusTransferencia={factura.estatusTransferencia}
          onClose={() => setShowFinalizar(false)}
          onFinalizada={() => { setShowFinalizar(false); onVolver() }}
        />
      )}

      {showCambiarFoto && (
        <CambiarFotoModal
          facturaId={factura.id}
          numeroFactura={factura.numeroFactura}
          fotoActualUrl={factura.fotoFacturaUrl}
          onClose={() => setShowCambiarFoto(false)}
          onActualizada={() => setShowCambiarFoto(false)}
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
