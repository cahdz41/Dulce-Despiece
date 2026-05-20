import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { generarEtiquetasPDF, type Etiqueta } from '../../utils/etiquetasPdf'

export default function EtiquetasPage() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generando, setGenerando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function parsearExcel(buffer: ArrayBuffer): Etiqueta[] {
    const wb = XLSX.read(buffer, { type: 'array' })

    // Buscar la primera hoja que tenga datos en columna A
    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })

      const resultado: Etiqueta[] = []
      for (const row of rows) {
        const clave = String(row[0] ?? '').trim()
        const descripcion = String(row[1] ?? '').trim()
        if (clave) {
          resultado.push({ clave, descripcion })
        }
      }

      if (resultado.length > 0) return resultado
    }

    return []
  }

  function handleArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = parsearExcel(ev.target!.result as ArrayBuffer)
        if (data.length === 0) {
          setError('No se encontraron filas con clave en la columna A.')
          setEtiquetas([])
          setFileName(null)
        } else {
          setEtiquetas(data)
          setFileName(file.name)
        }
      } catch {
        setError('No se pudo leer el archivo. Verifica que sea un Excel válido.')
      }
    }
    reader.readAsArrayBuffer(file)

    // Limpiar input para permitir subir el mismo archivo de nuevo
    e.target.value = ''
  }

  function handleGenerar() {
    if (!etiquetas.length) return
    setGenerando(true)
    // Pequeño delay para que el estado "Generando..." se muestre antes del PDF
    setTimeout(() => {
      generarEtiquetasPDF(etiquetas)
      setGenerando(false)
    }, 50)
  }

  const totalPaginas = Math.ceil(etiquetas.length / 18)

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Encabezado */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Generar Etiquetas</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Sube el Excel con claves y descripciones para generar un PDF listo para imprimir y recortar.
        </p>
      </div>

      {/* Zona de carga */}
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group"
      >
        <div className="w-14 h-14 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
          <svg className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12-3-3m0 0-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
            {fileName ?? 'Haz clic para seleccionar el Excel'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Columna A: Clave · Columna B: Descripción · Solo filas con clave
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleArchivo}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Resumen y botón */}
      {etiquetas.length > 0 && (
        <>
          {/* Métricas */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{etiquetas.length}</p>
              <p className="text-xs text-blue-500 mt-0.5 font-medium">Etiquetas</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-slate-700">{totalPaginas}</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Hojas a imprimir</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-slate-700">18</p>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Etiquetas por hoja</p>
            </div>
          </div>

          {/* Botón generar */}
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
                Descargar PDF ({etiquetas.length} etiquetas · {totalPaginas} {totalPaginas === 1 ? 'hoja' : 'hojas'})
              </>
            )}
          </button>

          {/* Vista previa de etiquetas */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Vista previa — {etiquetas.length} etiquetas encontradas
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {etiquetas.map((e, i) => (
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
