import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Prospecto, ProspectoInput } from '../types/prospectos'

const COL = 'prospectos'

export function suscribirProspectos(
  callback: (prospectos: Prospecto[]) => void
): Unsubscribe {
  const q = query(collection(db, COL), orderBy('fechaCreacion', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prospecto)))
  })
}

export async function guardarProspectos(prospectos: ProspectoInput[]): Promise<void> {
  await Promise.all(
    prospectos.map(p =>
      addDoc(collection(db, COL), { ...p, fechaCreacion: serverTimestamp() })
    )
  )
}

export async function actualizarProspecto(
  id: string,
  cambios: Partial<ProspectoInput>
): Promise<void> {
  await updateDoc(doc(db, COL, id), cambios)
}

export async function eliminarProspecto(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id))
}
