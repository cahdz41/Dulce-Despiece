import { useEffect, useState } from 'react'
import { buscarProspectos } from '../../services/gemini'
import {
  suscribirProspectos,
  guardarProspectos,
  actualizarProspecto,
  eliminarProspecto,
} from '../../services/prospectosFirestore'
import type { Prospecto, EstatusProspecto, ProspectoInput } from '../../types/prospectos'
import type { ProspectoGemini } from '../../services/gemini'

type Tab = 'buscar' | 'guardados'

const RADIOS = ['5 km', '10 km', '20 km', '50 km', 'Toda la ciudad']

const ESTATUS_CONFIG: Record<EstatusProspecto, { label: string; color: string }> = {
  nuevo:      { label: 'Nuevo',      color: 'bg-blue-100 text-blue-800 border-blue-200' },
  contactado: { label: 'Contactado', color: 'bg-green-100 text-green-800 border-green-200' },
  descartado: { label: 'Descartado', color: 'bg-red-100 text-red-800 border-red-200' },
}

// ── Fila editable ─────────────────────────────────────────────────────────────

interface FilaProspectoProps {
  p: Prospecto
  onActualizar: (id: string, cambios: Partial<ProspectoInput>) => Promise<void>
  onEliminar:   (id: string) => Promise<void>
}

