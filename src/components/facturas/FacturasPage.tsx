import { useState } from 'react'
import { useFacturas } from '../../hooks/useFacturas'
import FacturaCard from './FacturaCard'
import NuevaFacturaModal from './NuevaFacturaModal'
import FacturaDetalle from './FacturaDetalle'
import type { EstatusFactura, Factura } from '../../types/facturas'

type Filtro = EstatusFactura | 'todas'

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'pendiente', label: 'Pendientes' },
  { key: 'finalizada', label: 'Finalizadas' },
  { key: 'cancelada', label: 'Canceladas' },
  { key: 'todas', label: 'Todas' },
]

export default function FacturasPage() {
  const { pendientes, finalizadas, canceladas, filtrarPor, cargando } = useFacturas()
  const [filtro, setFiltro] = useState<Filtro>('pendiente')
  const [busqueda, setBusqueda] = useState('')
  const [showNueva, setShowNueva] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null)

  const lista = filtrarPor(filtro).filter(f => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      f.numeroFactura.toLowerCase().includes(q) ||
      f.cliente.toLowerCase().includes(q) ||
      f.numeroCotizacion?.toLowerCase().includes(q)
    )
  })

  if (facturaSeleccionada) {
    return (
      <FacturaDetalle
        factura={facturaSeleccionada}
        onVolver={() => setFacturaSeleccionada(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-700">{pendientes.length}</p>
          <p className="text-xs text-amber-600 mt-0.5 font-medium">Pendientes</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{finalizadas.length}</p>
          <p className="text-xs text-green-600 mt-0.5 font-medium">Finalizadas</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{canceladas.length}</p>
          <p className="text-xs text-red-600 mt-0.5 font-medium">Canceladas</p>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowNueva(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva Factura
        </button>

        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por factura, cliente o cotización..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filtro === f.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {cargando ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando facturas...</p>
        </div>
      ) : lista.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No hay facturas</p>
          {filtro === 'pendiente' && (
            <p className="text-xs mt-1 text-slate-400">Crea una nueva factura con el botón de arriba</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(f => (
            <FacturaCard
              key={f.id}
              factura={f}
              onClick={() => setFacturaSeleccionada(f)}
            />
          ))}
        </div>
      )}

      {showNueva && (
        <NuevaFacturaModal onClose={() => setShowNueva(false)} />
      )}
    </div>
  )
}
