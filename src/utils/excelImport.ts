import * as XLSX from 'xlsx'
import type { Material } from '../types'

// Tamaños conocidos y sus reglas
const TAMANOS_CONOCIDOS: Array<{
  ancho: number; alto: number; permiteMedia: boolean; permiteCuarto: boolean
}> = [
  { ancho: 1.80, alto: 2.60, permiteMedia: true, permiteCuarto: false },
  { ancho: 2.30, alto: 2.60, permiteMedia: true, permiteCuarto: false },
  { ancho: 2.60, alto: 3.00, permiteMedia: true, permiteCuarto: false },
  { ancho: 2.60, alto: 3.60, permiteMedia: true, permiteCuarto: true  },
  { ancho: 3.60, alto: 2.50, permiteMedia: true, permiteCuarto: false }, // Reflecta Bronce especial
]

function matchTamano(ancho: number, alto: number) {
  return TAMANOS_CONOCIDOS.find(
    t => Math.abs(t.ancho - ancho) < 0.05 && Math.abs(t.alto - alto) < 0.05
  ) ?? { ancho, alto, permiteMedia: true, permiteCuarto: false }
}

/** Extrae dimensiones de la descripción del producto, ej: "CRISTAL CLARO 6MM 2.6 X 3.6" → [2.6, 3.6] */
function extraerDimensiones(descripcion: string): [number, number] | null {
  // Buscar patrón: número decimal × número decimal (con X o x como separador)
  const match = descripcion.match(/(\d+\.?\d*)\s*[xX]\s*(\d+\.?\d*)/)
  if (!match) return null
  const a = parseFloat(match[1])
  const b = parseFloat(match[2])
  if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return null
  return [a, b]
}

/** Extrae grosor en mm de la descripción o subclasif */
function extraerGrosor(descripcion: string, subclasif: string | null): number {
  const fuente = `${descripcion} ${subclasif ?? ''}`
  // Buscar patrón: número seguido de MM (con o sin espacio)
  const match = fuente.match(/(\d+)\s*MM/i)
  return match ? parseInt(match[1]) : 6
}

/** Limpia el nombre de subclasificación para mostrarlo en la UI */
function limpiarSubclasif(subclasif: string | null, descripcion: string): string {
  if (!subclasif) {
    // Casos sin subclasif: inferir del nombre
    if (/FILTRA\s*PLUS/i.test(descripcion)) return 'Filtra Plus'
    return 'Otro'
  }

  // Mapeo: subclasif del Excel → nombre limpio SIN grosor (el grosor va en grosorMm)
  const mapa: Record<string, string> = {
    'CLARO DE 3 MM':             'Claro',
    'CLARO DE 4 MM':             'Claro',
    'CLARO DE 6 MM':             'Claro',
    'CLARO DE 9 MM':             'Claro',
    'CLARO DE 12 MM':            'Claro',
    'ESPEJO DE 3 MM':            'Espejo',
    'ESPEJO DE 4 MM':            'Espejo',
    'ESPEJO DE 6 MM':            'Espejo',
    'FILTRASOL DE 3 MM':         'Filtrasol',
    'FILTRASOL DE 6 MM':         'Filtrasol',
    'FILTRASOL DE 9 MM':         'Filtrasol',
    'PAVIA 3 MM':                'Satinado',
    'PAVIA 6 MM':                'Satinado',
    'TINTEX DE 6 MM':            'Tintex',
    'TINTEX DE 9 MM':            'Tintex',
    'VITROSOL 6 MM':             'Vitrosol',
    'VITROSOL 9 MM':             'Vitrosol',
    'AZUL 6 MM':                 'Cristazul',
    'REFLECTA BRONCE 6 MM':      'Reflecta Bronce',
    'REFLECTA PLATA 6 MM':       'Reflecta Plata',
    'ESPEJO FILTRASOL DE 6 MM':  'Espejo Filtrasol',
    'ESPEJO VITROSOL DE 6 MM':   'Espejo Vitrosol',
  }

  return mapa[subclasif.trim()] ?? subclasif.trim()
}

export interface ResultadoImportacion {
  materiales: Material[]
  total: number
  errores: string[]
}

// ── Importación de piezas de despiece ─────────────────────────────────────────

export interface PiezaImportada {
  cantidad: number
  ancho: number   // metros
  alto: number    // metros
}

export interface ResultadoPiezasImportadas {
  piezas: PiezaImportada[]
  errores: string[]
}

/**
 * Lee un Excel con formato: Col A = cantidad, Col B = ancho, Col C = alto.
 * Si `unidad` es 'cm', convierte a metros dividiendo entre 100.
 * Ignora filas de encabezado (donde la primera celda no sea numérica) y filas vacías.
 */
