import { useEffect, useState } from 'react'
import { suscribirFacturas } from '../services/firestore'
import type { Factura, EstatusFactura } from '../types/facturas'

export function useFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsub = suscribirFacturas(data => {
      setFacturas(data)
      setCargando(false)
    })
    return unsub
  }, [])

  const pendientes = facturas.filter(f => f.estatus === 'pendiente')
  const finalizadas = facturas.filter(f => f.estatus === 'finalizada')
  const canceladas = facturas.filter(f => f.estatus === 'cancelada')

  function filtrarPor(estatus: EstatusFactura | 'todas') {
    if (estatus === 'todas') return facturas
    return facturas.filter(f => f.estatus === estatus)
  }

  return { facturas, pendientes, finalizadas, canceladas, filtrarPor, cargando, error }
}
