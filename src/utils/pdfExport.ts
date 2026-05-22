import { jsPDF } from 'jspdf'
import type { Cotizacion, SolucionCombinada, SolucionMono, TipoFraccion } from '../types'
import { fmt } from './format'

function tipoNombre(tipo: TipoFraccion): string {
  switch (tipo) {
    case 'completa': return 'Hoja completa'
    case 'media_h':  return 'Media hoja horizontal'
    case 'media_v':  return 'Media hoja vertical'
    case 'cuarto':   return 'Cuarto de hoja'
  }
}

// ── Paleta (RGB) ──────────────────────────────────────────────────────────────
const COLORES: Array<[number, number, number]> = [
  [191, 219, 254], [187, 247, 208], [253, 230, 138], [254, 202, 202],
  [233, 213, 255], [254, 215, 170], [153, 246, 228], [251, 207, 232],
  [224, 231, 255], [209, 250, 229], [254, 243, 199], [219, 234, 254],
]
const COLORES_STROKE: Array<[number, number, number]> = [
  [59, 130, 246], [34, 197, 94],  [245, 158, 11], [239, 68, 68],
  [168, 85, 247], [249, 115, 22], [20, 184, 166], [236, 72, 153],
  [99, 102, 241], [16, 185, 129], [217, 119, 6],  [37, 99, 235],
]

const EMPRESA  = 'Vidrios y Aluminio EL CASTILLO'
const A4W      = 210   // mm
const A4H      = 297   // mm
const MARGIN   = 14    // mm
const COL_W    = A4W - MARGIN * 2

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

