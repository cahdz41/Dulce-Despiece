import { useRef, useState } from 'react'
import { parsearExcel } from '../utils/excelImport'
import type { Material } from '../types'

interface Props {
  onImportado: (materiales: Material[], fecha: Date) => void
}

export default function ImportButton({ onImportado }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'ok' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')
  const [dragging, setDragging] = useState(false)

  async function procesarArchivo(file: File) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setEstado('error')
      setMensaje('El archivo debe ser .xlsx o .xls')
      return
    }

    setEstado('cargando')
    setMensaje('Leyendo archivo...')

    try {
      const buffer = await file.arrayBuffer()
      const resultado = parsearExcel(buffer)

      if (resultado.materiales.length === 0) {
        setEstado('error')
        setMensaje('No se encontraron productos de VIDRIO o ESPEJO en el archivo.')
        return
      }

      onImportado(resultado.materiales, new Date())
      setEstado('ok')
      setMensaje(
        `${resultado.materiales.length} productos importados correctamente.` +
        (resultado.errores.length > 0 ? ` (${resultado.errores.length} advertencias)` : '')
      )
    } catch {
      setEstado('error')
      setMensaje('Error al leer el archivo. Verifica que sea un Excel válido.')
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) procesarArchivo(file)
    // Limpiar input para permitir recargar el mismo archivo
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) procesarArchivo(file)
  }

  return (
    <div className="space-y-2">
      {/* Zona de drop */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
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
          {/* Ícono Excel */}
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-green-700" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 16l-1.5-2.5L5.5 16H4l2.25-3.5L4 9h1.5l1.5 2.5L8.5 9H10L7.75 12.5 10 16H8.5zm4.5 0h-1.25l-1-5.5h1.25l.5 3.5.5-3.5H14l-1 5.5z"/>
            </svg>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">
              {dragging ? 'Suelta el archivo aquí' : 'Importar inventario Excel'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Arrastra el archivo o haz clic para seleccionarlo (.xlsx)
            </p>
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {estado !== 'idle' && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
          estado === 'ok'      ? 'bg-green-50 text-green-700 border border-green-200' :
          estado === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {estado === 'cargando' && (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          )}
          {estado === 'ok' && (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
          {estado === 'error' && (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
          )}
          <span>{mensaje}</span>
        </div>
      )}
    </div>
  )
}
