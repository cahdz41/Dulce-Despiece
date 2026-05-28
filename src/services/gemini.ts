import imageCompression from 'browser-image-compression'

export interface PiezaExtraida {
  ancho: number
  alto: number
  cantidad: number
}

export interface ResultadoExtraccion {
  piezas: PiezaExtraida[]
  error?: string
}

function buildPrompt(unidad: 'm' | 'cm' | 'mm'): string {
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
      // Quitar el prefijo "data:image/...;base64,"
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(archivo)
  })
}

const FACTOR: Record<'m' | 'cm' | 'mm', number> = { m: 1, cm: 0.01, mm: 0.001 }

export async function extraerPiezasDeImagen(archivo: File, unidad: 'm' | 'cm' | 'mm'): Promise<ResultadoExtraccion> {
  const key = import.meta.env.VITE_GEMINI_API_KEY
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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: buildPrompt(unidad) },
              { inline_data: { mime_type: archivo.type || 'image/jpeg', data: base64 } },
            ],
          }],
          generationConfig: {
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    if (response.status === 401 || response.status === 403) {
      return { piezas: [], error: 'API key de Gemini inválida o sin permisos.' }
    }
    if (!response.ok) {
      return { piezas: [], error: `Error del servidor de Gemini (${response.status}).` }
    }

    const json = await response.json()
    const texto: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Limpiar posibles backticks de markdown que Gemini a veces agrega
    const limpio = texto.replace(/```json|```/g, '').trim()

    let arreglo: unknown
    try {
      arreglo = JSON.parse(limpio)
    } catch {
      return { piezas: [], error: 'Respuesta inesperada de Gemini.' }
    }

    if (!Array.isArray(arreglo)) {
      return { piezas: [], error: 'Respuesta inesperada de Gemini.' }
    }

    const factor = FACTOR[unidad]

    const piezas: PiezaExtraida[] = (arreglo as Record<string, unknown>[])
      .filter(p => typeof p.ancho === 'number' && p.ancho > 0 &&
                   typeof p.alto  === 'number' && p.alto  > 0)
      .map(p => ({
        ancho:    parseFloat(((p.ancho as number) * factor).toFixed(4)),
        alto:     parseFloat(((p.alto  as number) * factor).toFixed(4)),
        cantidad: typeof p.cantidad === 'number' && p.cantidad >= 1 ? Math.round(p.cantidad as number) : 1,
      }))

    if (piezas.length === 0) {
      return { piezas: [], error: 'No se detectaron piezas en la imagen.' }
    }

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
