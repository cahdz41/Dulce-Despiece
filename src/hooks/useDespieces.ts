import { useEffect, useState, useRef } from 'react'
import { suscribirDespieces } from '../services/despiecesFirestore'
import type { Despiece } from '../types/despieces'

export function useDespieces() {
  const [despieces, setDespieces] = useState<Despiece[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let mounted = true

    timeoutRef.current = setTimeout(() => {
      if (mounted) {
        setError('No se pudo conectar con la base de datos. Revisa tu conexión a internet.')
        setCargando(false)
      }
    }, 10000)

    const unsub = suscribirDespieces(
      data => {
        if (mounted) {
          setDespieces(data)
          setCargando(false)
          setError(null)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
      },
      err => {
        if (mounted) {
          setError(err.message || 'Error al cargar los despieces.')
          setCargando(false)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
          }
        }
      }
    )

    return () => {
      mounted = false
      unsub()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { despieces, cargando, error }
}
