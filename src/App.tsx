import { useState } from 'react'
import OrderForm from './components/OrderForm'
import ResultView from './components/ResultView'
import ImportButton from './components/ImportButton'
import FacturasPage from './components/facturas/FacturasPage'
import EtiquetasPage from './components/etiquetas/EtiquetasPage'
import DespiecesPage from './components/despieces/DespiecesPage'
import { guardarDespiece, actualizarDespiece } from './services/despiecesFirestore'
import { INVENTARIO_BASE } from './data/inventory'
import type { Cotizacion, Material, PiezaSolicitada } from './types'

type Pantalla = 'pedido' | 'resultado' | 'facturas' | 'etiquetas' | 'despieces'

export default function App() {
  const [pantalla, setPantalla]           = useState<Pantalla>('pedido')
  const [cotizacion, setCotizacion]       = useState<Cotizacion | null>(null)
  const [numeroCotizacion, setNumeroCot]  = useState(1)
  const [inventario, setInventario]       = useState<Material[]>(INVENTARIO_BASE)
  const [fechaImport, setFechaImport]     = useState<Date | null>(null)
  const [showImport, setShowImport]       = useState(false)
  const [guardando, setGuardando]         = useState(false)
  const [editandoId, setEditandoId]       = useState<string | null>(null)
  const [formKey, setFormKey]             = useState(0)
  const [mensaje, setMensaje]             = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null)
  const [initialData, setInitialData]     = useState<{
    clienteNombre: string
    materialKey: string
    piezas: PiezaSolicitada[]
  } | null>(null)

  function handleCotizacion(c: Cotizacion) {
    setCotizacion(c)
    setPantalla('resultado')
  }

  function handleNuevoPedido() {
    setPantalla('pedido')
    setCotizacion(null)
    setEditandoId(null)
    setInitialData(null)
    setFormKey(k => k + 1)
    if (!editandoId) {
      setNumeroCot(n => n + 1)
    }
  }

  function handleImportado(materiales: Material[], fecha: Date) {
    setInventario(materiales)
    setFechaImport(fecha)
    setShowImport(false)
  }

  async function handleGuardarCotizacion(c: Cotizacion, pdfBase64: string) {
    setGuardando(true)
    try {
      const input = {
        clienteNombre: c.clienteNombre,
        materialLabel: c.materialLabel,
        materialGrupo: c.materialGrupo,
        materialKey: c.materialKey,
        piezas: c.piezas,
        resultado: c.resultado,
        pdfBase64,
        numero: c.numero,
      }

      if (editandoId) {
        await actualizarDespiece(editandoId, input)
        setMensaje({ texto: 'Despiece actualizado correctamente.', tipo: 'exito' })
        setEditandoId(null)
        setInitialData(null)
      } else {
        await guardarDespiece(input)
        setMensaje({ texto: 'Cotización guardada correctamente.', tipo: 'exito' })
      }

      setPantalla('despieces')
      setCotizacion(null)

      setTimeout(() => setMensaje(null), 4000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setMensaje({ texto: `Error al guardar: ${msg}`, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  function handleEditarDespiece(data: {
    id: string
    clienteNombre: string
    materialKey: string
    piezas: PiezaSolicitada[]
    numero: number
  }) {
    setEditandoId(data.id)
    setNumeroCot(data.numero)
    setInitialData({
      clienteNombre: data.clienteNombre,
      materialKey: data.materialKey,
      piezas: data.piezas,
    })
    setFormKey(k => k + 1)
    setCotizacion(null)
    setPantalla('pedido')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center text-slate-800 font-bold text-sm">V</div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Vidrios y Aluminio EL CASTILLO</h1>
              <p className="text-xs text-slate-400">Optimizador de cortes</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indicador de inventario */}
            <button
              onClick={() => setShowImport(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-slate-600 hover:border-slate-400 hover:bg-slate-700 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${fechaImport ? 'bg-green-400' : 'bg-amber-400'}`} />
              <span className="text-slate-300">
                {fechaImport
                  ? `Inventario ${fechaImport.toLocaleDateString('es-MX', { day:'2-digit', month:'short' })} · ${inventario.length} productos`
                  : 'Inventario demo'}
              </span>
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 16.5L12 21l5-4.5M12 3v18"/>
              </svg>
            </button>

            {/* Navegación */}
            <nav className="flex gap-1">
              <button
                onClick={handleNuevoPedido}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  pantalla === 'pedido'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Pedido
              </button>
              <button
                disabled={!cotizacion}
                onClick={() => cotizacion && setPantalla('resultado')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  pantalla === 'resultado' && cotizacion
                    ? 'bg-blue-500 text-white'
                    : cotizacion
                    ? 'text-slate-300 hover:text-white hover:bg-slate-700'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                Resultado
              </button>
              <button
                onClick={() => setPantalla('despieces')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  pantalla === 'despieces'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Despieces
              </button>
              <button
                onClick={() => setPantalla('facturas')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  pantalla === 'facturas'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Facturas
              </button>
              <button
                onClick={() => setPantalla('etiquetas')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                  pantalla === 'etiquetas'
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                Etiquetas
              </button>
            </nav>
          </div>
        </div>

        {/* Panel de importación (colapsable) */}
        {showImport && (
          <div className="border-t border-slate-700 bg-slate-900">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 max-w-md">
                  <p className="text-xs text-slate-400 mb-2">
                    Importa el reporte Excel diario para actualizar el inventario disponible.
                    El archivo debe ser el mismo formato de <strong className="text-slate-300">LISTA CLIENTES</strong>.
                  </p>
                  <ImportButton onImportado={handleImportado} />
                </div>
                {inventario.length > 0 && (
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-2">Inventario activo ({inventario.length} productos)</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {inventario.slice(0, 15).map(m => (
                        <div key={m.id} className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-slate-500 w-5">{m.grupo === 'VIDRIO' ? '🔲' : '🪟'}</span>
                          <span className="text-slate-300 truncate">{m.descripcion}</span>
                          <span className="ml-auto text-slate-500 flex-shrink-0">{m.stock} hojas</span>
                        </div>
                      ))}
                      {inventario.length > 15 && (
                        <p className="text-xs text-slate-500">...y {inventario.length - 15} más</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Toast de notificación */}
        {mensaje && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between ${
            mensaje.tipo === 'exito'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <span>{mensaje.texto}</span>
            <button onClick={() => setMensaje(null)} className="ml-3 text-current opacity-60 hover:opacity-100">&times;</button>
          </div>
        )}

        {pantalla === 'pedido' && (
          <OrderForm
            key={formKey}
            inventario={inventario}
            numeroCotizacion={numeroCotizacion}
            onCotizacion={handleCotizacion}
            initialData={initialData}
          />
        )}
        {pantalla === 'resultado' && cotizacion && (
          <ResultView
            cotizacion={cotizacion}
            onNuevoPedido={handleNuevoPedido}
            onGuardarCotizacion={handleGuardarCotizacion}
            guardando={guardando}
          />
        )}
        {pantalla === 'despieces' && (
          <DespiecesPage onEditar={handleEditarDespiece} />
        )}
        {pantalla === 'facturas' && <FacturasPage />}
        {pantalla === 'etiquetas' && <EtiquetasPage />}
      </main>
    </div>
  )
}
