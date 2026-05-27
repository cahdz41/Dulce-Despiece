# Plan: Extracción de Piezas desde Imagen con Gemini Vision

## Objetivo

Agregar un botón "Adjuntar imagen" en la sección **Piezas solicitadas** del `OrderForm`.
Cuando el usuario sube una foto (WhatsApp, papel, Excel capturado, etc.), la app la manda a la
API de Gemini Vision, extrae las medidas automáticamente y las muestra en la tabla para que el
usuario las revise antes de hacer click en **Calcular Optimización**.

No se dispara ningún cálculo automáticamente. El flujo manual existente no cambia.

---

## Arquitectura del flujo

```
Usuario adjunta imagen
        │
        ▼
[OrderForm] → comprime imagen con browser-image-compression
        │
        ▼
[geminiService.ts] → convierte a base64 → llama API REST de Gemini Vision
        │
        ▼
Gemini responde JSON  [{ancho, alto, cantidad}, ...]
        │
        ▼
[OrderForm] muestra panel "Piezas detectadas" → usuario revisa / edita
        │
        ▼
Usuario hace click en "Calcular Optimización" (flujo normal)
```

---

## Archivos que se tocan

| Archivo | Acción |
|---|---|
| `glass-optimizer/.env` | Crear — almacena la API key de Gemini |
| `src/services/gemini.ts` | Crear — lógica de llamada a Gemini Vision |
| `src/components/OrderForm.tsx` | Modificar — botón de subida + panel de revisión |

Sin nuevas dependencias npm. Todo se resuelve con `fetch`, `FileReader`, y
`browser-image-compression` (ya instalado).

---

## Paso 1 — Variable de entorno

**Archivo:** `glass-optimizer/.env`

```
VITE_GEMINI_API_KEY=TU_API_KEY_AQUI
```

Vite expone automáticamente las variables `VITE_*` al navegador mediante `import.meta.env`.
Este archivo **no** debe comitearse; debe existir solo en la máquina local.

Si el proyecto alguna vez se vuelve público, se reemplaza esta llamada directa por un
Cloud Function de Firebase que actúa como proxy (la key queda en el servidor).

---

## Paso 2 — Servicio Gemini (`src/services/gemini.ts`)

### Responsabilidades
1. Recibir un objeto `File`
2. Comprimir la imagen (máx. 1 MB, máx. 1600 px) para no desperdiciar cuota
3. Convertirla a base64
4. Llamar al endpoint de Gemini con el prompt correcto
5. Parsear la respuesta y devolver un arreglo de `PiezaSolicitada`

### Endpoint a usar

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=KEY
```

`gemini-2.0-flash` es el modelo más rápido y económico con capacidad de visión.

### Prompt a enviar a Gemini

El prompt debe ser preciso sobre el formato de salida para evitar texto libre:

```
Analiza esta imagen. Contiene una lista de piezas de vidrio o espejo con medidas.
Extrae TODAS las piezas y devuelve ÚNICAMENTE un arreglo JSON con este formato exacto:
[{"ancho": 0.90, "alto": 1.20, "cantidad": 2}, ...]

Reglas importantes:
- Si las medidas están en centímetros (ej. 90 cm), conviértelas a metros (ej. 0.90).
- Si las medidas están en milímetros (ej. 900 mm), conviértelas a metros (ej. 0.90).
- Si las medidas ya están en metros (ej. 0.90 m), úsalas tal cual.
- Si no hay cantidad explícita para una pieza, asume cantidad 1.
- Si no encuentras medidas de piezas, devuelve un arreglo vacío [].
- NO devuelvas explicación, solo el JSON.
```

### Contrato de retorno

```typescript
export interface PiezaExtraida {
  ancho: number     // metros
  alto: number      // metros
  cantidad: number
}

export interface ResultadoExtraccion {
  piezas: PiezaExtraida[]
  error?: string    // mensaje legible si algo falló
}

