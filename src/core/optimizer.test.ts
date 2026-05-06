/**
 * Caso canónico (plan sección 6.4) + verificación de solución óptima real.
 *
 * El plan trazó manualmente la combinación H2-F+H1-F → 5.07 m² de desperdicio.
 * El algoritmo completo también evalúa fracciones cruzadas y encuentra la
 * solución real óptima: 1×media_h(2.60×1.50) + 1×hoja(2.60×3.60) → 2.99 m²
 *
 * Pedido: 1A(0.90×2.10) + 3B(1.33×2.10) — Cristal Claro 6mm
 * Área total de piezas: 10.269 m²
 */

import { optimizar } from './optimizer'
import type { Material, PiezaSolicitada, SolucionMono, SolucionCombinada } from '../types'

const materiales: Material[] = [
  {
    id: 'CC6-180', descripcion: 'Cristal Claro 6mm 1.80×2.60',
    grupo: 'VIDRIO', subclasif: 'Claro 6mm', color: 'Claro',
    anchoHoja: 1.80, altoHoja: 2.60, grosorMm: 6,
    stock: 112.5, permiteMedia: true, permiteCuarto: false,
  },
  {
    id: 'CC6-230', descripcion: 'Cristal Claro 6mm 2.30×2.60',
    grupo: 'VIDRIO', subclasif: 'Claro 6mm', color: 'Claro',
    anchoHoja: 2.30, altoHoja: 2.60, grosorMm: 6,
    stock: 40.5, permiteMedia: true, permiteCuarto: false,
  },
  {
    id: 'CC6-260x300', descripcion: 'Cristal Claro 6mm 2.60×3.00',
    grupo: 'VIDRIO', subclasif: 'Claro 6mm', color: 'Claro',
    anchoHoja: 2.60, altoHoja: 3.00, grosorMm: 6,
    stock: 37.5, permiteMedia: true, permiteCuarto: false,
  },
  {
    id: 'CC6-260x360', descripcion: 'Cristal Claro 6mm 2.60×3.60',
    grupo: 'VIDRIO', subclasif: 'Claro 6mm', color: 'Claro',
    anchoHoja: 2.60, altoHoja: 3.60, grosorMm: 6,
    stock: 76.5, permiteMedia: true, permiteCuarto: true,
  },
]

const piezas: PiezaSolicitada[] = [
  { ancho: 0.90, alto: 2.10, cantidad: 1 },
  { ancho: 1.33, alto: 2.10, cantidad: 3 },
]

let pasaron = 0
let fallaron = 0

function check(nombre: string, condicion: boolean) {
  if (condicion) {
    console.log(`  ✅ ${nombre}`)
    pasaron++
  } else {
    console.log(`  ❌ ${nombre}`)
    fallaron++
  }
}

console.log('\n══════════════════════════════════════════════════')
console.log('  TESTS DEL ALGORITMO DE OPTIMIZACIÓN')
console.log('══════════════════════════════════════════════════\n')

// ── Test 1: área de piezas correcta ──────────────────────────────────────────
const resultado = optimizar(piezas, materiales)
console.log('Test 1 — Cálculo de área de piezas')
check('Área total = 10.269 m²', Math.abs(resultado.areaPiezas - 10.269) < 0.001)

// ── Test 2: solución combinada encontrada ─────────────────────────────────────
console.log('\nTest 2 — Tipo de solución')
check('El optimizador encuentra solución combinada', resultado.tipo === 'combinada')

// ── Test 3: desperdicio de la solución óptima ─────────────────────────────────
console.log('\nTest 3 — Desperdicio de la solución óptima')
if (resultado.tipo === 'combinada') {
  const c = resultado.optima as SolucionCombinada
  check('Desperdicio < 5.07 m² (supera al plan)', c.desperdicioTotal < 5.07)
  check('Desperdicio < 3.10 m² (óptimo real)',    c.desperdicioTotal < 3.10)
  check('Eficiencia > 75%',                        c.eficienciaPct > 75)
  console.log(`  → Desperdicio encontrado: ${c.desperdicioTotal.toFixed(3)} m²`)
  console.log(`  → Eficiencia encontrada:  ${c.eficienciaPct.toFixed(1)}%`)
  console.log(`  → Superficie A: ${c.solA.superficie.label} (${c.solA.nUnidades} ud)`)
  console.log(`  → Superficie B: ${c.solB.superficie.label} (${c.solB.nUnidades} ud)`)
}

// ── Test 4: alternativas mono-hoja presentes ──────────────────────────────────
console.log('\nTest 4 — Alternativas mono-hoja')
check('Hay al menos 3 alternativas', resultado.alternativas.length >= 3)
check('Mejor mono ≤ 8 m² de desperdicio', resultado.alternativas[0]?.desperdicioM2 <= 8)

// ── Test 5: validación de pieza que no cabe ───────────────────────────────────
console.log('\nTest 5 — Pieza imposible (3m × 4m)')
const resPiezaGrande = optimizar([{ ancho: 3.0, alto: 4.0, cantidad: 1 }], materiales)
check('Devuelve error por pieza demasiado grande', !!resPiezaGrande.error)

// ── Test 6: sin piezas ────────────────────────────────────────────────────────
console.log('\nTest 6 — Pedido vacío')
const resSinPiezas = optimizar([], materiales)
check('Devuelve error por pedido vacío', !!resSinPiezas.error)

// ── Resumen ───────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════')
console.log(`  RESULTADO: ${pasaron} pasaron | ${fallaron} fallaron`)

console.log('\n─── Alternativas mono-hoja ───')
resultado.alternativas.forEach((a, i) => {
  console.log(`  ${i + 1}. ${a.superficie.label.padEnd(28)} | ${a.nUnidades} uds | ${a.desperdicioM2.toFixed(3)} m² | ${a.eficienciaPct.toFixed(1)}%`)
})
console.log('══════════════════════════════════════════════════\n')

process.exit(fallaron > 0 ? 1 : 0)
