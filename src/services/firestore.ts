import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Factura, FacturaInput, EstatusTransferencia } from '../types/facturas'

const COL = 'facturas'

export function suscribirFacturas(
  callback: (facturas: Factura[]) => void
): Unsubscribe {
  const q = query(collection(db, COL), orderBy('fechaCreacion', 'desc'))
  return onSnapshot(q, snap => {
    const facturas = snap.docs.map(d => ({ id: d.id, ...d.data() } as Factura))
    callback(facturas)
  })
}

export async function crearFactura(data: FacturaInput): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    estatus: 'pendiente',
    fechaCreacion: serverTimestamp(),
  })
  return ref.id
}

export async function actualizarFactura(
  id: string,
  data: Partial<Factura>
): Promise<void> {
  await updateDoc(doc(db, COL, id), data)
}

export async function finalizarFactura(
  id: string,
  fotoUrl?: string,
  fotoPublicId?: string
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    estatus: 'finalizada',
    fechaFinalizacion: serverTimestamp(),
    ...(fotoUrl ? { fotoFacturaUrl: fotoUrl, fotoFacturaPublicId: fotoPublicId } : {}),
  })
}

export async function cancelarFactura(
  id: string,
  motivo: string,
  quienCancelo: string
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    estatus: 'cancelada',
    fechaCancelacion: serverTimestamp(),
    motivoCancelacion: motivo,
    quienCancelo,
  })
}

export async function actualizarEstatusTransferencia(
  id: string,
  estatus: EstatusTransferencia
): Promise<void> {
  await updateDoc(doc(db, COL, id), { estatusTransferencia: estatus })
}
