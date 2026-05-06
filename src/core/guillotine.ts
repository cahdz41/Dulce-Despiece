import type { PiezaExpandida, PiezaColocada, ResultadoUnidad, RectSobrante, Superficie } from '../types'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

// Elimina rectángulos que están completamente contenidos dentro de otro más grande
function filtrarSobrantes(espacios: Rect[]): RectSobrante[] {
  return espacios.filter((a, i) =>
    !espacios.some((b, j) => i !== j &&
      b.x <= a.x + 0.001 && b.y <= a.y + 0.001 &&
      b.x + b.w >= a.x + a.w - 0.001 &&
      b.y + b.h >= a.y + a.h - 0.001
    )
  )
}

export function empacar(
  superficie: Superficie,
  piezas: PiezaExpandida[],
  kerf: number
): ResultadoUnidad {
  const espacios: Rect[] = [{ x: 0, y: 0, w: superficie.ancho, h: superficie.alto }]
  const colocadas: PiezaColocada[] = []
  const pendientes: PiezaExpandida[] = []

  for (const pieza of piezas) {
    let colocada = false

    // Ordenar espacios de menor a mayor área para aprovechar espacios pequeños primero
    espacios.sort((a, b) => a.w * a.h - b.w * b.h)

    for (let i = 0; i < espacios.length; i++) {
      const e = espacios[i]

      const intentarColocar = (pw: number, ph: number, rotada: boolean): boolean => {
        if (pw <= e.w + 0.001 && ph <= e.h + 0.001) {
          colocadas.push({ ancho: pw, alto: ph, piezaIdx: pieza.piezaIdx, x: e.x, y: e.y, rotada })

          const sobranteDer: Rect = { x: e.x + pw + kerf, y: e.y,        w: e.w - pw - kerf, h: ph           }
          const sobranteInf: Rect = { x: e.x,             y: e.y + ph + kerf, w: e.w,         h: e.h - ph - kerf }

          espacios.splice(i, 1)
          if (sobranteDer.w > 0.001 && sobranteDer.h > 0.001) espacios.push(sobranteDer)
          if (sobranteInf.w > 0.001 && sobranteInf.h > 0.001) espacios.push(sobranteInf)
          return true
        }
        return false
      }

      if (intentarColocar(pieza.ancho, pieza.alto, false)) { colocada = true; break }
      if (intentarColocar(pieza.alto, pieza.ancho, true))  { colocada = true; break }
    }

    if (!colocada) pendientes.push(pieza)
  }

  const areaUsada = colocadas.reduce((s, p) => s + p.ancho * p.alto, 0)
  const areaSuperficie = superficie.ancho * superficie.alto

  return {
    colocadas,
    pendientes,
    sobrantes: filtrarSobrantes(espacios),
    areaUsada,
    areaSuperficie,
    eficiencia: areaSuperficie > 0 ? (areaUsada / areaSuperficie) * 100 : 0,
  }
}

export function empacarCompleto(
  superficie: Superficie,
  piezas: PiezaExpandida[],
  kerf: number
): { layouts: ResultadoUnidad[]; nUnidades: number } {
  const layouts: ResultadoUnidad[] = []
  let pendientes = [...piezas]

  while (pendientes.length > 0) {
    const resultado = empacar(superficie, pendientes, kerf)
    layouts.push(resultado)

    if (resultado.colocadas.length === 0) {
      // Ninguna pieza cabe en esta superficie — no contar esta unidad vacía
      layouts.pop()
      break
    }
    pendientes = resultado.pendientes
  }

  return { layouts, nUnidades: layouts.length }
}
