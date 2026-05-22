import { jsPDF } from 'jspdf'

export interface Etiqueta {
  clave: string
  descripcion: string
}

export type FormatoEtiquetas = '18' | '4' | '1'

export function generarEtiquetasPDF(
  etiquetas: Etiqueta[],
  formato: FormatoEtiquetas = '18'
): void {
  // ── Configuración según formato ────────────────────────────────────────────
  let PAGE_W: number, PAGE_H: number, MARGIN_H: number, MARGIN_V: number
  let COLS: number, ROWS: number, GAP_H: number, GAP_V: number
  let orientation: 'portrait' | 'landscape'
  let claveSize: number, descSize: number, padX: number, gapBetween: number

  if (formato === '18') {
    orientation = 'portrait'
    PAGE_W = 210
    PAGE_H = 297
    MARGIN_H = 6
    MARGIN_V = 6
    COLS = 2
    ROWS = 9
    GAP_H = 2
    GAP_V = 1.5
    claveSize = 26
    descSize = 9.5
    padX = 3
    gapBetween = 2
  } else if (formato === '4') {
    orientation = 'landscape'
    PAGE_W = 297
    PAGE_H = 210
    MARGIN_H = 6
    MARGIN_V = 6
    COLS = 2
    ROWS = 2
    GAP_H = 2
    GAP_V = 2
    claveSize = 64
    descSize = 20
    padX = 4
    gapBetween = 4
  } else {
    // '1'
    orientation = 'landscape'
    PAGE_W = 297
    PAGE_H = 210
    MARGIN_H = 6
    MARGIN_V = 6
    COLS = 1
    ROWS = 1
    GAP_H = 0
    GAP_V = 0
    claveSize = 160
    descSize = 52
    padX = 6
    gapBetween = 6
  }

  const LABEL_W = (PAGE_W - MARGIN_H * 2 - GAP_H * (COLS - 1)) / COLS
  const LABEL_H = (PAGE_H - MARGIN_V * 2 - GAP_V * (ROWS - 1)) / ROWS

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation })

  const PER_PAGE = COLS * ROWS

  etiquetas.forEach((etiqueta, idx) => {
    const pageIdx = Math.floor(idx / PER_PAGE)
    const posInPage = idx % PER_PAGE

    // Nueva página a partir de la segunda
    if (posInPage === 0 && pageIdx > 0) doc.addPage()

    const col = posInPage % COLS
    const row = Math.floor(posInPage / COLS)

    const x = MARGIN_H + col * (LABEL_W + GAP_H)
    const y = MARGIN_V + row * (LABEL_H + GAP_V)

    // Borde del recuadro
    doc.setDrawColor(80, 80, 80)
    doc.setLineWidth(0.3)
    doc.rect(x, y, LABEL_W, LABEL_H)

    const textW = LABEL_W - padX * 2

    // ── Clave (bold) ────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(claveSize)
    const claveLines = doc.splitTextToSize(etiqueta.clave, textW)
    const claveLineH = claveSize * 0.3528 // pt → mm
    const claveTotalH = claveLines.length * claveLineH

    // ── Descripción (normal) ────────────────────────────────────────────────
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(descSize)
    const descLines = doc.splitTextToSize(etiqueta.descripcion, textW)
    const descLineH = descSize * 0.3528
    const descTotalH = descLines.length * descLineH

    // Centrar bloque verticalmente dentro del recuadro
    const totalBlock = claveTotalH + gapBetween + descTotalH
    const startY = y + (LABEL_H - totalBlock) / 2 + claveLineH

    // Imprimir clave
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(claveSize)
    doc.text(claveLines, x + LABEL_W / 2, startY, { align: 'center' })

    // Imprimir descripción
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(descSize)
    doc.text(
      descLines,
      x + LABEL_W / 2,
      startY + claveLineH * (claveLines.length - 1) + gapBetween + descLineH,
      { align: 'center' }
    )
  })

  doc.save(`etiquetas_${new Date().toISOString().slice(0, 10)}.pdf`)
}
