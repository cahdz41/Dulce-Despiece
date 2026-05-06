import type { ResultadoUnidad } from '../types'
import { fmt } from '../utils/format'

// Paleta de colores para las piezas (hasta 12 piezas distintas)
const COLORES = [
  { fill: '#bfdbfe', stroke: '#3b82f6', text: '#1e40af' }, // azul
  { fill: '#bbf7d0', stroke: '#22c55e', text: '#15803d' }, // verde
  { fill: '#fde68a', stroke: '#f59e0b', text: '#92400e' }, // amarillo
  { fill: '#fecaca', stroke: '#ef4444', text: '#991b1b' }, // rojo
  { fill: '#e9d5ff', stroke: '#a855f7', text: '#6b21a8' }, // violeta
  { fill: '#fed7aa', stroke: '#f97316', text: '#9a3412' }, // naranja
  { fill: '#99f6e4', stroke: '#14b8a6', text: '#115e59' }, // teal
  { fill: '#fbcfe8', stroke: '#ec4899', text: '#9d174d' }, // rosa
  { fill: '#e0e7ff', stroke: '#6366f1', text: '#3730a3' }, // indigo
  { fill: '#d1fae5', stroke: '#10b981', text: '#064e3b' }, // esmeralda
  { fill: '#fef3c7', stroke: '#d97706', text: '#78350f' }, // ámbar
  { fill: '#dbeafe', stroke: '#2563eb', text: '#1e3a8a' }, // azul oscuro
]

interface Props {
  layout: ResultadoUnidad
  anchoHoja: number
  altoHoja: number
  numeroHoja: number
  label: string
}

