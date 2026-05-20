import { useState } from 'react'
import { cancelarFactura } from '../../services/firestore'

interface Props {
  facturaId: string
  numeroFactura: string
  onClose: () => void
  onCancelada: () => void
}

const QUIEN_OPCIONES = ['Dulce', 'Fernanda']

export default function CancelarModal({ facturaId, numeroFactura, onClose, onCancelada }: Props) {
  const [motivo, setMotivo] = useState('')
  const [quien, setQuien] = useState(QUIEN_OPCIONES[0])
  const [quienCustom, setQuienCustom] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const quienFinal = quien === '__otro__' ? quienCustom : quien

  async function handleCancelar() {
    if (!motivo.trim()) { setError('El motivo es obligatorio'); return }
    if (!quienFinal.trim()) { setError('Indica quién cancela'); return }
    setError('')
    setGuardando(true)
    try {
      await cancelarFactura(facturaId, motivo.trim(), quienFinal.trim())
      onCancelada()
    } catch {
      setError('Error al cancelar. Verifica tu conexión.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Cancelar Factura #{numeroFactura}</h2>
              <p className="text-xs text-slate-500">Esta acción quedará registrada y no se puede deshacer</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Motivo de cancelación *</label>
              <textarea
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                rows={3}
                placeholder="Describe el motivo de la cancelación..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">¿Quién cancela? *</label>
              <select
                value={quien}
                onChange={e => setQuien(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
              >
                {QUIEN_OPCIONES.map(o => <option key={o} value={o}>{o}</option>)}
                <option value="__otro__">Otro...</option>
              </select>
              {quien === '__otro__' && (
                <input
                  type="text"
                  value={quienCustom}
                  onChange={e => setQuienCustom(e.target.value)}
                  placeholder="Nombre completo"
                  className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Volver
          </button>
          <button
            onClick={handleCancelar}
            disabled={guardando}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {guardando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {guardando ? 'Cancelando...' : 'Confirmar Cancelación'}
          </button>
        </div>
      </div>
    </div>
  )
}