export async function extraerPiezasDeImagen(archivo: File): Promise<ResultadoExtraccion>
```

### Lógica interna paso a paso

```
1. Comprimir con browser-image-compression { maxSizeMB: 1, maxWidthOrHeight: 1600 }
2. Leer como base64 con FileReader (readAsDataURL → quitar prefijo data:...;base64,)
3. Armar body JSON para Gemini:
   {
     contents: [{
       parts: [
         { text: PROMPT },
         { inline_data: { mime_type: "image/jpeg", data: BASE64 } }
       ]
     }]
   }
4. fetch POST al endpoint con la key en la URL
5. Extraer texto de response.candidates[0].content.parts[0].text
6. Limpiar posibles backticks de markdown (Gemini a veces los agrega)
7. JSON.parse → validar que sea un arreglo
8. Filtrar piezas con ancho > 0, alto > 0, cantidad >= 1
9. Devolver ResultadoExtraccion
```

### Manejo de errores

| Situación | Qué devuelve |
|---|---|
| Red caída | `{ piezas: [], error: 'Sin conexión a internet.' }` |
| Key inválida (401/403) | `{ piezas: [], error: 'API key de Gemini inválida.' }` |
| Gemini no encontró piezas | `{ piezas: [], error: 'No se detectaron piezas en la imagen.' }` |
| JSON malformado en respuesta | `{ piezas: [], error: 'Respuesta inesperada de Gemini.' }` |
| Imagen no reconocible | `{ piezas: [], error: 'No se detectaron piezas en la imagen.' }` |

---

## Paso 3 — Modificar `OrderForm.tsx`

### Nuevos estados a agregar

```typescript
const [imagenArchivo, setImagenArchivo]       = useState<File | null>(null)
const [imagenPreview, setImagenPreview]       = useState<string>('')     // URL.createObjectURL
const [analizando, setAnalizando]             = useState(false)
const [piezasExtraidas, setPiezasExtraidas]   = useState<PiezaExtraida[] | null>(null)
const [errorExtraccion, setErrorExtraccion]   = useState<string>('')
```

### Nueva función `handleImagenSeleccionada`

```
1. Recibir el File del input
2. Setear imagenArchivo y imagenPreview (URL.createObjectURL para thumbnail)
3. Limpiar piezasExtraidas y errorExtraccion previos
4. Llamar a extraerPiezasDeImagen(file) con setAnalizando(true/false)
5. Si result.error → mostrar en errorExtraccion
6. Si result.piezas.length === 0 → mostrar "No se detectaron piezas"
7. Si result.piezas.length > 0 → setPiezasExtraidas(result.piezas)
```

### Nueva función `aplicarPiezasExtraidas`

```
1. Convertir cada PiezaExtraida a FilaPieza (con id incremental)
2. Reemplazar setFilas con las nuevas filas
3. Limpiar piezasExtraidas y imagenArchivo / imagenPreview
```

### Estructura visual a agregar en el JSX

Insertar **antes** de la tabla de piezas, dentro del card "Piezas solicitadas":

```
┌─────────────────────────────────────────────────┐
│  Piezas solicitadas               Medidas en m  │
│                                                  │
│  [📷 Adjuntar imagen]  ← input file oculto      │
│                                                  │
│  ── Si hay imagenPreview: ──────────────────────│
│  [thumbnail 80x80]  análisis...  ✓ / ✗          │
│                                                  │
│  ── Si hay piezasExtraidas: ────────────────────│
│  ┌──────────────────────────────────────────┐   │
│  │ Piezas detectadas (3)    [✕ Descartar]  │   │
│  │  1. 0.90 × 1.20  ×2                    │   │
│  │  2. 0.45 × 0.60  ×1                    │   │
│  │  3. 1.00 × 2.10  ×3                    │   │
│  │              [✓ Aplicar estas piezas]  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ── Tabla manual (siempre visible) ─────────────│
│  #  Ancho   Alto   Cant.                         │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

