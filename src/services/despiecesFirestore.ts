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
import type { Despiece, DespieceInput } from '../types/despieces'

const COL = 'despieces'

export function suscribirDespieces(
  callback: (despieces: Despiece[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, COL), orderBy('fecha', 'desc'))
  return onSnapshot(
    q,
    snap => {
      const despieces = snap.docs.map(d => ({ id: d.id, ...d.data() } as Despiece))
      callback(despieces)
    },
    err => {
      console.error('Error al suscribir despieces:', err)
      onError?.(err)
      callback([])
    }
  )
}

export async function guardarDespiece(data: DespieceInput): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    fecha: serverTimestamp(),
  })
  return ref.id
}

export async function actualizarDespiece(
  id: string,
  data: Partial<DespieceInput>
): Promise<void> {
  await updateDoc(doc(db, COL, id), {
    ...data,
    fechaModificacion: serverTimestamp(),
  })
}
