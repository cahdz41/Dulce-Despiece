import type {
  Material,
  PiezaSolicitada,
  PiezaExpandida,
  Superficie,
  SolucionMono,
  SolucionCombinada,
  ResultadoOptimizacion,
} from '../types'
import { generarSuperficies, stockPorFraccion } from './surfaces'
import { empacarCompleto } from './guillotine'

// Mapa de materiales para lookup rápido por ID
type MaterialMap = Map<string, Material>

const DEFAULT_KERF = 0.002  // 2 mm en metros

// ── Fase 1: expandir y ordenar piezas ────────────────────────────────────────

function expandirPiezas(piezas: PiezaSolicitada[]): PiezaExpandida[] {
  const lista: PiezaExpandida[] = []
  piezas.forEach((p, idx) => {
    for (let i = 0; i < p.cantidad; i++) {
      lista.push({ ancho: p.ancho, alto: p.alto, piezaIdx: idx })
    }
  })
  // FFD: mayor área primero
  lista.sort((a, b) => b.ancho * b.alto - a.ancho * a.alto)
  return lista
}

// ── Fase 3+4: solución mono-hoja para una superficie ─────────────────────────

function resolverMono(
  superficie: Superficie,
  piezas: PiezaExpandida[],
  materialMap: MaterialMap,
  kerf: number
): SolucionMono {
  const areaPiezas = piezas.reduce((s, p) => s + p.ancho * p.alto, 0)
  const { layouts, nUnidades } = empacarCompleto(superficie, piezas, kerf)

  const areaVendida = nUnidades * superficie.ancho * superficie.alto
  const desperdicioM2 = areaVendida - areaPiezas
  const eficienciaPct = areaPiezas > 0 ? (areaPiezas / areaVendida) * 100 : 0
  const material = materialMap.get(superficie.materialId)!
  const stockDisponible = stockPorFraccion(material, superficie.tipo)

  return {
    superficie,
    nUnidades,
    layouts,
    areaVendida,
    areaPiezas,
    desperdicioM2,
    eficienciaPct,
    stockSuficiente: stockDisponible >= nUnidades,
  }
}

// ── Fase 5: ranking mono-hoja ─────────────────────────────────────────────────

function rankingMono(
  superficies: Superficie[],
  piezas: PiezaExpandida[],
  materialMap: MaterialMap,
  kerf: number
): SolucionMono[] {
  const resultados: SolucionMono[] = []

  for (const sup of superficies) {
    // Verificar que al menos la pieza más grande cabe
    const piezaMasGrande = piezas[0]
    const cabeNormal  = piezaMasGrande.ancho <= sup.ancho && piezaMasGrande.alto <= sup.alto
    const cabeGirada  = piezaMasGrande.alto  <= sup.ancho && piezaMasGrande.ancho <= sup.alto
    if (!cabeNormal && !cabeGirada) continue

    const sol = resolverMono(sup, piezas, materialMap, kerf)

    // Descartar si el algoritmo no pudo colocar todas las piezas
    const ultimoLayout = sol.layouts[sol.layouts.length - 1]
    const todasColocadas = ultimoLayout !== undefined && ultimoLayout.pendientes.length === 0

    if (todasColocadas && sol.stockSuficiente) {
      resultados.push(sol)
    }
  }

  resultados.sort((a, b) => {
    if (Math.abs(a.desperdicioM2 - b.desperdicioM2) > 0.001) return a.desperdicioM2 - b.desperdicioM2
    return a.nUnidades - b.nUnidades
  })

  return resultados
}

// ── Fase 6: optimización combinada (2 superficies) ───────────────────────────

