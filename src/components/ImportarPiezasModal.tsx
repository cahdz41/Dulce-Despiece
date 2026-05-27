import { useRef, useState } from 'react'
import { parsearPiezasDespiece } from '../utils/excelImport'
import type { PiezaImportada } from '../utils/excelImport'

interface Props {
  onAplicar: (piezas: PiezaImportada[]) => void
  onCerrar:  () => void
}

type Unidad = 'cm' | 'm'
type Estado = 'esperando' | 'cargando' | 'preview' | 'error'

export default function ImportarPiezasModal({ onAplicar, onCerrar }: Props) {
  const inputRef                          = useRef<HTMLInputElement>(null)
  const [unidad, setUnidad]               = useState<Unidad>('cm')
  const [estado, setEstado]               = useState<Estado>('esperando')
  const [piezas, setPiezas]               = useState<PiezaImportada[]>([])
  const [errores, setErrores]             = useState<string[]>([])
  const [nombreArchivo, setNombreArchivo] = useState('')
  const [dragging, setDragging]           = useState(false)

  async function procesarArchivo(file: File) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setEstado('error')
      setErrores(['El archivo debe ser .xlsx o .xls'])
      return
    }

    setEstado('cargando')
    setNombreArchivo(file.name)

    try {
      const buffer    = await file.arrayBuffer()
      const resultado = parsearPiezasDespiece(buffer, unidad)

      if (resultado.piezas.length === 0) {
        setEstado('error')
        setErrores(['No se encontraron piezas válidas en el archivo.', ...resultado.errores])
        return
      }

      setPiezas(resultado.piezas)
      setErrores(resultado.errores)
      setEstado('preview')
    } catch {
      setEstado('error')
      setErrores(['Error al leer el archivo. Verifica que sea un Excel válido.'])
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) procesarArchivo(file)
  }

  function resetear() {
    setEstado('esperando')
    setPiezas([])
    setErrores([])
    setNombreArchivo('')
  }

  const totalPiezas = piezas.reduce((s, p) => s + p.cantidad, 0)

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-700" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 16l-1.5-2.5L5.5 16H4l2.25-3.5L4 9h1.5l1.5 2.5L8.5 9H10L7.75 12.5 10 16H8.5zm4.5 0h-1.25l-1-5.5h1.25l.5 3.5.5-3.5H14l-1 5.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">Importar piezas desde Excel</h2>
              <p className="text-xs text-slate-500">Col A: cantidad · Col B: ancho · Col C: alto</p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Selector de unidades */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 font-medium">Unidad de medida en el archivo:</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              {(['cm', 'm'] as Unidad[]).map(u => (
                <button
                  key={u}
                  onClick={() => { setUnidad(u); resetear() }}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    unidad === u
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {u === 'cm' ? 'Centímetros' : 'Metros'}
                </button>
              ))}
            </div>
          </div>

          {/* Zona de drop / estado */}
          {estado === 'esperando' || estado === 'error' ? (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                  ${dragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  }
                `}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={onFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                  <p className="text-sm font-medium text-slate-600">
                    {dragging ? 'Suelta el archivo aquí' : 'Arrastra tu Excel o haz clic para seleccionarlo'}
                  </p>
                  <p className="text-xs text-slate-400">.xlsx o .xls</p>
                </div>
              </div>

              {estado === 'error' && errores.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1">
                  {errores.map((e, i) => (
                    <p key={i} className="text-sm text-red-700">{e}</p>
                  ))}
                </div>
              )}
            </>
          ) : estado === 'cargando' ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <svg className="w-8 h-8 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <p className="text-sm text-slate-500">Leyendo {nombreArchivo}...</p>
            </div>
          ) : (
            /* Preview */
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {piezas.length} {piezas.length === 1 ? 'tipo de pieza' : 'tipos de pieza'} detectados
                    <span className="text-slate-400 font-normal ml-1">({totalPiezas} piezas en total)</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{nombreArchivo}</p>
                </div>
                <button
                  onClick={resetear}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Tabla preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
                  <span className="col-span-2 text-xs font-medium text-slate-500">Cant.</span>
                  <span className="col-span-5 text-xs font-medium text-slate-500">Ancho (m)</span>
                  <span className="col-span-5 text-xs font-medium text-slate-500">Alto (m)</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {piezas.map((p, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 items-center">
                      <span className="col-span-2 text-sm font-semibold text-blue-700">×{p.cantidad}</span>
                      <span className="col-span-5 text-sm text-slate-700">{p.ancho.toFixed(3)}</span>
                      <span className="col-span-5 text-sm text-slate-700">{p.alto.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advertencias menores */}
              {errores.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-1">
                  <p className="text-xs font-medium text-amber-700">Filas omitidas:</p>
                  {errores.map((e, i) => (
                    <p key={i} className="text-xs text-amber-600">{e}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con botones */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button
            onClick={onCerrar}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onAplicar(piezas)}
            disabled={estado !== 'preview'}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-lg transition-colors"
          >
            Agregar {estado === 'preview' ? `${totalPiezas} piezas` : 'piezas'}
          </button>
        </div>
      </div>
    </div>
  )
}
