/**
 * Formatea una medida en metros mostrando 2 decimales normalmente,
 * y 3 decimales cuando el tercero es significativo (ej. 1.895 → "1.895", 1.90 → "1.90").
 * Evita el redondeo visual que puede costar 5 mm en un corte real.
 */
export function fmt(v: number): string {
  const r = Math.round(v * 1000) / 1000
  return r.toFixed(3).endsWith('0') ? r.toFixed(2) : r.toFixed(3)
}