**Puntos clave del diseño:**
- El botón "Adjuntar imagen" es un `<label>` que activa un `<input type="file" accept="image/*" className="hidden">`.
- El panel de piezas detectadas usa fondo amarillo suave (`bg-amber-50 border-amber-200`) para indicar "pendiente de confirmar".
- La tabla manual **siempre está visible** — el usuario puede mezclar: aplicar las extraídas y luego agregar más manualmente.
- Si el usuario hace click en "Aplicar estas piezas", el panel desaparece y las filas se poblan.
- El botón "Descartar" limpia el panel sin tocar la tabla.

### Estados visuales del botón "Adjuntar imagen"

| Estado | Texto | Estilo |
|---|---|---|
| Inicial | `📷 Adjuntar imagen` | Borde punteado slate |
| Analizando | `⏳ Analizando imagen...` | Deshabilitado, spinner |
| Error | `📷 Adjuntar imagen` + banner rojo abajo | Normal |
| Éxito | `📷 Cambiar imagen` | Normal |

---

## Paso 4 — Casos borde y validaciones

### Unidades ambiguas
El prompt ya instruye a Gemini a normalizar a metros. Sin embargo, después de recibir
el JSON se debe filtrar cualquier pieza donde `ancho > 10 || alto > 10`, que claramente
estaría en metros incorrectos o sería una pieza irreal. En ese caso mostrar advertencia:
"Algunas medidas parecen inusualmente grandes, revísalas."

### Imagen ilegible o de otro tema
Gemini devuelve `[]`. El servicio devuelve error "No se detectaron piezas". El usuario
ve el mensaje y puede seguir con la entrada manual.

### Múltiples imágenes
No se contempla en esta versión. El botón reemplaza la imagen anterior si se sube una nueva.

### Sin API key en `.env`
En `gemini.ts`, antes de hacer el fetch, verificar:
```typescript
const key = import.meta.env.VITE_GEMINI_API_KEY
if (!key) return { piezas: [], error: 'Falta configurar la API key de Gemini.' }
```

### Timeout
Agregar `AbortController` con timeout de 30 segundos para que el usuario no se quede
esperando indefinidamente si Gemini tarda.

---

## Paso 5 — Prueba manual antes de dar por terminado

Secuencia de pruebas a realizar en el navegador:

1. **Happy path**: subir la foto de ejemplo del cliente → verificar que las 3-5 piezas se
   extraen correctamente con sus medidas → aplicar → calcular optimización.

2. **Imagen en cm**: subir una imagen con medidas en cm → verificar que Gemini convierte
   a metros correctamente.

3. **Imagen ilegible**: subir una foto de algo que no sea piezas (ej. selfie) → verificar
   que aparece mensaje "No se detectaron piezas" y la tabla manual sigue funcionando.

4. **Sin conexión**: desactivar red en DevTools → subir imagen → verificar mensaje de error.

5. **Mezcla manual + imagen**: aplicar piezas de la imagen → agregar una fila manualmente →
   calcular → verificar que ambas piezas aparecen en el resultado.

6. **Flujo original intacto**: no subir imagen → llenar tabla manualmente → calcular →
   verificar que nada cambió en el comportamiento base.

---

## Consideraciones de seguridad

- La API key queda en el bundle de Vite (`import.meta.env.VITE_*`). Para uso **interno/local**
  esto es aceptable.
- Si la app se hace pública en internet, migrar la llamada a un Cloud Function de Firebase
  (el proyecto ya usa Firebase) que actúe como proxy. La key nunca sale del servidor.
- Agregar `.env` al `.gitignore` si aún no está.

---

## Orden de implementación recomendado

```
1. Crear .env con la API key
2. Crear src/services/gemini.ts
3. Probar gemini.ts aislado en consola del navegador (importar manualmente)
4. Modificar OrderForm.tsx — agregar estados y función handleImagenSeleccionada
5. Agregar UI del botón y panel de revisión en JSX
6. Conectar aplicarPiezasExtraidas con setFilas
7. Correr prueba manual completa (los 6 casos del Paso 5)
```

Tiempo estimado de implementación: **2-3 horas** de desarrollo enfocado.
