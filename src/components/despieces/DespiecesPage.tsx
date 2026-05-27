import { useState } from 'react'
import { useDespieces } from '../../hooks/useDespieces'
import { fmt } from '../../utils/format'
import type { Despiece } from '../../types/despieces'
import type { PiezaSolicitada, SolucionMono, SolucionCombinada } from '../../types'

interface Props {
  onEditar: (data: {
    id: string
    clienteNombre: string
    materialKey: string
    piezas: PiezaSolicitada[]
    numero: number
  }) => void
}

export default function DespiecesPage({ onEditar }: Props) {
  const { despieces, cargando, error } = useDespieces()
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<Despiece | null>(null)

  const filtrados = despieces.filter(d => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      d.clienteNombre.toLowerCase().includes(q) ||
      d.materialLabel.toLowerCase().includes(q)
    )
  })

  if (seleccionado) {
    return (
      <DespieceDetalle
        despiece={seleccionado}
        onVolver={() => setSeleccionado(null)}
        onEditar={onEditar}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Despieces guardados</h2>
          <p className="text-sm text-slate-500 mt-0.5">Consulta y modifica despieces anteriores.</p>
        </div>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por cliente o material..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
        />
      </div>

      {cargando ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Cargando despieces...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-red-500">{error}</p>
          <p className="text-xs mt-1 text-slate-400">Verifica que Firebase esté configurado correctamente.</p>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No hay despieces guardados</p>
          <p className="text-xs mt-1 text-slate-400">Guarda una cotización desde la pestaña Resultado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(d => (
            <DespieceCard
              key={d.id}
              despiece={d}
              onClick={() => setSeleccionado(d)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DespieceCard({ despiece, onClick }: { despiece: Despiece; onClick: () => void }) {
  const fecha = despiece.fecha?.toDate
    ? despiece.fecha.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  const areaTotal = despiece.resultado.areaPiezas?.toFixed(2) ?? '—'
  const nPiezas = despiece.piezas?.reduce((sum, p) => sum + p.cantidad, 0) ?? 0

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-800 truncate">
              {despiece.clienteNombre || 'Sin cliente'}
            </span>
            <span className="text-xs text-slate-400">#{String(despiece.numero).padStart(4, '0')}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{despiece.materialLabel}</span>
            <span>{nPiezas} pieza{nPiezas !== 1 ? 's' : ''}</span>
            <span>{areaTotal} m²</span>
            <span>{fecha}</span>
          </div>
        </div>
        <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </button>
  )
}

function DespieceDetalle({
  despiece,
  onVolver,
  onEditar,
}: {
  despiece: Despiece
  onVolver: () => void
  onEditar: Props['onEditar']
}) {
  const fecha = despiece.fecha?.toDate
    ? despiece.fecha.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—'
  const fecMod = despiece.fechaModificacion?.toDate
    ? despiece.fechaModificacion.toDate().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const eficiencia = (() => {
    const { tipo, optima } = despiece.resultado
    if (tipo === 'mono') return (optima as SolucionMono).eficienciaPct
    return (optima as SolucionCombinada).eficienciaPct
  })()

  const hojas = (() => {
    const { tipo, optima } = despiece.resultado
    if (tipo === 'mono') return (optima as SolucionMono).nUnidades
    const c = optima as SolucionCombinada
    return c.solA.nUnidades + c.solB.nUnidades
  })()

  const areaVendida = (() => {
    const { tipo, optima } = despiece.resultado
    if (tipo === 'mono') return (optima as SolucionMono).areaVendida
    return (optima as SolucionCombinada).areaVendidaTotal
  })()

  const desperdicio = (() => {
    const { tipo, optima } = despiece.resultado
    if (tipo === 'mono') return (optima as SolucionMono).desperdicioM2
    return (optima as SolucionCombinada).desperdicioTotal
  })()

  function handleDescargarPDF() {
    if (despiece.pdfBase64) {
      const link = document.createElement('a')
      link.href = despiece.pdfBase64
      link.download = `despiece_${String(despiece.numero).padStart(4, '0')}.pdf`
      link.click()
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onVolver} className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-1 flex items-center gap-1">
            ← Volver a lista
          </button>
          <h2 className="text-xl font-semibold text-slate-800">
            {despiece.clienteNombre || 'Sin cliente'}
            <span className="text-sm text-slate-400 ml-2">#{String(despiece.numero).padStart(4, '0')}</span>
          </h2>
          <p className="text-sm text-slate-500">{despiece.materialLabel} · {fecha}</p>
          {fecMod && <p className="text-xs text-slate-400">Modificado: {fecMod}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDescargarPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16l-4-4h3V4h2v8h3l-4 4z"/>
              <path d="M4 20h16v-2H4v2z"/>
            </svg>
            Descargar PDF
          </button>
          <button
            onClick={() => onEditar({
              id: despiece.id,
              clienteNombre: despiece.clienteNombre,
              materialKey: despiece.materialKey,
              piezas: despiece.piezas,
              numero: despiece.numero,
            })}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Modificar
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard titulo="Hojas" valor={`${hojas}`} subtitulo="" color="blue" />
        <MetricCard titulo="Área vendida" valor={`${areaVendida.toFixed(2)} m²`} subtitulo="" color="slate" />
        <MetricCard titulo="Desperdicio" valor={`${desperdicio.toFixed(2)} m²`} subtitulo="" color="amber" />
        <MetricCard titulo="Eficiencia" valor={`${eficiencia.toFixed(1)}%`} subtitulo="" color={eficiencia >= 70 ? 'green' : 'amber'} />
      </div>

      {/* Piezas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-700 mb-3">Piezas solicitadas</h3>
        <div className="space-y-1">
          <div className="grid grid-cols-4 gap-2 px-1 text-xs font-medium text-slate-500 mb-1">
            <span>#</span><span>Ancho (m)</span><span>Alto (m)</span><span>Cant.</span>
          </div>
          {despiece.piezas.map((p, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 px-1 py-1.5 text-sm text-slate-700 border-b border-slate-50 last:border-0">
              <span className="text-slate-400">{i + 1}</span>
              <span>{fmt(p.ancho)}</span>
              <span>{fmt(p.alto)}</span>
              <span>{p.cantidad}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  titulo, valor, subtitulo, color,
}: {
  titulo: string
  valor: string
  subtitulo: string
  color: 'blue' | 'slate' | 'amber' | 'green' | 'red'
}) {
  const colores = {
    blue:  'bg-blue-50  border-blue-200  text-blue-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red:   'bg-red-50   border-red-200   text-red-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colores[color]}`}>
      <p className="text-xs font-medium opacity-70 uppercase tracking-wide">{titulo}</p>
      <p className="text-2xl font-bold mt-1">{valor}</p>
      {subtitulo && <p className="text-xs opacity-60 mt-0.5">{subtitulo}</p>}
    </div>
  )
}
