import { useState } from 'react'
import OrderForm from './components/OrderForm'
import ResultView from './components/ResultView'
import ImportButton from './components/ImportButton'
import { INVENTARIO_BASE } from './data/inventory'
import type { Cotizacion, Material } from './types'

type Pantalla = 'pedido' | 'resultado'

export default function App() {
  const [pantalla, setPantalla]           = useState<Pantalla>('pedido')
  const [cotizacion, setCotizacion]       = useState<Cotizacion | null>(null)
  const [numeroCotizacion, setNumeroCot]  = useState(1)
  const [inventario, setInventario]       = useState<Material[]>(INVENTARIO_BASE)
  const [fechaImport, setFechaImport]     = useState<Date | null>(null)
  const [showImport, setShowImport]       = useState(false)

  function handleCotizacion(c: Cotizacion) {
    setCotizacion(c)
    setPantalla('resultado')
  }

  function handleNuevoPedido() {
    setPantalla('pedido')
    setCotizacion(null)
    setNumeroCot(n => n + 1)
  }

  function handleImportado(materiales: Material[], fecha: Date) {
    setInventario(materiales)
    setFechaImport(fecha)
    setShowImport(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-400 rounded flex items-center justify-center text-slate-800 font-bold text-sm">V</div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Optimizador de Cortes</h1>
              <p className="text-xs text-slate-400">Vidrios y Espejos</p>
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
                Nuevo Pedido
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
        {pantalla === 'pedido' && (
          <OrderForm
            inventario={inventario}
            numeroCotizacion={numeroCotizacion}
            onCotizacion={handleCotizacion}
          />
        )}
        {pantalla === 'resultado' && cotizacion && (
          <ResultView cotizacion={cotizacion} onNuevoPedido={handleNuevoPedido} />
        )}
      </main>
    </div>
  )
}
