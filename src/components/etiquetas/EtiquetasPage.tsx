import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { generarEtiquetasPDF, type Etiqueta } from '../../utils/etiquetasPdf'

interface EtiquetaRaw extends Etiqueta {
  colC: string
  colE: string
}

interface DatosExcel {
  etiquetas: EtiquetaRaw[]
  headerC: string
  headerE: string
}

function opcionesUnicas(etiquetas: EtiquetaRaw[], campo: 'colC' | 'colE'): string[] {
  return [...new Set(etiquetas.map(e => e[campo]).filter(Boolean))].sort()
}

export default function EtiquetasPage() {
  const [datos, setDatos] = useState<DatosExcel | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const [filtroC, setFiltroC] = useState('')
  const [filtroE, setFiltroE] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function parsearExcel(buffer: ArrayBuffer): DatosExcel | null {
    const wb = XLSX.read(buffer, { type: 'array' })

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })

      if (rows.length < 2) continue

      // Fila 0 = encabezados
      const header = rows[0]
      const headerC = String(header[2] ?? 'Filtro C').trim() || 'Filtro C'
      const headerE = String(header[4] ?? 'Filtro E').trim() || 'Filtro E'

      // Filas 1+ = datos
      const etiquetas: EtiquetaRaw[] = []
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const clave = String(row[0] ?? '').trim()
        const descripcion = String(row[1] ?? '').trim()
        const colC = String(row[2] ?? '').trim()
        const colE = String(row[4] ?? '').trim()
        if (clave) {
          etiquetas.push({ clave, descripcion, colC, colE })
        }
      }

      if (etiquetas.length > 0) return { etiquetas, headerC, headerE }
    }
    return null
  }

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setFiltroC('')
    setFiltroE('')

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const resultado = parsearExcel(ev.target!.result as ArrayBuffer)
        if (!resultado) {
          setError('No se encontraron filas con clave en la columna A.')
          setDatos(null)
          setFileName(null)
        } else {
          setDatos(resultado)
          setFileName(file.name)
        }
      } catch {
        setError('No se pudo leer el archivo. Verifica que sea un Excel válido.')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const opC = datos ? opcionesUnicas(datos.etiquetas, 'colC') : []

  // Aplicar filtros
  const etiquetasFiltradas: Etiqueta[] = datos
    ? datos.etiquetas
        .filter(e => e.colC === filtroC && e.colE === filtroE)
        .map(({ clave, descripcion }) => ({ clave, descripcion }))
    : []

  const ambosSeleccionados = filtroC !== '' && filtroE !== ''
  const totalPaginas = Math.ceil(etiquetasFiltradas.length / 18)

  function handleGenerar() {
    if (!etiquetasFiltradas.length) return
    setGenerando(true)
    setTimeout(() => {
      generarEtiquetasPDF(etiquetasFiltradas)
      setGenerando(false)
    }, 50)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Generar Etiquetas</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Sube el Excel, aplica los filtros y descarga el PDF listo para imprimir.
        </p>
      </div>

      {/* Zona de carga */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
            {fileName
              ? <span className="text-blue-700">{fileName} <span className="font-normal text-slate-400">(clic para cambiar)</span></span>
              : 'Haz clic para seleccionar el Excel'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Col A: Clave · Col B: Descripción · Col C: Filtro 1 · Col E: Filtro 2
          </p>
        </div>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleArchivo} className="hidden" />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Filtros (aparecen tras cargar el Excel) */}
      {datos && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filtros — selecciona ambos para generar el PDF</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Filtro columna C */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {datos.headerC}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <select
                value={filtroC}
                onChange={e => { setFiltroC(e.target.value); setFiltroE('') }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">— Selecciona —</option>
                {opC.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>

            {/* Filtro columna E — se activa tras escoger C */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                {datos.headerE}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <select
                value={filtroE}
                onChange={e => setFiltroE(e.target.value)}
                disabled={!filtroC}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">— Selecciona —</option>
                {/* Solo muestra valores de E que existen para el C seleccionado */}
                {filtroC && opcionesUnicas(
                  datos.etiquetas.filter(e => e.colC === filtroC),
                  'colE'
                ).map(op => <option key={op} value={op}>{op}</option>)}
              </select>
            </div>
          </div>

          {/* Resultado del filtro */}
          {ambosSeleccionados && (
            <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${
              etiquetasFiltradas.length > 0
                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              {etiquetasFiltradas.length > 0 ? (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  <span><strong>{etiquetasFiltradas.length}</strong> etiquetas encontradas · <strong>{totalPaginas}</strong> {totalPaginas === 1 ? 'hoja' : 'hojas'}</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                  </svg>
                  <span>No hay etiquetas para esta combinación de filtros</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botón generar */}
      {ambosSeleccionados && etiquetasFiltradas.length > 0 && (
        <>
          <button
            onClick={handleGenerar}
            disabled={generando}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            {generando ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Descargar PDF · {etiquetasFiltradas.length} etiquetas · {totalPaginas} {totalPaginas === 1 ? 'hoja' : 'hojas'}
              </>
            )}
          </button>

          {/* Vista previa */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Vista previa del resultado filtrado
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {etiquetasFiltradas.map((e, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-2.5 hover:bg-slate-50">
                    <span className="text-xs text-slate-400 w-6 text-right flex-shrink-0">{i + 1}</span>
                    <span className="font-bold text-slate-800 text-sm w-32 flex-shrink-0 truncate">{e.clave}</span>
                    <span className="text-slate-500 text-sm truncate">{e.descripcion}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info de layout */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Formato del PDF</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500">
          <span>Tamaño de hoja</span><span className="text-slate-700">A4 · 21 × 29.7 cm</span>
          <span>Distribución</span><span className="text-slate-700">2 columnas × 9 filas = 18 etiquetas</span>
          <span>Tamaño por etiqueta</span><span className="text-slate-700">~98 mm × ~32 mm</span>
          <span>Orientación</span><span className="text-slate-700">Vertical (Portrait)</span>
        </div>
      </div>
    </div>
  )
}
