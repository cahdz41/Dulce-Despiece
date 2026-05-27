import type { Timestamp } from 'firebase/firestore'
import type { Cotizacion } from './index'

export interface Despiece {
  id: string
  clienteNombre: string
  materialLabel: string
  materialGrupo: 'VIDRIO' | 'ESPEJO'
  materialKey: string
  piezas: Cotizacion['piezas']
  resultado: Cotizacion['resultado']
  pdfBase64: string
  numero: number
  fecha: Timestamp
  fechaModificacion?: Timestamp
}

export interface DespieceInput {
  clienteNombre: string
  materialLabel: string
  materialGrupo: 'VIDRIO' | 'ESPEJO'
  materialKey: string
  piezas: Cotizacion['piezas']
  resultado: Cotizacion['resultado']
  pdfBase64: string
  numero: number
}