function optimizarCombinado(
  superficies: Superficie[],
  piezas: PiezaExpandida[],
  materialMap: MaterialMap,
  kerf: number
): SolucionCombinada | null {
  let mejorGlobal: SolucionCombinada | null = null

  // Agrupar piezas por tipo (mismo ancho×alto) para Poda 3
  const tipos = agruparTipos(piezas)

  for (let i = 0; i < superficies.length; i++) {
    for (let j = i + 1; j < superficies.length; j++) {
      const supA = superficies[i]
      const supB = superficies[j]

      // Poda 1: no evaluar superficies idénticas (mismo material + mismo tipo)
      if (supA.materialId === supB.materialId && supA.tipo === supB.tipo) continue

      // Poda 2: detectar asignaciones forzadas
      const forzadasA: PiezaExpandida[] = []
      const forzadasB: PiezaExpandida[] = []
      const libres: { ancho: number; alto: number; piezaIdx: number; total: number }[] = []

      let imposible = false
      for (const tipo of tipos) {
        const cabeA = cabePieza(tipo, supA)
        const cabeB = cabePieza(tipo, supB)
        if (!cabeA && !cabeB) { imposible = true; break }
        if (!cabeA) {
          for (let k = 0; k < tipo.total; k++) forzadasB.push({ ancho: tipo.ancho, alto: tipo.alto, piezaIdx: tipo.piezaIdx })
        } else if (!cabeB) {
          for (let k = 0; k < tipo.total; k++) forzadasA.push({ ancho: tipo.ancho, alto: tipo.alto, piezaIdx: tipo.piezaIdx })
        } else {
          libres.push(tipo)
        }
      }
      if (imposible) continue

      // Poda 3: generar particiones de tipos libres
      const particiones = generarParticiones(libres)

      for (const part of particiones) {
        const grupoA = [...forzadasA, ...part.enA]
        const grupoB = [...forzadasB, ...part.enB]

        if (grupoA.length === 0 || grupoB.length === 0) continue

        const solA = resolverMono(supA, grupoA, materialMap, kerf)
        const solB = resolverMono(supB, grupoB, materialMap, kerf)

        // Verificar que ambas soluciones colocaron todas las piezas
        const aOk = solA.layouts[solA.layouts.length - 1]?.pendientes.length === 0
        const bOk = solB.layouts[solB.layouts.length - 1]?.pendientes.length === 0
        if (!aOk || !bOk) continue

        // Poda 4: stock
        if (!solA.stockSuficiente || !solB.stockSuficiente) continue

        const desperdicioTotal = solA.desperdicioM2 + solB.desperdicioM2
        const areaVendidaTotal = solA.areaVendida + solB.areaVendida
        const areaPiezasTotal  = solA.areaPiezas + solB.areaPiezas
        const eficienciaPct    = (areaPiezasTotal / areaVendidaTotal) * 100

        if (!mejorGlobal || desperdicioTotal < mejorGlobal.desperdicioTotal) {
          mejorGlobal = { solA, solB, desperdicioTotal, areaVendidaTotal, eficienciaPct }
        }
      }
    }
  }

  return mejorGlobal
}

// ── Helpers para la Fase 6 ────────────────────────────────────────────────────

interface TipoPieza {
  ancho: number
  alto: number
  piezaIdx: number
  total: number
}

function agruparTipos(piezas: PiezaExpandida[]): TipoPieza[] {
  const mapa = new Map<string, TipoPieza>()
  for (const p of piezas) {
    const key = `${p.ancho}x${p.alto}:${p.piezaIdx}`
    if (mapa.has(key)) {
      mapa.get(key)!.total++
    } else {
      mapa.set(key, { ancho: p.ancho, alto: p.alto, piezaIdx: p.piezaIdx, total: 1 })
    }
  }
  return Array.from(mapa.values())
}

function cabePieza(tipo: TipoPieza, sup: Superficie): boolean {
  const normal = tipo.ancho <= sup.ancho && tipo.alto <= sup.alto
  const girada = tipo.alto  <= sup.ancho && tipo.ancho <= sup.alto
  return normal || girada
}

interface Particion {
  enA: PiezaExpandida[]
  enB: PiezaExpandida[]
}

