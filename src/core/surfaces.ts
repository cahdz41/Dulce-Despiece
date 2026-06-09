import type { Material, Superficie, TipoFraccion } from '../types'

export function generarSuperficies(material: Material): Superficie[] {
  const { id, anchoHoja: w, altoHoja: h, permiteMedia, permiteCuarto } = material
  const candidatos: Superficie[] = []

  const add = (tipo: TipoFraccion, ancho: number, alto: number, label: string) =>
    candidatos.push({ materialId: id, tipo, ancho, alto, label })

  // Hoja completa en ambas orientaciones
  add('completa', w, h, `Hoja completa ${w}×${h}`)
  add('completa', h, w, `Hoja completa ${h}×${w}`)

  if (permiteMedia) {
    add('media_h', w,     h / 2, `Media ${w}×${+(h / 2).toFixed(3)}`)
    add('media_h', h / 2, w,     `Media ${+(h / 2).toFixed(3)}×${w}`)
    add('media_v', w / 2, h,     `Media ${+(w / 2).toFixed(3)}×${h}`)
    add('media_v', h,     w / 2, `Media ${h}×${+(w / 2).toFixed(3)}`)
  }

  if (permiteCuarto) {
    add('cuarto', w / 2, h / 2, `Cuarto ${+(w / 2).toFixed(3)}×${+(h / 2).toFixed(3)}`)
    add('cuarto', h / 2, w / 2, `Cuarto ${+(h / 2).toFixed(3)}×${+(w / 2).toFixed(3)}`)
  }

  // Eliminar superficies duplicadas (mismo tipo y mismas dimensiones)
  const vistas = new Set<string>()
  return candidatos.filter(s => {
    const key = `${s.tipo}:${s.ancho.toFixed(4)}x${s.alto.toFixed(4)}`
    if (vistas.has(key)) return false
    vistas.add(key)
    return true
  })
}

export function stockPorFraccion(material: Material, tipo: TipoFraccion): number {
  switch (tipo) {
    case 'completa': return material.stock
    case 'media_h':
    case 'media_v':  return material.stock * 2   // cada hoja da 2 medias
    case 'cuarto':   return material.stock * 4   // cada hoja da 4 cuartos
  }
}