export default function CutDiagram({ layout, anchoHoja, altoHoja, numeroHoja, label }: Props) {
  const CANVAS_W = 460
  const CANVAS_H = 340
  const PADDING  = 36  // espacio para etiquetas de dimensión

  // Escala para que la hoja quepa en el canvas disponible
  const disponibleW = CANVAS_W - PADDING * 2
  const disponibleH = CANVAS_H - PADDING * 2
  const escala = Math.min(disponibleW / anchoHoja, disponibleH / altoHoja)

  const hojaW = anchoHoja * escala
  const hojaH = altoHoja  * escala
  const offsetX = PADDING + (disponibleW - hojaW) / 2
  const offsetY = PADDING + (disponibleH - hojaH) / 2

  // Leyenda: qué piezas hay en este layout
  const piezasUnicas = new Map<number, { ancho: number; alto: number; cantidad: number }>()
  for (const p of layout.colocadas) {
    const entry = piezasUnicas.get(p.piezaIdx)
    if (entry) {
      entry.cantidad++
    } else {
      piezasUnicas.set(p.piezaIdx, {
        ancho: p.rotada ? p.alto : p.ancho,
        alto:  p.rotada ? p.ancho : p.alto,
        cantidad: 1,
      })
    }
  }

  const eficiencia = layout.eficiencia.toFixed(1)
  const desperdicio = (layout.areaSuperficie - layout.areaUsada).toFixed(3)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Encabezado */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="bg-slate-700 text-white text-xs font-bold px-2 py-0.5 rounded">
            Hoja {numeroHoja}
          </span>
          <span className="text-sm font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-400">
            {anchoHoja.toFixed(2)} × {altoHoja.toFixed(2)} m
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">Eficiencia:</span>
          <span className={`font-bold ${parseFloat(eficiencia) >= 70 ? 'text-green-600' : parseFloat(eficiencia) >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
            {eficiencia}%
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">Sobrante: <strong className="text-slate-600">{desperdicio} m²</strong></span>
        </div>
      </div>

      {/* SVG del croquis */}
      <div className="flex gap-4 p-4">
        <svg
          width={CANVAS_W}
          height={CANVAS_H}
          className="flex-shrink-0"
          style={{ background: '#f8fafc' }}
        >
          {/* Sombra de la hoja */}
          <rect
            x={offsetX + 3} y={offsetY + 3}
            width={hojaW} height={hojaH}
            fill="#94a3b8" opacity="0.3" rx="1"
          />

          {/* Área de desperdicio (fondo gris con trama) */}
          <defs>
            <pattern id={`trama-${numeroHoja}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="8" x2="8" y2="0" stroke="#cbd5e1" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect
            x={offsetX} y={offsetY}
            width={hojaW} height={hojaH}
            fill={`url(#trama-${numeroHoja})`}
            stroke="#94a3b8" strokeWidth="1.5"
          />

          {/* Piezas colocadas */}
          {layout.colocadas.map((p, i) => {
            const color = COLORES[p.piezaIdx % COLORES.length]
            const px = offsetX + p.x * escala
            const py = offsetY + p.y * escala
            const pw = p.ancho * escala
            const ph = p.alto  * escala

            const labelW = fmt(p.ancho)
            const labelH = fmt(p.alto)
            const fontSize = Math.max(7, Math.min(11, pw / 5))

            return (
              <g key={i}>
                <rect
                  x={px} y={py} width={pw} height={ph}
                  fill={color.fill} stroke={color.stroke} strokeWidth="1.2"
                />
                {/* Etiqueta de dimensiones centrada */}
                {pw > 30 && ph > 18 && (
                  <>
                    <text
                      x={px + pw / 2} y={py + ph / 2 - fontSize * 0.3}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={fontSize} fill={color.text} fontWeight="600"
                    >
                      {labelW}
                    </text>
                    <text
                      x={px + pw / 2} y={py + ph / 2 + fontSize * 1.1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={fontSize} fill={color.text}
                    >
                      × {labelH}
                    </text>
                  </>
                )}
                {/* Indicador de rotación */}
                {p.rotada && pw > 20 && ph > 14 && (
                  <text
                    x={px + pw - 3} y={py + 8}
                    textAnchor="end" fontSize={7} fill={color.text} opacity="0.7"
                  >↻</text>
                )}
              </g>
            )
          })}

          {/* Dimensiones de los sobrantes */}
          {layout.sobrantes
            .filter(s => s.w > 0.05 && s.h > 0.05)
            .map((s, i) => {
              const sx = offsetX + s.x * escala
              const sy = offsetY + s.y * escala
              const sw = s.w * escala
              const sh = s.h * escala
              const cx = sx + sw / 2
              const cy = sy + sh / 2
              const fs = Math.max(7, Math.min(11, Math.min(sw / 6, sh / 4)))
              return (
                <g key={i}>
                  <text
                    x={cx} y={cy - fs * 0.7}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={fs} fill="#475569" fontWeight="600"
                  >
                    {fmt(s.w)} × {fmt(s.h)} m
                  </text>
                  {sw > 60 && sh > 22 && (
                    <text
                      x={cx} y={cy + fs * 0.9}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={fs - 1} fill="#64748b"
                    >
                      ({(s.w * s.h).toFixed(3)} m²)
                    </text>
                  )}
                </g>
              )
            })}

          {/* Dimensiones de la hoja — ancho (arriba) */}
          <text
            x={offsetX + hojaW / 2} y={offsetY - 8}
            textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="500"
          >
            {anchoHoja.toFixed(2)} m
          </text>
          <line x1={offsetX} y1={offsetY - 3} x2={offsetX + hojaW} y2={offsetY - 3} stroke="#94a3b8" strokeWidth="0.8" />

          {/* Dimensiones de la hoja — alto (izquierda) */}
          <text
            x={offsetX - 8} y={offsetY + hojaH / 2}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#64748b" fontWeight="500"
            transform={`rotate(-90, ${offsetX - 8}, ${offsetY + hojaH / 2})`}
          >
            {altoHoja.toFixed(2)} m
          </text>
          <line x1={offsetX - 3} y1={offsetY} x2={offsetX - 3} y2={offsetY + hojaH} stroke="#94a3b8" strokeWidth="0.8" />
        </svg>

        {/* Leyenda lateral */}
        <div className="flex flex-col justify-center gap-1.5 min-w-[160px]">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Piezas en esta hoja</p>
          {Array.from(piezasUnicas.entries()).map(([idx, info]) => {
            const color = COLORES[idx % COLORES.length]
            return (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded flex-shrink-0 border"
                  style={{ background: color.fill, borderColor: color.stroke }}
                />
                <span className="text-xs text-slate-700">
                  <strong>{info.cantidad}×</strong> {fmt(info.ancho)} × {fmt(info.alto)} m
                </span>
              </div>
            )
          })}
          {layout.sobrantes.filter(s => s.w > 0.05 && s.h > 0.05).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Sobrantes</p>
              {layout.sobrantes
                .filter(s => s.w > 0.05 && s.h > 0.05)
                .sort((a, b) => b.w * b.h - a.w * a.h)
                .map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded flex-shrink-0 border border-slate-300"
                      style={{ background: 'repeating-linear-gradient(135deg, #e2e8f0 0px, #e2e8f0 2px, #f8fafc 2px, #f8fafc 6px)' }}
                    />
                    <span className="text-xs text-slate-600 font-medium">
                      {fmt(s.w)} × {fmt(s.h)} m
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
