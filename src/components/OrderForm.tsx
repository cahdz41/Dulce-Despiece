import { useMemo, useState } from 'react'
import { optimizar } from '../core/optimizer'
import type { Cotizacion, Material, PiezaSolicitada } from '../types'

interface FilaPieza {
  id: number
  ancho: string
  alto: string
  cantidad: string
}

interface Props {
  inventario: Material[]
  numeroCotizacion: number
  onCotizacion: (c: Cotizacion) => void
}

let nextId = 1

export default function OrderForm({ inventario, numeroCotizacion, onCotizacion }: Props) {
  const [clienteNombre, setClienteNombre] = useState('')
  const [materialKey, setMaterialKey]     = useState<string>('')
  const [kerf, setKerf]                   = useState<string>('2')
  const [filas, setFilas]                 = useState<FilaPieza[]>([
    { id: nextId++, ancho: '', alto: '', cantidad: '1' },
  ])
  const [error, setError]         = useState<string>('')
  const [calculando, setCalculando] = useState(false)

  // Opciones de material derivadas del inventario activo
  const { VIDRIO_OPS, ESPEJO_OPS } = useMemo(() => {
    type Op = { grupo: string; subclasif: string; grosorMm: number; color: string; label: string }
    const vistas = new Set<string>()
    const vidrio: Op[] = []
    const espejo: Op[] = []
    for (const m of inventario) {
      if (m.stock <= 0) continue
      const key = `${m.subclasif}|${m.grosorMm}|${m.color}`
      if (vistas.has(key)) continue
      vistas.add(key)
      const op: Op = { grupo: m.grupo, subclasif: m.subclasif, grosorMm: m.grosorMm,
                       color: m.color, label: `${m.subclasif} ${m.grosorMm}mm` }
      if (m.grupo === 'VIDRIO') vidrio.push(op)
      else espejo.push(op)
    }
    return { VIDRIO_OPS: vidrio, ESPEJO_OPS: espejo }
  }, [inventario])

  function agregarFila() {
    setFilas(f => [...f, { id: nextId++, ancho: '', alto: '', cantidad: '1' }])
  }

  function eliminarFila(id: number) {
    setFilas(f => f.filter(r => r.id !== id))
  }

  function actualizarFila(id: number, campo: keyof Omit<FilaPieza, 'id'>, valor: string) {
    setFilas(f => f.map(r => r.id === id ? { ...r, [campo]: valor } : r))
  }

  function calcular() {
    setError('')
    if (!materialKey) { setError('Selecciona un tipo de material.'); return }

    const piezas: PiezaSolicitada[] = []
    for (const fila of filas) {
      const ancho    = parseFloat(fila.ancho.replace(',', '.'))
      const alto     = parseFloat(fila.alto.replace(',', '.'))
      const cantidad = parseInt(fila.cantidad)
      if (isNaN(ancho) || ancho <= 0)     { setError('Ancho inválido en una de las piezas.'); return }
      if (isNaN(alto)  || alto  <= 0)     { setError('Alto inválido en una de las piezas.');  return }
      if (isNaN(cantidad) || cantidad < 1) { setError('Cantidad inválida en una de las piezas.'); return }
      piezas.push({ ancho, alto, cantidad })
    }
    if (piezas.length === 0) { setError('Agrega al menos una pieza.'); return }

    const [subclasif, grosorStr, color] = materialKey.split('|')
    const grosor    = parseInt(grosorStr)
    const materiales = inventario.filter(
      m => m.subclasif === subclasif && m.grosorMm === grosor && m.color === color && m.stock > 0
    )
    if (materiales.length === 0) { setError('No hay stock disponible para el material seleccionado.'); return }

    const opSeleccionada = [...VIDRIO_OPS, ...ESPEJO_OPS].find(
      o => `${o.subclasif}|${o.grosorMm}|${o.color}` === materialKey
    )

    setCalculando(true)
    setTimeout(() => {
      try {
        const kerfM = (parseFloat(kerf) || 2) / 1000
        const resultado = optimizar(piezas, materiales, kerfM)
        if (resultado.error) {
          setError(resultado.error)
        } else {
          onCotizacion({
            numero:        numeroCotizacion,
            fecha:         new Date(),
            clienteNombre: clienteNombre.trim(),
            materialLabel: opSeleccionada?.label ?? materialKey,
            piezas,
            resultado,
          })
        }
      } catch {
        setError('Error inesperado en el cálculo. Revisa las medidas.')
      } finally {
        setCalculando(false)
      }
    }, 50)
  }

  const opSeleccionada = materialKey
    ? [...VIDRIO_OPS, ...ESPEJO_OPS].find(o => `${o.subclasif}|${o.grosorMm}|${o.color}` === materialKey)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Nuevo Pedido</h2>
        <p className="text-sm text-slate-500 mt-0.5">Ingresa el material y las medidas de las piezas solicitadas.</p>
      </div>

      {/* Nombre del cliente */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nombre del cliente <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          placeholder="ej. Juan Pérez"
          value={clienteNombre}
          onChange={e => setClienteNombre(e.target.value)}
          className="w-full max-w-sm border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Selección de material */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h3 className="font-medium text-slate-700">Material</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vidrio */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Vidrio</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {VIDRIO_OPS.map(op => {
                const key = `${op.subclasif}|${op.grosorMm}|${op.color}`
                return (
                  <label key={key} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    materialKey === key ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="material" value={key} checked={materialKey === key}
                      onChange={() => setMaterialKey(key)} className="accent-blue-500" />
                    <span className="text-sm text-slate-700">{op.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Espejo */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Espejo</p>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {ESPEJO_OPS.map(op => {
                const key = `${op.subclasif}|${op.grosorMm}|${op.color}`
                return (
                  <label key={key} className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    materialKey === key ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                    <input type="radio" name="material" value={key} checked={materialKey === key}
                      onChange={() => setMaterialKey(key)} className="accent-blue-500" />
                    <span className="text-sm text-slate-700">{op.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        {/* Kerf */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
          <label className="text-sm text-slate-600">Grosor de corte (kerf):</label>
          <input type="number" value={kerf} onChange={e => setKerf(e.target.value)}
            min="1" max="10" step="0.5"
            className="w-20 border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <span className="text-sm text-slate-500">mm</span>
        </div>
      </div>

      {/* Tabla de piezas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-700">Piezas solicitadas</h3>
          <span className="text-xs text-slate-400">Medidas en metros</span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 px-1">
            <span className="col-span-1 text-xs font-medium text-slate-500">#</span>
            <span className="col-span-4 text-xs font-medium text-slate-500">Ancho (m)</span>
            <span className="col-span-4 text-xs font-medium text-slate-500">Alto (m)</span>
            <span className="col-span-2 text-xs font-medium text-slate-500">Cant.</span>
            <span className="col-span-1" />
          </div>

          {filas.map((fila, idx) => (
            <div key={fila.id} className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-1 text-sm text-slate-400 text-center">{idx + 1}</span>
              <input type="text" placeholder="ej. 0.90" value={fila.ancho}
                onChange={e => actualizarFila(fila.id, 'ancho', e.target.value)}
                className="col-span-4 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="text" placeholder="ej. 2.10" value={fila.alto}
                onChange={e => actualizarFila(fila.id, 'alto', e.target.value)}
                className="col-span-4 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <input type="number" min="1" value={fila.cantidad}
                onChange={e => actualizarFila(fila.id, 'cantidad', e.target.value)}
                className="col-span-2 border border-slate-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={() => eliminarFila(fila.id)} disabled={filas.length === 1}
                className="col-span-1 flex items-center justify-center h-9 w-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                ×
              </button>
            </div>
          ))}
        </div>

        <button onClick={agregarFila}
          className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
          <span className="text-lg leading-none">+</span> Agregar pieza
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {opSeleccionada && <span>Material: <strong className="text-slate-700">{opSeleccionada.label}</strong></span>}
        </div>
        <button onClick={calcular} disabled={calculando}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-6 py-2.5 rounded-xl shadow transition-colors">
          {calculando ? 'Calculando...' : 'Calcular Optimización'}
        </button>
      </div>
    </div>
  )
}
