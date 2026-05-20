import { jsPDF } from 'jspdf'

export interface Etiqueta {
  clave: string
  descripcion: string
}

// Medidas en mm (página A4 portrait: 210 × 297)
const PAGE_W = 210
const PAGE_H = 297
const MARGIN_H = 6      // margen izquierdo y derecho
const MARGIN_V = 6      // margen superior e inferior
const COLS = 2
const ROWS = 9
const GAP_H = 2         // separación horizontal entre columnas
const GAP_V = 1.5       // separación vertical entre filas

const LABEL_W = (PAGE_W - MARGIN_H * 2 - GAP_H * (COLS - 1)) / COLS   // ≈ 98mm
const LABEL_H = (PAGE_H - MARGIN_V * 2 - GAP_V * (ROWS - 1)) / ROWS   // ≈ 31.7mm

export function generarEtiquetasPDF(etiquetas: Etiqueta[]): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

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

    const padX = 3          // padding horizontal interno
    const textW = LABEL_W - padX * 2

    // ── Clave (bold, grande) ──────────────────────────────────────
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    const claveLines = doc.splitTextToSize(etiqueta.clave, textW)
    const claveLineH = 13 * 0.3528        // pt → mm (1pt = 0.3528mm)
    const claveTotalH = claveLines.length * claveLineH

    // ── Descripción (normal, pequeña) ─────────────────────────────
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    const descLines = doc.splitTextToSize(etiqueta.descripcion, textW)
    const descLineH = 7.5 * 0.3528
    const descTotalH = descLines.length * descLineH

    // Centrar bloque verticalmente dentro del recuadro
    const gapBetween = 2
    const totalBlock = claveTotalH + gapBetween + descTotalH
    const startY = y + (LABEL_H - totalBlock) / 2 + claveLineH

    // Imprimir clave
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(claveLines, x + LABEL_W / 2, startY, { align: 'center' })

    // Imprimir descripción
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(descLines, x + LABEL_W / 2, startY + claveLineH * (claveLines.length - 1) + gapBetween + descLineH, { align: 'center' })
  })

  doc.save(`etiquetas_${new Date().toISOString().slice(0, 10)}.pdf`)
}