function FilaProspecto({ p, onActualizar, onEliminar }: FilaProspectoProps) {
  const [editando, setEditando]   = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    nombre:    p.nombre,
    giro:      p.giro      ?? '',
    telefono:  p.telefono  ?? '',
    direccion: p.direccion ?? '',
    ciudad:    p.ciudad    ?? '',
    notas:     p.notas     ?? '',
  })

  async function handleGuardar() {
    setGuardando(true)
    try {
      await onActualizar(p.id, {
        nombre:    form.nombre.trim(),
        giro:      form.giro.trim()      || null,
        telefono:  form.telefono.trim()  || null,
        direccion: form.direccion.trim() || null,
        ciudad:    form.ciudad.trim()    || null,
        notas:     form.notas.trim()     || null,
      })
      setEditando(false)
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar() {
    if (!confirm(`¿Eliminar a "${p.nombre}"?`)) return
    await onEliminar(p.id)
  }

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
          {p.giro && <p className="text-xs text-slate-500 mt-0.5">{p.giro}</p>}
        </td>
        <td className="px-4 py-3 text-sm text-slate-700">{p.telefono ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-slate-600 max-w-[200px] truncate">{p.direccion ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-slate-600">{p.ciudad ?? '—'}</td>
        <td className="px-4 py-3">
          <select
            value={p.estatus}
            onChange={e => onActualizar(p.id, { estatus: e.target.value as EstatusProspecto })}
            className={`text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer bg-transparent ${ESTATUS_CONFIG[p.estatus].color}`}
          >
            {(Object.keys(ESTATUS_CONFIG) as EstatusProspecto[]).map(k => (
              <option key={k} value={k}>{ESTATUS_CONFIG[k].label}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditando(v => !v)}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              {editando ? 'Cancelar' : 'Editar'}
            </button>
            <button
              onClick={handleEliminar}
              className="text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>

      {editando && (
        <tr className="bg-blue-50 border-b border-blue-100">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {([
                ['nombre',    'Nombre',    'text'],
                ['giro',      'Giro',      'text'],
                ['telefono',  'Teléfono',  'tel'],
                ['ciudad',    'Ciudad',    'text'],
                ['direccion', 'Dirección', 'text'],
                ['notas',     'Notas',     'text'],
              ] as [keyof typeof form, string, string][]).map(([campo, label, tipo]) => (
                <div key={campo} className={campo === 'direccion' || campo === 'notas' ? 'col-span-2 md:col-span-3' : ''}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    type={tipo}
                    value={form[campo]}
                    onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3">
              <button
                onClick={handleGuardar}
                disabled={guardando || !form.nombre.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ProspectosPage() {
  const [tab, setTab] = useState<Tab>('buscar')

  // ── Búsqueda
  const [ciudad, setCiudad]               = useState('')
  const [radio, setRadio]                 = useState('10 km')
  const [contexto, setContexto]           = useState('Alumineros y Vidrieros')
  const [cantidad, setCantidad]           = useState(15)
  const [buscando, setBuscando]           = useState(false)
  const [resultados, setResultados]       = useState<ProspectoGemini[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set())
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const [exportando, setExportando]       = useState(false)
  const [mensajeOk, setMensajeOk]         = useState('')

  // ── Guardados (tiempo real desde Firestore)
  const [guardados, setGuardados]         = useState<Prospecto[]>([])
  const [cargandoDB, setCargandoDB]       = useState(true)
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusProspecto | 'todos'>('todos')

  useEffect(() => {
    const unsub = suscribirProspectos(data => {
      setGuardados(data)
      setCargandoDB(false)
    })
    return unsub
  }, [])

  // ── Buscar prospectos con Gemini
  async function handleBuscar() {
    if (!ciudad.trim()) return
    setBuscando(true)
    setResultados([])
    setSeleccionados(new Set())
    setErrorBusqueda('')
    setMensajeOk('')

    const resultado = await buscarProspectos(ciudad.trim(), radio, contexto.trim() || 'Alumineros y Vidrieros', cantidad)
    setBuscando(false)

    if (resultado.error && resultado.prospectos.length === 0) {
      setErrorBusqueda(resultado.error)
    } else {
      setResultados(resultado.prospectos)
    }
  }

  // ── Selección
  function toggleSeleccion(idx: number) {
    setSeleccionados(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  function toggleTodos() {
    setSeleccionados(
      seleccionados.size === resultados.length
        ? new Set()
        : new Set(resultados.map((_, i) => i))
    )
  }

  // ── Exportar a Firestore
  async function handleExportar() {
    const aExportar = resultados.filter((_, i) => seleccionados.has(i))
    if (aExportar.length === 0) return
    setExportando(true)
    setMensajeOk('')
    setErrorBusqueda('')
    try {
      await guardarProspectos(aExportar.map(p => ({
        nombre:    p.nombre,
        giro:      p.giro      || null,
        telefono:  p.telefono === 'No disponible' ? null : p.telefono,
        direccion: p.direccion || null,
        ciudad:    p.ciudad    || null,
        notas:     null,
        estatus:   'nuevo' as EstatusProspecto,
      })))
      setMensajeOk(`${aExportar.length} prospecto${aExportar.length > 1 ? 's' : ''} guardado${aExportar.length > 1 ? 's' : ''} en Firebase.`)
      setSeleccionados(new Set())
    } catch (err) {
      setErrorBusqueda(err instanceof Error ? err.message : 'Error al guardar en Firebase.')
    } finally {
      setExportando(false)
    }
  }

  // ── CRUD guardados
  async function handleActualizar(id: string, cambios: Partial<ProspectoInput>) {
    await actualizarProspecto(id, cambios)
  }

  async function handleEliminar(id: string) {
    await eliminarProspecto(id)
  }

  const guardadosFiltrados = filtroEstatus === 'todos'
    ? guardados
    : guardados.filter(p => p.estatus === filtroEstatus)

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([['buscar', 'Buscar Prospectos'], ['guardados', 'Mis Prospectos']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
            {key === 'guardados' && guardados.length > 0 && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                {guardados.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: BUSCAR ─────────────────────────────────────────────────────── */}
      {tab === 'buscar' && (
        <div className="space-y-5">

          {/* Formulario */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Búsqueda de Prospectos</h2>
              <p className="text-xs text-slate-400 mt-0.5">Gemini 3.5 Flash + Google Search · hasta 15 prospectos por sesión</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Ciudad o entidad <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={e => setCiudad(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                  placeholder="Ej: Guadalajara, Jalisco"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Radio de búsqueda</label>
                <div className="flex flex-wrap gap-2">
                  {RADIOS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadio(r)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                        radio === r
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Contexto de búsqueda
                  <span className="text-slate-400 font-normal ml-1">(puedes refinarlo)</span>
                </label>
                <input
                  type="text"
                  value={contexto}
                  onChange={e => setContexto(e.target.value)}
                  placeholder="Ej: Alumineros y Vidrieros"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Número de prospectos
                  <span className="text-slate-400 font-normal ml-1">(1–15)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={15}
                    value={cantidad}
                    onChange={e => setCantidad(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className={`w-10 text-center text-sm font-bold rounded-lg px-2 py-1 ${
                    cantidad <= 3
                      ? 'bg-amber-100 text-amber-700'
                      : cantidad <= 10
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {cantidad}
                  </span>
                </div>
                {cantidad <= 3 && (
                  <p className="text-xs text-amber-600 mt-1">Modo prueba — consumo mínimo de tokens</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                onClick={handleBuscar}
                disabled={buscando || !ciudad.trim()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {buscando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    Buscar Prospectos
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Cargando */}
          {buscando && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-5 flex items-center gap-4">
              <div className="w-9 h-9 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Gemini está buscando prospectos...</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Consultando Google Search para "{contexto}" en {ciudad}. Puede tomar 15-30 segundos.
                </p>
              </div>
            </div>
          )}

          {errorBusqueda && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {errorBusqueda}
            </div>
          )}

          {mensajeOk && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <p className="text-sm text-green-700 font-medium">{mensajeOk}</p>
            </div>
          )}

          {/* Tabla de resultados */}
          {resultados.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {resultados.length} prospectos encontrados
                    <span className="text-slate-400 font-normal ml-1">en {ciudad}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {seleccionados.size > 0
                      ? `${seleccionados.size} seleccionado${seleccionados.size > 1 ? 's' : ''}`
                      : 'Selecciona los que quieras guardar en Firebase'}
                  </p>
                </div>
                <button
                  onClick={handleExportar}
                  disabled={seleccionados.size === 0 || exportando}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  {exportando
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                  }
                  {exportando ? 'Guardando...' : `Guardar en Firebase${seleccionados.size > 0 ? ` (${seleccionados.size})` : ''}`}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={seleccionados.size === resultados.length && resultados.length > 0}
                          onChange={toggleTodos}
                          className="accent-blue-600 w-4 h-4 cursor-pointer"
                        />
                      </th>
                      {['Nombre / Giro', 'Teléfono', 'Dirección', 'Ciudad'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((p, idx) => (
                      <tr
                        key={idx}
                        onClick={() => toggleSeleccion(idx)}
                        className={`border-b border-slate-100 cursor-pointer transition-colors ${
                          seleccionados.has(idx) ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={seleccionados.has(idx)}
                            onChange={() => toggleSeleccion(idx)}
                            onClick={e => e.stopPropagation()}
                            className="accent-blue-600 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800">{p.nombre}</p>
                          {p.giro && <p className="text-xs text-slate-500 mt-0.5">{p.giro}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${p.telefono === 'No disponible' ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                            {p.telefono}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 max-w-[220px]">{p.direccion || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.ciudad}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: MIS PROSPECTOS ─────────────────────────────────────────────── */}
      {tab === 'guardados' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
            {(['todos', 'nuevo', 'contactado', 'descartado'] as const).map(e => (
              <button
                key={e}
                onClick={() => setFiltroEstatus(e)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filtroEstatus === e
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {e === 'todos' ? 'Todos' : ESTATUS_CONFIG[e].label}
                <span className="ml-1.5 text-xs text-slate-400">
                  {e === 'todos' ? guardados.length : guardados.filter(p => p.estatus === e).length}
                </span>
              </button>
            ))}
          </div>

          {cargandoDB ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Cargando prospectos...</p>
            </div>
          ) : guardadosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-sm font-medium text-slate-500">No hay prospectos guardados</p>
              <p className="text-xs mt-1 text-slate-400">
                {filtroEstatus === 'todos'
                  ? 'Busca prospectos y expórtalos desde la pestaña "Buscar"'
                  : `No hay prospectos con estatus "${ESTATUS_CONFIG[filtroEstatus as EstatusProspecto].label}"`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['Nombre / Giro', 'Teléfono', 'Dirección', 'Ciudad', 'Estatus', 'Acciones'].map(h => (
                        <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {guardadosFiltrados.map(p => (
                      <FilaProspecto
                        key={p.id}
                        p={p}
                        onActualizar={handleActualizar}
                        onEliminar={handleEliminar}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