function generarParticiones(tipos: TipoPieza[]): Particion[] {
  if (tipos.length === 0) return [{ enA: [], enB: [] }]

  const resultado: Particion[] = []

  function expandir(tipoPieza: TipoPieza, cantidad: number): PiezaExpandida[] {
    return Array.from({ length: cantidad }, () => ({
      ancho: tipoPieza.ancho, alto: tipoPieza.alto, piezaIdx: tipoPieza.piezaIdx,
    }))
  }

  function recur(idx: number, parcialA: PiezaExpandida[], parcialB: PiezaExpandida[]) {
    if (idx === tipos.length) {
      resultado.push({ enA: [...parcialA], enB: [...parcialB] })
      return
    }
    const tipo = tipos[idx]
    // Probar cuántas piezas de este tipo van a A (de 0 a total)
    for (let k = 0; k <= tipo.total; k++) {
      recur(
        idx + 1,
        [...parcialA, ...expandir(tipo, k)],
        [...parcialB, ...expandir(tipo, tipo.total - k)]
      )
    }
  }

  recur(0, [], [])
  return resultado
}

// ── Punto de entrada principal ────────────────────────────────────────────────

/**
 * Optimiza el corte de piezas usando uno o varios materiales del mismo
 * tipo/grosor/color disponibles en inventario.
 * Acepta un array de materiales para poder mezclar distintos tamaños de hoja.
 */
export function optimizar(
  piezas: PiezaSolicitada[],
  materiales: Material[],
  kerf: number = DEFAULT_KERF
): ResultadoOptimizacion {
  if (piezas.length === 0) {
    return { optima: null as any, tipo: 'mono', alternativas: [], areaPiezas: 0, error: 'Sin piezas' }
  }
  if (materiales.length === 0) {
    return { optima: null as any, tipo: 'mono', alternativas: [], areaPiezas: 0, error: 'Sin materiales disponibles' }
  }

  // Fase 1
  const piezasExpandidas = expandirPiezas(piezas)
  const areaPiezas = piezasExpandidas.reduce((s, p) => s + p.ancho * p.alto, 0)

  // Mapa de materiales para lookup O(1)
  const materialMap: MaterialMap = new Map(materiales.map(m => [m.id, m]))

  // Fase 2: superficies candidatas de TODOS los materiales disponibles
  const superficies: Superficie[] = materiales.flatMap(m => generarSuperficies(m))

  // Validar que todas las piezas caben en al menos una superficie
  for (const p of piezasExpandidas) {
    const cabe = superficies.some(s =>
      (p.ancho <= s.ancho && p.alto <= s.alto) ||
      (p.alto  <= s.ancho && p.ancho <= s.alto)
    )
    if (!cabe) {
      return {
        optima: null as any, tipo: 'mono', alternativas: [], areaPiezas,
        error: `Pieza ${p.ancho}×${p.alto} m no cabe en ninguna hoja del inventario`,
      }
    }
  }

  // Fase 5: ranking mono-hoja
  const alternativas = rankingMono(superficies, piezasExpandidas, materialMap, kerf)

  if (alternativas.length === 0) {
    return { optima: null as any, tipo: 'mono', alternativas: [], areaPiezas, error: 'Stock insuficiente para todas las combinaciones' }
  }

  const mejorMono = alternativas[0]

  // Fase 6: optimización combinada (mezcla superficies de distintos materiales)
  const mejorCombinada = optimizarCombinado(superficies, piezasExpandidas, materialMap, kerf)

  if (mejorCombinada && mejorCombinada.desperdicioTotal < mejorMono.desperdicioM2 - 0.001) {
    return {
      optima: mejorCombinada,
      tipo: 'combinada',
      alternativas: alternativas.slice(0, 5),
      areaPiezas,
    }
  }

  return {
    optima: mejorMono,
    tipo: 'mono',
    alternativas: alternativas.slice(0, 5),
    areaPiezas,
  }
}
