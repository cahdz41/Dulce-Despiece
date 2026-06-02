import { useState } from 'react'
import { crearFactura } from '../../services/firestore'
import type { TipoPago, Vendedor, EstatusTransferencia } from '../../types/facturas'
import { CHOFERES_FIJOS } from '../../types/facturas'

interface Props {
  onClose: () => void
}

const VENDEDORES: Vendedor[] = ['Dulce', 'Fernanda']

interface FormState {
  numeroFactura: string
  numeroCotizacion: string
  cliente: string
  vendedor: Vendedor
  chofer: string
  choferCustom: string
  horaEntrega: string
  lugarEntrega: string
  montoTotal: string
  descuento: string
  descuentoTipo: 'monto' | 'porcentaje'
  autorizaDescuento: string
  tipoPago: TipoPago
  montoEfectivo: string
  montoTransferencia: string
  montoTarjeta: string
  estatusTransferencia: EstatusTransferencia | ''
  dineroRecibido: string
  quienRecibio: string
}

const INICIAL: FormState = {
  numeroFactura: '',
  numeroCotizacion: '',
  cliente: '',
  vendedor: 'Dulce',
  chofer: CHOFERES_FIJOS[0],
  choferCustom: '',
  horaEntrega: '',
  lugarEntrega: '',
  montoTotal: '',
  descuento: '',
  descuentoTipo: 'monto',
  autorizaDescuento: '',
  tipoPago: 'efectivo',
  montoEfectivo: '',
  montoTransferencia: '',
  montoTarjeta: '',
  estatusTransferencia: '',
  dineroRecibido: '',
  quienRecibio: '',
}

function num(s: string) {
  const v = parseFloat(s)
  return isNaN(v) ? 0 : v
}

