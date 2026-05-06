# Avances del proyecto — Optimizador de Cortes de Vidrio

## 2026-05-06

### Resumen general
Aplicación web para cotización y optimización de corte de vidrio y espejos.
Stack: React + TypeScript + Vite + Tailwind CSS. Puro frontend, sin backend.

---

### Lo que se terminó hoy

#### 1. Exportación a PDF (`src/utils/pdfExport.ts`)
- Generación programática con jsPDF (sin html2canvas)
- Página 1: encabezado con banda oscura, datos de la cotización, tabla de piezas solicitadas, resumen de hojas a vender y 5 tarjetas de métricas
- Páginas adicionales: croquis de corte por hoja con piezas coloreadas, dimensiones y leyenda
- Pie de página con numeración en todas las páginas
- Nombre del archivo: `cotizacion_XXXX_cliente_FECHA.pdf`

#### 2. Flujo de cotización completo (`src/types/index.ts`, `src/components/OrderForm.tsx`)
- Nueva interfaz `Cotizacion` que agrupa resultado + metadata (cliente, fecha, número, material, piezas)
- `OrderForm` ahora recibe `numeroCotizacion` y emite un objeto `Cotizacion` completo
- Campo de nombre de cliente (opcional) en el formulario

#### 3. Botón "Descargar PDF" en la vista de resultados (`src/components/ResultView.tsx`)
- `ResultView` ahora acepta `Cotizacion` en lugar de solo `ResultadoOptimizacion`
- Muestra nombre de cliente y número de cotización en el encabezado
- Botón azul que llama directamente a `generarPDF(cotizacion)`

#### 4. Contador de cotizaciones (`src/App.tsx`)
- `App` mantiene `numeroCotizacion` que se incrementa en cada nuevo pedido
- Estado migrado de `ResultadoOptimizacion` a `Cotizacion`

#### 5. Medidas de sobrantes en el croquis (`src/components/CutDiagram.tsx`, `src/core/guillotine.ts`)
- El algoritmo guillotine ahora retorna los rectángulos sobrantes reales (`sobrantes: RectSobrante[]`)
- Se filtran rectángulos redundantes (dominados por uno más grande) para no mostrar duplicados
- Las medidas de cada sobrante aparecen:
  - Dentro del SVG, centradas sobre el área rayada
  - En la leyenda lateral, listados de mayor a menor área
- Útil para ofrecer sobrantes a clientes o como control interno

#### 6. Precisión de medidas — sin redondeo (`src/utils/format.ts`)
- Nueva función `fmt(v)`: muestra 2 decimales para medidas redondas (1.90 → "1.90") y 3 decimales cuando el tercero es significativo (1.895 → "1.895")
- Evita que un corte de 1.895 m se muestre como 1.90 m, error que puede causar una pieza que no entre al hueco del cliente
- Aplicada en etiquetas del SVG, leyenda de piezas y dimensiones de sobrantes

---

### Estructura de archivos del proyecto

```
src/
├── App.tsx                    — Shell principal, navegación, estado global
├── components/
│   ├── OrderForm.tsx          — Formulario de pedido (material + piezas)
│   ├── ResultView.tsx         — Vista de resultados + botón PDF
│   ├── CutDiagram.tsx         — Croquis SVG por hoja con sobrantes
│   └── ImportButton.tsx       — Importación de Excel diario
├── core/
│   ├── optimizer.ts           — Motor principal (7 fases)
│   ├── guillotine.ts          — Empaque 2D guillotine, devuelve sobrantes
│   └── surfaces.ts            — Generación de superficies por material
├── data/
│   └── inventory.ts           — Inventario estático demo
├── types/
│   └── index.ts               — Todas las interfaces TypeScript
└── utils/
    ├── excelImport.ts         — Parser del reporte Excel diario
    ├── pdfExport.ts           — Generador PDF con jsPDF
    └── format.ts              — Función fmt() para medidas sin redondeo
```

---

### Pendientes para próximas sesiones

- [ ] Probar el PDF generado con un pedido real e iterar el diseño si hace falta
- [ ] Historial de cotizaciones en localStorage
- [ ] Vista de inventario activo dentro de la app
- [ ] Deploy en VPS o servicio estático (Netlify / Vercel)
