import imageCompression from 'browser-image-compression'

const MODELO = 'gemini-3.5-flash'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent`

function apiKey(): string {
  return import.meta.env.VITE_GEMINI_API_KEY as string
}

// ── Extracción de piezas desde imagen ────────────────────────────────────────

export interface PiezaExtraida {
  ancho: number
  alto: number
  cantidad: number
}

export interface ResultadoExtraccion {
  piezas: PiezaExtraida[]
  error?: string
}

function buildPromptPiezas(unidad: 'm' | 'cm' | 'mm'): string {
  return `Analiza esta imagen. Contiene una lista de piezas de vidrio o espejo con medidas.
Las medidas en esta imagen están en ${unidad}. Extrae los números TAL COMO APARECEN, sin convertir.
Devuelve ÚNICAMENTE un arreglo JSON con este formato exacto:
[{"ancho": 90, "alto": 120, "cantidad": 2}, ...]

Reglas:
- Extrae los números de ancho y alto tal como aparecen en la imagen (no los conviertas).
- Si no hay cantidad explícita para una pieza, asume cantidad 1.
- Si no encuentras medidas de piezas, devuelve un arreglo vacío [].
- NO devuelvas explicación, solo el JSON.`
}

function leerComoBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(archivo)
  })
}

const FACTOR: Record<'m' | 'cm' | 'mm', number> = { m: 1, cm: 0.01, mm: 0.001 }

export async function extraerPiezasDeImagen(
  archivo: File,
  unidad: 'm' | 'cm' | 'mm'
): Promise<ResultadoExtraccion> {
  const key = apiKey()
  if (!key || key === 'TU_API_KEY_AQUI') {
    return { piezas: [], error: 'Falta configurar la API key de Gemini en el archivo .env' }
  }

  let base64: string
  try {
    const comprimido = await imageCompression(archivo, { maxSizeMB: 1, maxWidthOrHeight: 1600 })
    base64 = await leerComoBase64(comprimido)
  } catch {
    return { piezas: [], error: 'No se pudo procesar la imagen.' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)

  try {
    const response = await fetch(`${BASE_URL}?key=${key}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildPromptPiezas(unidad) },
            { inline_data: { mime_type: archivo.type || 'image/jpeg', data: base64 } },
          ],
        }],
        generationConfig: { thinkingConfig: { thinkingBudget: 0 } },
      }),
    })

    if (response.status === 401 || response.status === 403) {
      return { piezas: [], error: 'API key de Gemini inválida o sin permisos.' }
    }
    if (!response.ok) {
      return { piezas: [], error: `Error del servidor de Gemini (${response.status}).` }
    }

    const json = await response.json()
    const texto: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const limpio = texto.replace(/```json|```/g, '').trim()

    let arreglo: unknown
    try { arreglo = JSON.parse(limpio) } catch {
      return { piezas: [], error: 'Respuesta inesperada de Gemini.' }
    }

    if (!Array.isArray(arreglo)) {
      return { piezas: [], error: 'Respuesta inesperada de Gemini.' }
    }

    const factor = FACTOR[unidad]
    const piezas: PiezaExtraida[] = (arreglo as Record<string, unknown>[])
      .filter(p => typeof p.ancho === 'number' && p.ancho > 0 && typeof p.alto === 'number' && p.alto > 0)
      .map(p => ({
        ancho:    parseFloat(((p.ancho as number) * factor).toFixed(4)),
        alto:     parseFloat(((p.alto  as number) * factor).toFixed(4)),
        cantidad: typeof p.cantidad === 'number' && p.cantidad >= 1 ? Math.round(p.cantidad as number) : 1,
      }))

    if (piezas.length === 0) return { piezas: [], error: 'No se detectaron piezas en la imagen.' }
    return { piezas }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { piezas: [], error: 'La solicitud a Gemini tardó demasiado (timeout 60s).' }
    }
    return { piezas: [], error: 'Sin conexión a internet.' }
  } finally {
    clearTimeout(timeout)
  }
}

// ── Búsqueda de prospectos con Google Search Grounding ────────────────────────

export interface ProspectoGemini {
  nombre: string
  giro: string
  telefono: string
  direccion: string
  ciudad: string
}

export interface ResultadoBusqueda {
  prospectos: ProspectoGemini[]
  error?: string
}

export async function buscarProspectos(
  ciudad: string,
  radio: string,
  contexto: string,
  cantidad: number = 15
): Promise<ResultadoBusqueda> {
  const key = apiKey()
  if (!key || key === 'TU_API_KEY_AQUI') {
    return { prospectos: [], error: 'Falta configurar la API key de Gemini en el archivo .env' }
  }

  const prompt = `Usa Google Search para buscar negocios reales en Google Maps y directorios en línea.
Búsqueda: "${contexto}" en ${ciudad}, radio aproximado de ${radio}.

Encuentra exactamente ${cantidad} negocio${cantidad > 1 ? 's' : ''} o empresa${cantidad > 1 ? 's' : ''} que vendan o trabajen con vidrio, aluminio, espejos o materiales relacionados en esa zona geográfica.

Para cada negocio extrae:
- nombre: nombre completo del negocio
- giro: tipo de negocio o especialidad (ej: "Vidriería", "Aluminios y PVC", "Herrería y aluminio")
- telefono: número de teléfono real (si no está disponible escribe "No disponible")
- direccion: dirección completa o aproximada
- ciudad: ciudad o municipio donde se ubica

Responde ÚNICAMENTE con un array JSON válido sin texto adicional ni backticks:
[{"nombre":"...","giro":"...","telefono":"...","direccion":"...","ciudad":"..."}]`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 90_000)

  try {
    const response = await fetch(`${BASE_URL}?key=${key}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tools: [{ google_search: {} }],
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (response.status === 401 || response.status === 403) {
      return { prospectos: [], error: 'API key de Gemini inválida o sin permisos.' }
    }
    if (!response.ok) {
      const errBody = await response.text()
      return { prospectos: [], error: `Error de Gemini (${response.status}): ${errBody.slice(0, 200)}` }
    }

    const json = await response.json()
    const texto: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Extraer el array JSON incluso si viene con texto de grounding alrededor
    const match = texto.match(/\[[\s\S]*?\]/)
    if (!match) {
      return { prospectos: [], error: 'No se pudieron extraer prospectos. Intenta con otra ciudad o contexto.' }
    }

    let arreglo: unknown
    try { arreglo = JSON.parse(match[0]) } catch {
      return { prospectos: [], error: 'Respuesta inesperada de Gemini.' }
    }

    if (!Array.isArray(arreglo)) {
      return { prospectos: [], error: 'Respuesta inesperada de Gemini.' }
    }

    const prospectos: ProspectoGemini[] = (arreglo as Record<string, unknown>[])
      .filter(p => p.nombre && typeof p.nombre === 'string' && String(p.nombre).trim().length > 0)
      .slice(0, cantidad)
      .map(p => ({
        nombre:   String(p.nombre   ?? '').trim(),
        giro:     String(p.giro     ?? '').trim(),
        telefono: String(p.telefono ?? 'No disponible').trim(),
        direccion: String(p.direccion ?? '').trim(),
        ciudad:   String(p.ciudad   ?? ciudad).trim(),
      }))

    if (prospectos.length === 0) {
      return { prospectos: [], error: 'No se encontraron prospectos en esa zona. Prueba con otra ciudad.' }
    }

    return { prospectos }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { prospectos: [], error: 'La búsqueda tardó demasiado (timeout 90s).' }
    }
    return { prospectos: [], error: 'Sin conexión a internet.' }
  } finally {
    clearTimeout(timeout)
  }
}