export default function NuevaFacturaModal({ onClose }: Props) {
  const [form, setForm] = useState<FormState>(INICIAL)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState<string[]>([])

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const montoTotal = num(form.montoTotal)
  const descuentoRaw = num(form.descuento)
  const descuento =
    form.descuentoTipo === 'porcentaje'
      ? montoTotal * (descuentoRaw / 100)
      : descuentoRaw
  const montoFinal = montoTotal - descuento

  const tieneEfectivo = form.tipoPago === 'efectivo' || form.tipoPago === 'mixto'
  const tieneTransferencia = form.tipoPago === 'transferencia' || form.tipoPago === 'mixto'
  const tieneTarjeta = form.tipoPago === 'tarjeta' || form.tipoPago === 'mixto'

  const sumasMixto =
    form.tipoPago === 'mixto'
      ? num(form.montoEfectivo) + num(form.montoTransferencia) + num(form.montoTarjeta)
      : 0

  const choferFinal = form.chofer === '__otro__' ? form.choferCustom : form.chofer

  function validar(): string[] {
    const e: string[] = []
    if (!form.cliente.trim()) e.push('El cliente es obligatorio')
    if (!choferFinal.trim()) e.push('El chofer es obligatorio')
    if (montoTotal <= 0) e.push('El monto total debe ser mayor a 0')
    if (form.descuentoTipo === 'porcentaje' && descuentoRaw > 100) e.push('El porcentaje de descuento no puede ser mayor a 100%')
    if (montoFinal < 0) e.push('El descuento no puede ser mayor al monto total')
    if (form.descuento && !form.autorizaDescuento.trim()) e.push('Debes indicar quién autorizó el descuento')
    if (form.tipoPago === 'mixto') {
      if (Math.abs(sumasMixto - montoFinal) > 0.01)
        e.push(`La suma de los montos mixtos ($${sumasMixto.toFixed(2)}) debe ser igual al monto final ($${montoFinal.toFixed(2)})`)
    }
    if (tieneEfectivo && !form.quienRecibio.trim()) e.push('Indica quién recibió el efectivo')
    return e
  }

  async function handleGuardar() {
    const e = validar()
    if (e.length) { setErrores(e); return }
    setErrores([])
    setGuardando(true)
    try {
      await crearFactura({
        numeroFactura: form.numeroFactura.trim(),
        numeroCotizacion: form.numeroCotizacion.trim(),
        cliente: form.cliente.trim(),
        vendedor: form.vendedor,
        chofer: choferFinal.trim(),
        horaEntrega: form.horaEntrega,
        lugarEntrega: form.lugarEntrega.trim(),
        montoTotal,
        descuento,
        autorizaDescuento: form.autorizaDescuento.trim(),
        montoFinal,
        tipoPago: form.tipoPago,
        montoEfectivo: tieneEfectivo ? num(form.montoEfectivo) : 0,
        montoTransferencia: tieneTransferencia ? num(form.montoTransferencia) : 0,
        montoTarjeta: tieneTarjeta ? num(form.montoTarjeta) : 0,
        estatusTransferencia: tieneTransferencia ? (form.estatusTransferencia || 'proceso_confirmacion') : '',
        dineroRecibido: tieneEfectivo ? num(form.dineroRecibido) : 0,
        quienRecibio: tieneEfectivo ? form.quienRecibio.trim() : '',
      })
      onClose()
    } catch {
      setErrores(['Error al guardar. Verifica tu conexión.'])
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nueva Factura</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">

          {/* ── Sección 1: Datos básicos ── */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Datos básicos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° Factura <span className="text-slate-400 font-normal">(opcional al crear)</span></label>
                <input
                  type="text"
                  value={form.numeroFactura}
                  onChange={e => set('numeroFactura', e.target.value)}
                  placeholder="Ej: 1042"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">N° Cotización</label>
                <input
                  type="text"
                  value={form.numeroCotizacion}
                  onChange={e => set('numeroCotizacion', e.target.value)}
                  placeholder="Ej: COT-021"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Cliente *</label>
                <input
                  type="text"
                  value={form.cliente}
                  onChange={e => set('cliente', e.target.value)}
                  placeholder="Nombre del cliente"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vendedor *</label>
                <select
                  value={form.vendedor}
                  onChange={e => set('vendedor', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  {VENDEDORES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Chofer *</label>
                <select
                  value={form.chofer}
                  onChange={e => set('chofer', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  {CHOFERES_FIJOS.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="__otro__">Otro...</option>
                </select>
                {form.chofer === '__otro__' && (
                  <input
                    type="text"
                    value={form.choferCustom}
                    onChange={e => set('choferCustom', e.target.value)}
                    placeholder="Nombre del chofer"
                    className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Hora de entrega</label>
                <input
                  type="time"
                  value={form.horaEntrega}
                  onChange={e => set('horaEntrega', e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lugar de entrega</label>
                <input
                  type="text"
                  value={form.lugarEntrega}
                  onChange={e => set('lugarEntrega', e.target.value)}
                  placeholder="Ej: Domicilio del cliente, Sucursal..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
            </div>
          </section>

          {/* ── Sección 2: Montos ── */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Montos</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Monto Total *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.montoTotal}
                    onChange={e => set('montoTotal', e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descuento</label>
                <div className="flex gap-2">
                  {/* Toggle % / $ */}
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => set('descuentoTipo', 'monto')}
                      className={`px-2.5 py-2 transition-colors ${form.descuentoTipo === 'monto' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >$</button>
                    <button
                      type="button"
                      onClick={() => set('descuentoTipo', 'porcentaje')}
                      className={`px-2.5 py-2 transition-colors ${form.descuentoTipo === 'porcentaje' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                    >%</button>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {form.descuentoTipo === 'porcentaje' ? '%' : '$'}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={form.descuentoTipo === 'porcentaje' ? 100 : undefined}
                      step={form.descuentoTipo === 'porcentaje' ? '1' : '0.01'}
                      value={form.descuento}
                      onChange={e => set('descuento', e.target.value)}
                      placeholder={form.descuentoTipo === 'porcentaje' ? '0' : '0.00'}
                      className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>
                {/* Preview del monto calculado cuando es porcentaje */}
                {form.descuentoTipo === 'porcentaje' && descuentoRaw > 0 && montoTotal > 0 && (
                  <p className="text-xs text-slate-500 mt-1 ml-1">
                    = <span className="font-semibold text-slate-700">${descuento.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span> de descuento
                  </p>
                )}
              </div>

              {form.descuento && num(form.descuento) > 0 && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">¿Quién autorizó el descuento? *</label>
                  <input
                    type="text"
                    value={form.autorizaDescuento}
                    onChange={e => set('autorizaDescuento', e.target.value)}
                    placeholder="Nombre de quien autorizó"
                    className="w-full border border-amber-300 bg-amber-50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              )}

              {montoTotal > 0 && (
                <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
                  <span className="text-sm text-blue-700 font-medium">Monto Final</span>
                  <span className="text-xl font-bold text-blue-800">
                    ${montoFinal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ── Sección 3: Tipo de pago ── */}
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Tipo de pago</h3>

            {/* Selector */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['efectivo', 'transferencia', 'tarjeta', 'mixto'] as TipoPago[]).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => set('tipoPago', tipo)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.tipoPago === tipo
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {/* Efectivo */}
              {tieneEfectivo && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Efectivo</p>
                  {form.tipoPago === 'mixto' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Monto en efectivo</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={form.montoEfectivo}
                          onChange={e => set('montoEfectivo', e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Dinero recibido</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={form.dineroRecibido}
                          onChange={e => set('dineroRecibido', e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Quién recibió *</label>
                      <input
                        type="text"
                        value={form.quienRecibio}
                        onChange={e => set('quienRecibio', e.target.value)}
                        placeholder="Nombre"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Transferencia */}
              {tieneTransferencia && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Transferencia</p>
                  {form.tipoPago === 'mixto' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Monto por transferencia</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={form.montoTransferencia}
                          onChange={e => set('montoTransferencia', e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Estado de la transferencia</label>
                    <div className="flex gap-2">
                      {([['proceso_confirmacion', 'En proceso'], ['confirmada', 'Confirmada']] as [EstatusTransferencia, string][]).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => set('estatusTransferencia', val)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            form.estatusTransferencia === val
                              ? val === 'confirmada'
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-yellow-500 text-white border-yellow-500'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tarjeta */}
              {tieneTarjeta && form.tipoPago === 'mixto' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Tarjeta</p>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Monto con tarjeta</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input
                        type="number" min="0" step="0.01"
                        value={form.montoTarjeta}
                        onChange={e => set('montoTarjeta', e.target.value)}
                        placeholder="0.00"
                        className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen mixto */}
              {form.tipoPago === 'mixto' && montoFinal > 0 && (
                <div className={`rounded-lg px-4 py-2 flex items-center justify-between text-sm border ${
                  Math.abs(sumasMixto - montoFinal) < 0.01
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <span>Suma: ${sumasMixto.toFixed(2)}</span>
                  <span>Total a cubrir: ${montoFinal.toFixed(2)}</span>
                  <span className="font-semibold">
                    {Math.abs(sumasMixto - montoFinal) < 0.01 ? 'Correcto' : `Diferencia: $${Math.abs(sumasMixto - montoFinal).toFixed(2)}`}
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Errores */}
          {errores.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">Corrige los siguientes campos:</p>
              <ul className="space-y-0.5">
                {errores.map((e, i) => (
                  <li key={i} className="text-sm text-red-600">• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {guardando && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {guardando ? 'Guardando...' : 'Guardar Factura'}
          </button>
        </div>
      </div>
    </div>
  )
}
