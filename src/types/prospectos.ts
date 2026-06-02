import type { Timestamp } from 'firebase/firestore'

export type EstatusProspecto = 'nuevo' | 'contactado' | 'descartado'

export interface Prospecto {
  id: string
  nombre: string
  giro: string | null
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  notas: string | null
  estatus: EstatusProspecto
  fechaCreacion: Timestamp
}

export type ProspectoInput = Omit<Prospecto, 'id' | 'fechaCreacion'>
