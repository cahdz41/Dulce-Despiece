import type { Material, Superficie, TipoFraccion } from '../types'

export function generarSuperficies(material: Material): Superficie[] {
  const { id, anchoHoja: w, altoHoja: h, permiteMedia, permiteCuarto } = material
  const sups: Superficie[] = []

  const add = (tipo: TipoFraccion, ancho: number, alto: number, label: string) =>
    sups.push({ materialId: id, tipo, ancho, alto, label })

  add('completa', w, h, `Hoja completa ${w}×${h}`)

  if (permiteMedia) {
    add('media_h', w, h / 2, `Media horiz. ${w}×${+(h / 2).toFixed(3)}`)
    add('media_v', w / 2, h, `Media vert. ${+(w / 2).toFixed(3)}×${h}`)
  }

  if (permiteCuarto) {
    add('cuarto', w / 2, h / 2, `Cuarto ${+(w / 2).toFixed(3)}×${+(h / 2).toFixed(3)}`)
  }

  return sups
}

export function stockPorFraccion(material: Material, tipo: TipoFraccion): number {
  switch (tipo) {
    case 'completa': return material.stock
    case 'media_h':
    case 'media_v':  return material.stock * 2   // cada hoja da 2 medias
    case 'cuarto':   return material.stock * 4   // cada hoja da 4 cuartos
  }
}
