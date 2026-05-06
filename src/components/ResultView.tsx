import CutDiagram from './CutDiagram'
import { generarPDF } from '../utils/pdfExport'
import { fmt } from '../utils/format'
import type { Cotizacion, SolucionMono, SolucionCombinada, TipoFraccion } from '../types'

function tipoNombre(tipo: TipoFraccion): string {
  switch (tipo) {
    case 'completa': return 'Hoja completa'
    case 'media_h':  return 'Media hoja horizontal'
    case 'media_v':  return 'Media hoja vertical'
    case 'cuarto':   return 'Cuarto de hoja'
  }
}

interface Props {
  cotizacion: Cotizacion
  onNuevoPedido: () => void
}

export default function ResultView({ cotizacion, onNuevoPedido }: Props) {
  const { resultado } = cotizacion
  const { tipo, optima, alternativas, areaPiezas } = resultado

  // Construir lista plana de hojas a mostrar con sus croquis
  interface HojaMostrar {
    numeroHoja: number
    label: string
    tipo: TipoFraccion
    anchoHoja: number
    altoHoja: number
    layout: SolucionMono['layouts'][number]
    eficiencia: number
  }

  const hojas: HojaMostrar[] = []
  let areaVendidaTotal = 0
  let desperdicioTotal = 0
  let eficienciaGlobal = 0

  if (tipo === 'mono') {
    const sol = optima as SolucionMono
    areaVendidaTotal = sol.areaVendida
    desperdicioTotal = sol.desperdicioM2
    eficienciaGlobal = sol.eficienciaPct
    sol.layouts.forEach((lay, i) => {
      hojas.push({
        numeroHoja: i + 1,
        label: sol.superficie.label,
        tipo: sol.superficie.tipo,
        anchoHoja: sol.superficie.ancho,
        altoHoja: sol.superficie.alto,
        layout: lay,
        eficiencia: lay.eficiencia,
      })
    })
  } else {
    const sol = optima as SolucionCombinada
    areaVendidaTotal = sol.areaVendidaTotal
    desperdicioTotal = sol.desperdicioTotal
    eficienciaGlobal = sol.eficienciaPct
    let n = 0
    ;[sol.solA, sol.solB].forEach(s => {
      s.layouts.forEach(lay => {
        n++
        hojas.push({
          numeroHoja: n,
          label: s.superficie.label,
          tipo: s.superficie.tipo,
          anchoHoja: s.superficie.ancho,
          altoHoja: s.superficie.alto,
          layout: lay,
          eficiencia: lay.eficiencia,
        })
      })
    })
  }

  // Resumen de hojas a vender (agrupado)
  const resumenHojas = new Map<string, { label: string; tipo: TipoFraccion; cantidad: number; ancho: number; alto: number }>()
  hojas.forEach(h => {
    const k = h.label
    if (resumenHojas.has(k)) { resumenHojas.get(k)!.cantidad++ }
    else resumenHojas.set(k, { label: h.label, tipo: h.tipo, cantidad: 1, ancho: h.anchoHoja, alto: h.altoHoja })
  })

  return (
    <div className="space-y-6">
      {/* Título + botones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Resultado de Optimización</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {cotizacion.clienteNombre
              ? `Cliente: ${cotizacion.clienteNombre} · Cotización #${cotizacion.numero}`
              : `Cotización #${cotizacion.numero}`}
            {' · '}{cotizacion.materialLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generarPDF(cotizacion)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 16l-4-4h3V4h2v8h3l-4 4z"/>
              <path d="M4 20h16v-2H4v2z"/>
            </svg>
            Descargar PDF
          </button>
          <button
            onClick={onNuevoPedido}
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ← Nuevo pedido
          </button>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          titulo="Hojas a vender"
          valor={`${hojas.length}`}
          subtitulo={tipo === 'combinada' ? 'combinación óptima' : 'mismo tipo'}
          color="blue"
        />
        <MetricCard
          titulo="Área vendida"
          valor={`${areaVendidaTotal.toFixed(2)} m²`}
          subtitulo={`piezas: ${areaPiezas.toFixed(2)} m²`}
          color="slate"
        />
        <MetricCard
          titulo="Desperdicio"
          valor={`${desperdicioTotal.toFixed(2)} m²`}
          subtitulo="sobrante total"
          color="amber"
        />
        <MetricCard
          titulo="Eficiencia"
          valor={`${eficienciaGlobal.toFixed(1)}%`}
          subtitulo="aprovechamiento"
          color={eficienciaGlobal >= 70 ? 'green' : eficienciaGlobal >= 50 ? 'amber' : 'red'}
        />
      </div>

      {/* Resumen de material a vender */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-medium text-slate-700 mb-3">Material a vender al cliente</h3>
        <div className="space-y-2">
          {Array.from(resumenHojas.values()).map(r => (
            <div key={r.label} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
              <span className="bg-slate-700 text-white text-sm font-bold px-2.5 py-0.5 rounded min-w-[2rem] text-center">
                {r.cantidad}×
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">
                  {tipoNombre(r.tipo)} de {cotizacion.materialGrupo === 'ESPEJO' ? 'Espejo' : 'Vidrio'} {cotizacion.materialLabel}
                </p>
                <p className="text-xs text-slate-400">{fmt(r.ancho)} × {fmt(r.alto)} m c/u</p>
              </div>
              <span className="text-sm text-slate-500">
                {(r.cantidad * r.ancho * r.alto).toFixed(3)} m²
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Croquis por hoja */}
      <div>
        <h3 className="font-medium text-slate-700 mb-3">Croquis de cortes</h3>
        <div className="space-y-4">
          {hojas.map(h => (
            <CutDiagram
              key={h.numeroHoja}
              numeroHoja={h.numeroHoja}
              label={h.label}
              anchoHoja={h.anchoHoja}
              altoHoja={h.altoHoja}
              layout={h.layout}
            />
          ))}
        </div>
      </div>

      {/* Alternativas */}
      {alternativas.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-medium text-slate-700 mb-3">Alternativas mono-hoja</h3>
          <div className="space-y-1.5">
            {alternativas.map((alt, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                <span className="text-sm text-slate-700 flex-1">{alt.superficie.label}</span>
                <span className="text-xs text-slate-500">{alt.nUnidades} hoja{alt.nUnidades > 1 ? 's' : ''}</span>
                <span className="text-xs text-slate-500">{alt.areaVendida.toFixed(2)} m²</span>
                <span className="text-xs text-slate-500">{alt.desperdicioM2.toFixed(2)} m² desp.</span>
                <span className={`text-xs font-semibold w-12 text-right ${
                  alt.eficienciaPct >= 70 ? 'text-green-600' : alt.eficienciaPct >= 50 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {alt.eficienciaPct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
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
      <p className="text-xs opacity-60 mt-0.5">{subtitulo}</p>
    </div>
  )
}
