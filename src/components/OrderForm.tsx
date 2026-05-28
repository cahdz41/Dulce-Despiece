import { useRef, useMemo, useState } from 'react'
import { optimizar } from '../core/optimizer'
import type { Cotizacion, Material, PiezaSolicitada } from '../types'
import ImportarPiezasModal from './ImportarPiezasModal'
import type { PiezaImportada } from '../utils/excelImport'
import { extraerPiezasDeImagen } from '../services/gemini'
import type { PiezaExtraida } from '../services/gemini'

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
  initialData?: {
    clienteNombre: string
    materialKey: string
    piezas: PiezaSolicitada[]
  } | null
}

let nextId = 1

export default function OrderForm({ inventario, numeroCotizacion, onCotizacion, initialData }: Props) {
  const [clienteNombre, setClienteNombre] = useState(initialData?.clienteNombre ?? '')
  const [materialKey, setMaterialKey]     = useState(initialData?.materialKey ?? '')
  const [kerf, setKerf]                   = useState<string>('2')
  const [filas, setFilas]                 = useState<FilaPieza[]>(() => {
    if (initialData?.piezas && initialData.piezas.length > 0) {
      return initialData.piezas.map(p => ({
        id: nextId++,
        ancho: String(p.ancho),
        alto: String(p.alto),
        cantidad: String(p.cantidad),
      }))
    }
    return [{ id: nextId++, ancho: '', alto: '', cantidad: '1' }]
  })
  const [error, setError]             = useState<string>('')
  const [calculando, setCalculando]   = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const inputImagenRef                              = useRef<HTMLInputElement>(null)
  const [imagenPreview, setImagenPreview]           = useState<string>('')
  const [analizando, setAnalizando]                 = useState(false)
  const [piezasExtraidas, setPiezasExtraidas]       = useState<PiezaExtraida[] | null>(null)
  const [errorExtraccion, setErrorExtraccion]       = useState<string>('')
  const [advertenciaExtr, setAdvertenciaExtr]       = useState<string>('')
  const [unidadImagen, setUnidadImagen]             = useState<'m' | 'cm' | 'mm'>('cm')

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

  async function handleImagenSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    setImagenPreview(URL.createObjectURL(archivo))
    setPiezasExtraidas(null)
    setErrorExtraccion('')
    setAdvertenciaExtr('')
    setAnalizando(true)

    const resultado = await extraerPiezasDeImagen(archivo, unidadImagen)
    setAnalizando(false)

    if (resultado.error && resultado.piezas.length === 0) {
      setErrorExtraccion(resultado.error)
    } else if (resultado.piezas.length > 0) {
      setPiezasExtraidas(resultado.piezas)
      if (resultado.error) setAdvertenciaExtr(resultado.error)
    }

    // Limpiar el input para permitir subir la misma imagen de nuevo
    if (inputImagenRef.current) inputImagenRef.current.value = ''
  }

  function aplicarPiezasExtraidas() {
    if (!piezasExtraidas) return
    const nuevasFilas = piezasExtraidas.map(p => ({
      id:       nextId++,
      ancho:    String(p.ancho),
      alto:     String(p.alto),
      cantidad: String(p.cantidad),
    }))
    setFilas(f => {
      const soloVacia = f.length === 1 && f[0].ancho === '' && f[0].alto === ''
      return soloVacia ? nuevasFilas : [...f, ...nuevasFilas]
    })
    setPiezasExtraidas(null)
    setImagenPreview('')
    setErrorExtraccion('')
    setAdvertenciaExtr('')
  }

  function descartarExtraccion() {
    setPiezasExtraidas(null)
    setErrorExtraccion('')
    setAdvertenciaExtr('')
  }

  function aplicarPiezasImportadas(importadas: PiezaImportada[]) {
    const nuevasFilas = importadas.map(p => ({
      id:       nextId++,
      ancho:    String(p.ancho),
      alto:     String(p.alto),
      cantidad: String(p.cantidad),
    }))
    setFilas(f => {
      // Si la tabla solo tiene la fila vacía inicial, reemplazarla
      const soloVacia = f.length === 1 && f[0].ancho === '' && f[0].alto === ''
      return soloVacia ? nuevasFilas : [...f, ...nuevasFilas]
    })
    setShowImportModal(false)
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
            materialKey,
            materialGrupo: (opSeleccionada?.grupo ?? 'VIDRIO') as 'VIDRIO' | 'ESPEJO',
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
        <h2 className="text-xl font-semibold text-slate-800">
          {initialData ? 'Modificar Despiece' : 'Nuevo Pedido'}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {initialData
            ? 'Modifica las piezas y recalcula con el inventario actual.'
            : 'Ingresa el material y las medidas de las piezas solicitadas.'}
        </p>
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

        {/* Detección con IA */}
        <div className="mb-5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 p-px shadow-md">
          <div className="rounded-xl bg-white px-4 py-4">

            {/* Encabezado */}
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-violet-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.5 4.5H18l-3.75 2.7 1.5 4.5L12 11.1l-3.75 2.6 1.5-4.5L6 6.5h4.5L12 2z"/>
                <path d="M5 15l.75 2.25H8l-1.87 1.35.75 2.25L5 19.55l-1.88 1.3.75-2.25L2 17.25h2.25L5 15z" opacity=".6"/>
                <path d="M19 15l.75 2.25H22l-1.87 1.35.75 2.25L19 19.55l-1.88 1.3.75-2.25L16 17.25h2.25L19 15z" opacity=".6"/>
              </svg>
              <span className="font-semibold text-slate-800 text-sm">Detectar piezas con IA</span>
              <span className="ml-auto text-xs text-slate-400">Gemini Vision</span>
            </div>

            {/* Selector de unidades */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500 shrink-0">Medidas en la foto:</span>
              {(['cm', 'mm', 'm'] as const).map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnidadImagen(u)}
                  disabled={analizando}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    unidadImagen === u
                      ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* Botón principal */}
            <input
              ref={inputImagenRef}
              type="file"
              accept="image/*"
              className="hidden"
              id="input-imagen-gemini"
              onChange={handleImagenSeleccionada}
              disabled={analizando}
            />
            <label
              htmlFor="input-imagen-gemini"
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-semibold text-sm transition-all select-none ${
                analizando
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white cursor-pointer hover:from-violet-600 hover:to-indigo-600 shadow hover:shadow-md active:scale-[.98]'
              }`}
            >
              {analizando ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Analizando imagen...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l1.5 4.5H18l-3.75 2.7 1.5 4.5L12 11.1l-3.75 2.6 1.5-4.5L6 6.5h4.5L12 2z"/>
                  </svg>
                  {imagenPreview ? 'Cambiar imagen' : 'Detectar piezas con IA'}
                </>
              )}
            </label>

            {imagenPreview && !analizando && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={imagenPreview}
                  alt="preview"
                  className="h-10 w-10 object-cover rounded-lg border border-slate-200"
                />
                <span className="text-xs text-slate-400">Imagen cargada</span>
              </div>
            )}
          </div>
        </div>

        {/* Error de extracción */}
        {errorExtraccion && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700 flex items-center justify-between">
            <span>{errorExtraccion}</span>
            <button onClick={() => setErrorExtraccion('')} className="ml-2 text-red-400 hover:text-red-600 font-bold">×</button>
          </div>
        )}

        {/* Panel de piezas detectadas */}
        {piezasExtraidas && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-amber-800">
                Piezas detectadas ({piezasExtraidas.length})
              </span>
              <button
                onClick={descartarExtraccion}
                className="text-xs text-amber-600 hover:text-amber-800 font-medium"
              >
                ✕ Descartar
              </button>
            </div>
            {advertenciaExtr && (
              <p className="text-xs text-amber-700 mb-2 bg-amber-100 rounded px-2 py-1">{advertenciaExtr}</p>
            )}
            <ul className="space-y-1 mb-3">
              {piezasExtraidas.map((p, i) => (
                <li key={i} className="text-sm text-amber-900">
                  {i + 1}. {p.ancho} × {p.alto} m &nbsp;×{p.cantidad}
                </li>
              ))}
            </ul>
            <button
              onClick={aplicarPiezasExtraidas}
              className="w-full text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-1.5 transition-colors"
            >
              ✓ Aplicar estas piezas
            </button>
          </div>
        )}


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

        <div className="mt-3 flex items-center gap-4">
          <button onClick={agregarFila}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <span className="text-lg leading-none">+</span> Agregar pieza
          </button>
          <button onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 font-medium border border-green-300 hover:border-green-400 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 16l-1.5-2.5L5.5 16H4l2.25-3.5L4 9h1.5l1.5 2.5L8.5 9H10L7.75 12.5 10 16H8.5zm4.5 0h-1.25l-1-5.5h1.25l.5 3.5.5-3.5H14l-1 5.5z"/>
            </svg>
            Importar desde Excel
          </button>
        </div>
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

      {showImportModal && (
        <ImportarPiezasModal
          onAplicar={aplicarPiezasImportadas}
          onCerrar={() => setShowImportModal(false)}
        />
      )}
    </div>
  )
}
