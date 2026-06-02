import { useRef, useState } from 'react'
import { finalizarFactura } from '../../services/firestore'
import { subirFotoFactura } from '../../services/cloudinary'

interface Props {
  facturaId: string
  numeroFactura: string
  tipoPago: string
  montoTransferencia: number
  estatusTransferencia: string
  onClose: () => void
  onFinalizada: () => void
}

export default function FinalizarModal({ facturaId, numeroFactura, tipoPago, montoTransferencia, estatusTransferencia, onClose, onFinalizada }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [progreso, setProgreso] = useState<'idle' | 'comprimiendo' | 'subiendo' | 'guardando'>('idle')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setArchivo(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  function quitarFoto() {
    setArchivo(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleFinalizar() {
    setError('')

    if (!numeroFactura?.trim()) {
      setError('No se puede finalizar: el número de factura es obligatorio.')
      return
    }

    const requiereTransfConfirmada =
      tipoPago === 'transferencia' ||
      (tipoPago === 'mixto' && montoTransferencia > 0)
    if (requiereTransfConfirmada && estatusTransferencia !== 'confirmada') {
      setError('No se puede finalizar la factura hasta que la transferencia esté confirmada.')
      return
    }

    setGuardando(true)
    try {
      let fotoUrl: string | undefined
      let fotoPublicId: string | undefined

      if (archivo) {
        setProgreso('comprimiendo')
        const resultado = await subirFotoFactura(archivo)
        fotoUrl = resultado.url
        fotoPublicId = resultado.publicId
      }

      setProgreso('guardando')
      await finalizarFactura(facturaId, fotoUrl, fotoPublicId)
      onFinalizada()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar. Verifica tu conexión.')
    } finally {
      setGuardando(false)
      setProgreso('idle')
    }
  }

  const mensajeProgreso: Record<string, string> = {
    comprimiendo: 'Comprimiendo foto...',
    subiendo: 'Subiendo foto...',
    guardando: 'Guardando factura...',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5">
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Finalizar Factura #{numeroFactura}</h2>
              <p className="text-xs text-slate-500">El chofer entregó la factura firmada por el cliente</p>
            </div>
          </div>

          {/* Sección de foto */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Foto de factura firmada <span className="normal-case font-normal text-slate-400">(opcional)</span>
            </p>

            {!preview ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={guardando}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                <span className="text-sm font-medium">Tomar foto o seleccionar archivo</span>
                <span className="text-xs">Se comprimirá automáticamente antes de subir</span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={preview} alt="Vista previa" className="w-full max-h-56 object-cover" />
                <button
                  type="button"
                  onClick={quitarFoto}
                  disabled={guardando}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span className="text-xs text-slate-600 truncate">{archivo?.name}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    ({(archivo!.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              </div>
            )}

            {/* Input oculto: acepta cámara en móvil y archivo en escritorio */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
          </div>

          {/* Progreso */}
          {guardando && progreso !== 'idle' && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
              <span className="text-sm text-blue-700">{mensajeProgreso[progreso]}</span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalizar}
            disabled={guardando}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {guardando && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {guardando ? mensajeProgreso[progreso] || 'Procesando...' : 'Confirmar Finalización'}
          </button>
        </div>
      </div>
    </div>
  )
}