function drawHeader(doc: jsPDF, cotizacion: Cotizacion) {
  // Franja azul oscura
  doc.setFillColor(30, 41, 59)
  doc.rect(0, 0, A4W, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(EMPRESA, MARGIN, 10)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('Optimizador de cortes de vidrio y espejo', MARGIN, 16)

  // Número de cotización (derecha)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const numStr = `Cotización #${String(cotizacion.numero).padStart(4, '0')}`
  doc.text(numStr, A4W - MARGIN, 10, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(formatDate(cotizacion.fecha), A4W - MARGIN, 16, { align: 'right' })
}

function drawInfoBand(doc: jsPDF, cotizacion: Cotizacion, y: number): number {
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y, COL_W, 18, 2, 2, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(MARGIN, y, COL_W, 18, 2, 2, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('CLIENTE', MARGIN + 4, y + 6)
  doc.text('MATERIAL', MARGIN + 70, y + 6)
  doc.text('FECHA', MARGIN + 140, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(15, 23, 42)
  doc.text(cotizacion.clienteNombre || '—', MARGIN + 4, y + 13)
  doc.text(cotizacion.materialLabel, MARGIN + 70, y + 13)
  doc.text(formatDate(cotizacion.fecha), MARGIN + 140, y + 13)

  return y + 24
}

function drawPiezasTable(doc: jsPDF, cotizacion: Cotizacion, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('Piezas solicitadas', MARGIN, y)
  y += 5

  // Encabezado tabla
  doc.setFillColor(51, 65, 85)
  doc.rect(MARGIN, y, COL_W, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('#', MARGIN + 3, y + 5)
  doc.text('Ancho (m)', MARGIN + 14, y + 5)
  doc.text('Alto (m)', MARGIN + 50, y + 5)
  doc.text('Cantidad', MARGIN + 86, y + 5)
  doc.text('Área unitaria', MARGIN + 118, y + 5)
  doc.text('Área total', MARGIN + 155, y + 5)
  y += 7

  doc.setFont('helvetica', 'normal')
  cotizacion.piezas.forEach((p, i) => {
    const bg: [number, number, number] = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
    doc.setFillColor(...bg)
    doc.rect(MARGIN, y, COL_W, 6.5, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(MARGIN, y, COL_W, 6.5, 'S')
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(8.5)
    doc.text(String(i + 1), MARGIN + 3, y + 4.5)
    doc.text(fmt(p.ancho), MARGIN + 14, y + 4.5)
    doc.text(fmt(p.alto), MARGIN + 50, y + 4.5)
    doc.text(String(p.cantidad), MARGIN + 86, y + 4.5)
    doc.text(`${(p.ancho * p.alto).toFixed(3)} m²`, MARGIN + 118, y + 4.5)
    doc.text(`${(p.ancho * p.alto * p.cantidad).toFixed(3)} m²`, MARGIN + 155, y + 4.5)
    y += 6.5
  })

  // Fila total
  const areaTotalPiezas = cotizacion.resultado.areaPiezas
  doc.setFillColor(241, 245, 249)
  doc.rect(MARGIN, y, COL_W, 6.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  doc.text('TOTAL', MARGIN + 3, y + 4.5)
  doc.text(`${areaTotalPiezas.toFixed(3)} m²`, MARGIN + 155, y + 4.5)
  y += 6.5

  return y + 6
}

function drawResumenHojas(doc: jsPDF, cotizacion: Cotizacion, y: number): number {
  const { tipo, optima } = cotizacion.resultado
  const grupoStr = cotizacion.materialGrupo === 'ESPEJO' ? 'Espejo' : 'Vidrio'

  const hojas: { label: string; tipo: TipoFraccion; ancho: number; alto: number }[] = []
  if (tipo === 'mono') {
    const s = optima as SolucionMono
    for (let i = 0; i < s.nUnidades; i++)
      hojas.push({ label: s.superficie.label, tipo: s.superficie.tipo, ancho: s.superficie.ancho, alto: s.superficie.alto })
  } else {
    const c = optima as SolucionCombinada
    for (const sol of [c.solA, c.solB])
      for (let i = 0; i < sol.nUnidades; i++)
        hojas.push({ label: sol.superficie.label, tipo: sol.superficie.tipo, ancho: sol.superficie.ancho, alto: sol.superficie.alto })
  }

  const agrupado = new Map<string, { label: string; tipo: TipoFraccion; cantidad: number; ancho: number; alto: number }>()
  for (const h of hojas) {
    if (agrupado.has(h.label)) agrupado.get(h.label)!.cantidad++
    else agrupado.set(h.label, { ...h, cantidad: 1 })
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('Material a vender', MARGIN, y)
  y += 5

  doc.setFillColor(51, 65, 85)
  doc.rect(MARGIN, y, COL_W, 7, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Descripción', MARGIN + 3, y + 5)
  doc.text('Cant.', MARGIN + 108, y + 5)
  doc.text('Dimensiones', MARGIN + 124, y + 5)
  doc.text('Área', MARGIN + 165, y + 5)
  y += 7

  doc.setFont('helvetica', 'normal')
  let idx = 0
  for (const v of agrupado.values()) {
    const bg: [number, number, number] = idx % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
    doc.setFillColor(...bg)
    doc.rect(MARGIN, y, COL_W, 7, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.rect(MARGIN, y, COL_W, 7, 'S')
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(8)
    doc.text(`${tipoNombre(v.tipo)} — ${grupoStr} ${cotizacion.materialLabel}`, MARGIN + 3, y + 4.8)
    doc.text(String(v.cantidad), MARGIN + 108, y + 4.8)
    doc.text(`${fmt(v.ancho)} × ${fmt(v.alto)} m`, MARGIN + 124, y + 4.8)
    doc.text(`${(v.cantidad * v.ancho * v.alto).toFixed(3)} m²`, MARGIN + 165, y + 4.8)
    y += 7
    idx++
  }
  return y + 6
}

function drawDisclaimer(doc: jsPDF, y: number): number {
  const texto =
    'Revisar bien las cantidades y medidas de las piezas requeridas, ya que esta información es de carácter informativo y Vidrios el Castillo no se hace responsable si las medidas no son correctas, deben ser verificadas por el cliente.'

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  const lines = doc.splitTextToSize(texto, COL_W - 8)
  const boxH = lines.length * 4.2 + 8

  // Fondo rojo claro + borde rojo
  doc.setFillColor(254, 226, 226)
  doc.setDrawColor(239, 68, 68)
  doc.setLineWidth(0.6)
  doc.roundedRect(MARGIN, y, COL_W, boxH, 2, 2, 'FD')

  // Texto rojo oscuro
  doc.setTextColor(185, 28, 28)
  doc.text(lines, MARGIN + 4, y + 5.5)

  return y + boxH + 4
}

function drawMetricas(doc: jsPDF, cotizacion: Cotizacion, y: number): number {
  const { tipo, optima, areaPiezas } = cotizacion.resultado
  let areaVendida = 0, desperdicio = 0, eficiencia = 0, nHojas = 0

  if (tipo === 'mono') {
    const s = optima as SolucionMono
    areaVendida = s.areaVendida; desperdicio = s.desperdicioM2
    eficiencia = s.eficienciaPct; nHojas = s.nUnidades
  } else {
    const c = optima as SolucionCombinada
    areaVendida = c.areaVendidaTotal; desperdicio = c.desperdicioTotal
    eficiencia = c.eficienciaPct; nHojas = c.solA.nUnidades + c.solB.nUnidades
  }

  const cards = [
    { label: 'Hojas a vender', value: String(nHojas), color: [219, 234, 254] as [number,number,number] },
    { label: 'Área vendida',   value: `${areaVendida.toFixed(2)} m²`, color: [241, 245, 249] as [number,number,number] },
    { label: 'Área piezas',    value: `${areaPiezas.toFixed(2)} m²`,  color: [241, 245, 249] as [number,number,number] },
    { label: 'Desperdicio',    value: `${desperdicio.toFixed(2)} m²`, color: [254, 243, 199] as [number,number,number] },
    { label: 'Eficiencia',     value: `${eficiencia.toFixed(1)}%`,    color: [220, 252, 231] as [number,number,number] },
  ]

  const cw = COL_W / cards.length
  cards.forEach((card, i) => {
    const cx = MARGIN + i * cw
    doc.setFillColor(...card.color)
    doc.roundedRect(cx, y, cw - 2, 16, 2, 2, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text(card.label, cx + (cw - 2) / 2, y + 5.5, { align: 'center' })
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(15, 23, 42)
    doc.text(card.value, cx + (cw - 2) / 2, y + 12, { align: 'center' })
  })

  return y + 22
}

// ── Dibujar croquis de una hoja ───────────────────────────────────────────────

function drawCroquis(
  doc: jsPDF,
  sol: SolucionMono,
  layoutIdx: number,
  hojaNum: number,
  y: number
): number {
  const layout     = sol.layouts[layoutIdx]
  const anchoHoja  = sol.superficie.ancho
  const altoHoja   = sol.superficie.alto
  const label      = sol.superficie.label

  const DIAG_MAX_W = COL_W * 0.62
  const DIAG_MAX_H = 80
  const escala     = Math.min(DIAG_MAX_W / anchoHoja, DIAG_MAX_H / altoHoja)
  const hojaW      = anchoHoja * escala
  const hojaH      = altoHoja  * escala
  const ox         = MARGIN + 6
  const oy         = y + 10

  // Título de la hoja
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(30, 41, 59)
  doc.text(`Hoja ${hojaNum} — ${label}  (${fmt(anchoHoja)} × ${fmt(altoHoja)} m)`, MARGIN, y + 5)

  // Fondo de desperdicio (trama diagonal simulada con rectángulo gris)
  doc.setFillColor(226, 232, 240)
  doc.setDrawColor(148, 163, 184)
  doc.setLineWidth(0.5)
  doc.rect(ox, oy, hojaW, hojaH, 'FD')

  // Piezas
  for (const p of layout.colocadas) {
    const color  = COLORES[p.piezaIdx % COLORES.length]
    const stroke = COLORES_STROKE[p.piezaIdx % COLORES_STROKE.length]
    const px = ox + p.x     * escala
    const py = oy + p.y     * escala
    const pw = p.ancho      * escala
    const ph = p.alto       * escala

    doc.setFillColor(...color)
    doc.setDrawColor(...stroke)
    doc.setLineWidth(0.4)
    doc.rect(px, py, pw, ph, 'FD')

    // Etiqueta de medidas dentro de la pieza
    const fs = Math.max(5.5, Math.min(8, pw / 5))
    if (pw > 8 && ph > 6) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(fs)
      doc.setTextColor(30, 41, 59)
      doc.text(`${fmt(p.ancho)} m`, px + pw / 2, py + ph / 2 - fs * 0.3, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.text(`×${fmt(p.alto)} m`, px + pw / 2, py + ph / 2 + fs * 0.9, { align: 'center' })
    }
  }

  // Dimensiones de la hoja
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`${fmt(anchoHoja)} m`, ox + hojaW / 2, oy - 2, { align: 'center' })
  doc.text(`${fmt(altoHoja)} m`, ox - 2, oy + hojaH / 2, { align: 'right' })

  // Leyenda lateral
  const leyX   = ox + hojaW + 8
  const leyMaxW = A4W - MARGIN - leyX
  const piezasUnicas = new Map<number, { ancho: number; alto: number; cnt: number }>()
  for (const p of layout.colocadas) {
    const e = piezasUnicas.get(p.piezaIdx)
    if (e) e.cnt++
    else piezasUnicas.set(p.piezaIdx, { ancho: p.rotada ? p.alto : p.ancho, alto: p.rotada ? p.ancho : p.alto, cnt: 1 })
  }

  let ly = oy + 4
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text('PIEZAS', leyX, ly)
  ly += 5

  for (const [idx, info] of piezasUnicas.entries()) {
    const c = COLORES[idx % COLORES.length]
    doc.setFillColor(...c)
    doc.setDrawColor(...COLORES_STROKE[idx % COLORES_STROKE.length])
    doc.rect(leyX, ly - 3, 4, 4, 'FD')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(30, 41, 59)
    const txt = `${info.cnt}× ${fmt(info.ancho)} × ${fmt(info.alto)} m`
    doc.text(txt.substring(0, Math.floor(leyMaxW / 1.8)), leyX + 6, ly)
    ly += 5.5
  }

  // Métricas de la hoja
  ly += 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  const ef = layout.eficiencia.toFixed(1)
  const sob = (layout.areaSuperficie - layout.areaUsada).toFixed(3)
  doc.text(`Eficiencia: ${ef}%`, leyX, ly); ly += 4.5
  doc.text(`Sobrante total: ${sob} m²`, leyX, ly)

  if (layout.sobrantes.length > 0) {
    ly += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.text('SOBRANTES', leyX, ly)
    ly += 4
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    for (const s of layout.sobrantes) {
      doc.setTextColor(30, 41, 59)
      doc.text(`${fmt(s.w)} × ${fmt(s.h)} m`, leyX, ly)
      ly += 3.8
    }
  }

  // Línea separadora
  const totalH = Math.max(oy + hojaH, ly) - y + 8
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y + totalH, MARGIN + COL_W, y + totalH)

  return y + totalH + 6
}

// ── Punto de entrada público ──────────────────────────────────────────────────

export function generarPDF(cotizacion: Cotizacion): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  doc.setLineWidth(0.3)

  // ── Página 1: resumen ──────────────────────────────────────────────────────
  drawHeader(doc, cotizacion)
  let y = 28
  y = drawInfoBand(doc, cotizacion, y)
  y = drawPiezasTable(doc, cotizacion, y)
  y = drawResumenHojas(doc, cotizacion, y)
  y = drawMetricas(doc, cotizacion, y)

  // Leyenda de advertencia antes de los croquis
  const disclaimerH = 28 // alto aproximado de la caja de advertencia
  if (y + disclaimerH > A4H - 15) {
    doc.addPage()
    drawHeader(doc, cotizacion)
    y = 28
  }
  y = drawDisclaimer(doc, y)

  // ── Páginas siguientes: un croquis por hoja ────────────────────────────────
  const { tipo, optima } = cotizacion.resultado
  const solucionesMono: SolucionMono[] =
    tipo === 'mono'
      ? [optima as SolucionMono]
      : [(optima as SolucionCombinada).solA, (optima as SolucionCombinada).solB]

  let hojaNum = 0
  for (const sol of solucionesMono) {
    for (let i = 0; i < sol.layouts.length; i++) {
      hojaNum++
      // Calcular altura del croquis para decidir si cabe en la página actual
      const altoHoja = sol.superficie.alto
      const anchoHoja = sol.superficie.ancho
      const escala = Math.min((COL_W * 0.62) / anchoHoja, 80 / altoHoja)
      const hojaH = altoHoja * escala + 20

      if (y + hojaH > A4H - 15) {
        doc.addPage()
        drawHeader(doc, cotizacion)
        y = 28
      }
      y = drawCroquis(doc, sol, i, hojaNum, y)
    }
  }

  // ── Pie de página en todas las páginas ────────────────────────────────────
  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(`${EMPRESA} — Optimizador de cortes`, MARGIN, A4H - 6)
    doc.text(`Pág. ${p} / ${total}`, A4W - MARGIN, A4H - 6, { align: 'right' })
  }

  // ── Descargar ──────────────────────────────────────────────────────────────
  const fecha = cotizacion.fecha.toISOString().slice(0, 10)
  const cliente = cotizacion.clienteNombre
    ? `_${cotizacion.clienteNombre.replace(/\s+/g, '_')}`
    : ''
  doc.save(`cotizacion_${String(cotizacion.numero).padStart(4, '0')}${cliente}_${fecha}.pdf`)
}