export function parsearPiezasDespiece(
  buffer: ArrayBuffer,
  unidad: 'cm' | 'm' = 'm'
): ResultadoPiezasImportadas {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][]

  const piezas: PiezaImportada[] = []
  const errores: string[] = []
  const factor = unidad === 'cm' ? 0.01 : 1

  filas.forEach((fila, i) => {
    const cantidadRaw = fila[0]
    const anchoRaw    = fila[1]
    const altoRaw     = fila[2]

    // Saltar filas completamente vacías
    if (cantidadRaw == null && anchoRaw == null && altoRaw == null) return

    const cantidad = typeof cantidadRaw === 'number'
      ? cantidadRaw
      : parseFloat(String(cantidadRaw ?? '').replace(',', '.'))
    const ancho = typeof anchoRaw === 'number'
      ? anchoRaw
      : parseFloat(String(anchoRaw ?? '').replace(',', '.'))
    const alto = typeof altoRaw === 'number'
      ? altoRaw
      : parseFloat(String(altoRaw ?? '').replace(',', '.'))

    // Saltar encabezados (primera celda no numérica)
    if (isNaN(cantidad)) return

    if (isNaN(ancho) || ancho <= 0)    { errores.push(`Fila ${i + 1}: ancho inválido`);    return }
    if (isNaN(alto)  || alto  <= 0)    { errores.push(`Fila ${i + 1}: alto inválido`);     return }
    if (cantidad < 1 || !Number.isFinite(cantidad)) { errores.push(`Fila ${i + 1}: cantidad inválida`); return }

    piezas.push({
      cantidad: Math.round(cantidad),
      ancho: parseFloat((ancho * factor).toFixed(4)),
      alto:  parseFloat((alto  * factor).toFixed(4)),
    })
  })

  return { piezas, errores }
}

/** Parsea un archivo Excel (.xlsx) y devuelve los materiales VIDRIO/ESPEJO */
export function parsearExcel(buffer: ArrayBuffer): ResultadoImportacion {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 }) as unknown[][]

  const materiales: Material[] = []
  const errores: string[] = []

  for (const fila of filas) {
    const grupo = String(fila[2] ?? '').trim().toUpperCase()
    if (grupo !== 'VIDRIO' && grupo !== 'ESPEJO') continue

    const id          = String(fila[0] ?? '').trim()
    const descripcion = String(fila[1] ?? '').trim()
    const subclasifRaw= fila[3] != null ? String(fila[3]).trim() : null
    const colorRaw    = String(fila[4] ?? '').trim()
    const stockRaw    = fila[6]

    if (!id || !descripcion) continue

    const dims = extraerDimensiones(descripcion)
    if (!dims) {
      errores.push(`${id}: no se pudieron extraer dimensiones de "${descripcion}"`)
      continue
    }

    // Normalizar 3.60×2.60 → 2.60×3.60 (Reflecta Plata viene con dimensiones invertidas)
    // pero preservar 3.60×2.50 (Reflecta Bronce, medida genuinamente diferente)
    let [ancho, alto] = dims
    if (Math.abs(ancho - 3.60) < 0.05 && Math.abs(alto - 2.60) < 0.05) {
      ancho = 2.60
      alto  = 3.60
    }
    const grosorMm = extraerGrosor(descripcion, subclasifRaw)
    const subclasif = limpiarSubclasif(subclasifRaw, descripcion)
    const stock = typeof stockRaw === 'number' ? stockRaw : parseFloat(String(stockRaw ?? 0)) || 0

    // Normalizar color al mismo formato que usa el inventario estático
    const COLOR_MAP: Record<string, string> = {
      ESPEJO: 'Espejo', FILTRASOL: 'Filtrasol', TINTEX: 'Tintex',
      PAVIA: 'Satinado', AZUL: 'Azul', VITROSOL: 'Vitrosol',
      REFLECTA: 'Reflecta', CLARO: 'Claro',
    }
    const color = COLOR_MAP[colorRaw.toUpperCase()] ?? colorRaw

    const tamano = matchTamano(ancho, alto)

    materiales.push({
      id,
      descripcion,
      grupo:         grupo as 'VIDRIO' | 'ESPEJO',
      subclasif,
      color,
      anchoHoja:     tamano.ancho,
      altoHoja:      tamano.alto,
      grosorMm,
      stock,
      permiteMedia:  tamano.permiteMedia,
      permiteCuarto: tamano.permiteCuarto,
    })
  }

  return { materiales, total: materiales.length, errores }
}
