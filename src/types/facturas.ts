import type { Timestamp } from 'firebase/firestore'

export type TipoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto'
export type EstatusTransferencia = 'proceso_confirmacion' | 'confirmada'
export type EstatusFactura = 'pendiente' | 'finalizada' | 'cancelada'
export type Vendedor = 'Dulce' | 'Fernanda'

export const CHOFERES_FIJOS = ['Raul', 'Rigo', 'Pepe', 'Andres', 'Israel', 'Alejandro', 'Gustavo'] as const

export interface Factura {
  id: string
  numeroFactura: string
  numeroCotizacion: string
  fechaCreacion: Timestamp
  horaEntrega: string
  lugarEntrega: string

  // Personas
  cliente: string
  vendedor: Vendedor
  chofer: string

  // Montos
  montoTotal: number
  descuento: number
  autorizaDescuento: string
  montoFinal: number

  // Pago
  tipoPago: TipoPago
  montoEfectivo: number
  montoTransferencia: number
  montoTarjeta: number
  estatusTransferencia: EstatusTransferencia | ''
  dineroRecibido: number
  quienRecibio: string

  // Estado
  estatus: EstatusFactura

  // Al finalizar
  fechaFinalizacion?: Timestamp
  fotoFacturaUrl?: string
  fotoFacturaPublicId?: string

  // Al cancelar
  fechaCancelacion?: Timestamp
  motivoCancelacion?: string
  quienCancelo?: string
}

export type FacturaInput = Omit<Factura, 'id' | 'fechaCreacion' | 'estatus' | 'fechaFinalizacion' | 'fechaCancelacion'>
