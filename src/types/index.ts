// ── Inventario ────────────────────────────────────────────────────────────────

export interface Material {
  id: string
  descripcion: string
  grupo: 'VIDRIO' | 'ESPEJO'
  subclasif: string
  color: string
  anchoHoja: number   // metros
  altoHoja: number    // metros
  grosorMm: number    // 3 | 4 | 6 | 9 | 12
  stock: number       // hojas disponibles
  permiteMedia: boolean
  permiteCuarto: boolean
}

// ── Pedido ────────────────────────────────────────────────────────────────────

export interface PiezaSolicitada {
  ancho: number   // metros
  alto: number    // metros
  cantidad: number
}

export interface Partida {
  id: string
  materialId: string
  piezas: PiezaSolicitada[]
}

// ── Cotización (resultado + metadata para PDF e historial) ────────────────────

export interface Cotizacion {
  numero: number
  fecha: Date
  clienteNombre: string
  materialLabel: string   // ej. "Claro 6mm"
  piezas: PiezaSolicitada[]
  resultado: ResultadoOptimizacion
}

// ── Algoritmo interno ─────────────────────────────────────────────────────────

export type TipoFraccion = 'completa' | 'media_h' | 'media_v' | 'cuarto'

export interface Superficie {
  materialId: string
  tipo: TipoFraccion
  ancho: number
  alto: number
  label: string
}

export interface PiezaExpandida {
  ancho: number
  alto: number
  piezaIdx: number  // índice en la lista original (para colorear)
}

export interface PiezaColocada {
  ancho: number
  alto: number
  piezaIdx: number
  x: number
  y: number
  rotada: boolean
}

export interface RectSobrante {
  x: number   // metros desde esquina superior-izquierda de la hoja
  y: number
  w: number
  h: number
}

export interface ResultadoUnidad {
  colocadas: PiezaColocada[]
  pendientes: PiezaExpandida[]
  sobrantes: RectSobrante[]
  areaUsada: number
  areaSuperficie: number
  eficiencia: number   // 0-100
}

export interface SolucionMono {
  superficie: Superficie
  nUnidades: number
  layouts: ResultadoUnidad[]
  areaVendida: number
  areaPiezas: number
  desperdicioM2: number
  eficienciaPct: number
  stockSuficiente: boolean
}

export interface SolucionCombinada {
  solA: SolucionMono
  solB: SolucionMono
  desperdicioTotal: number
  areaVendidaTotal: number
  eficienciaPct: number
}

export type Solucion = SolucionMono | SolucionCombinada

export interface ResultadoOptimizacion {
  optima: Solucion
  tipo: 'mono' | 'combinada'
  alternativas: SolucionMono[]   // top 5 mono-hoja ordenadas
  areaPiezas: number
  error?: string
}
