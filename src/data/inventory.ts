import type { Material } from '../types'

/**
 * Inventario estático de referencia (demo).
 * En uso diario se reemplaza al importar el Excel.
 * Colores y subclasif alineados con lo que produce el parser del Excel.
 */
export const INVENTARIO_BASE: Material[] = [
  // ── CRISTAL CLARO ─────────────────────────────────────────────────────────
  { id:'CC3-180',      descripcion:'Cristal Claro 3mm 1.80×2.60',   grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:1.80, altoHoja:2.60, grosorMm:3,  stock:50,    permiteMedia:true,  permiteCuarto:false },
  { id:'CC4-180',      descripcion:'Cristal Claro 4mm 1.80×2.60',   grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:1.80, altoHoja:2.60, grosorMm:4,  stock:60,    permiteMedia:true,  permiteCuarto:false },
  { id:'CC6-180',      descripcion:'Cristal Claro 6mm 1.80×2.60',   grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:1.80, altoHoja:2.60, grosorMm:6,  stock:112.5, permiteMedia:true,  permiteCuarto:false },
  { id:'CC6-230',      descripcion:'Cristal Claro 6mm 2.30×2.60',   grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:2.30, altoHoja:2.60, grosorMm:6,  stock:40.5,  permiteMedia:true,  permiteCuarto:false },
  { id:'CC6-260x300',  descripcion:'Cristal Claro 6mm 2.60×3.00',   grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:2.60, altoHoja:3.00, grosorMm:6,  stock:37.5,  permiteMedia:true,  permiteCuarto:false },
  { id:'CC6-260x360',  descripcion:'Cristal Claro 6mm 2.60×3.60',   grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:76.5,  permiteMedia:true,  permiteCuarto:true  },
  { id:'CC9-260x360',  descripcion:'Cristal Claro 9mm 2.60×3.60',   grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:2.60, altoHoja:3.60, grosorMm:9,  stock:20,    permiteMedia:true,  permiteCuarto:true  },
  { id:'CC12-260x360', descripcion:'Cristal Claro 12mm 2.60×3.60',  grupo:'VIDRIO', subclasif:'Claro',           color:'Claro',      anchoHoja:2.60, altoHoja:3.60, grosorMm:12, stock:15,    permiteMedia:true,  permiteCuarto:true  },
  // ── FILTRASOL ─────────────────────────────────────────────────────────────
  { id:'FS3-180',      descripcion:'Filtrasol 3mm 1.80×2.60',       grupo:'VIDRIO', subclasif:'Filtrasol',       color:'Filtrasol',  anchoHoja:1.80, altoHoja:2.60, grosorMm:3,  stock:50,    permiteMedia:true,  permiteCuarto:false },
  { id:'FS6-180',      descripcion:'Filtrasol 6mm 1.80×2.60',       grupo:'VIDRIO', subclasif:'Filtrasol',       color:'Filtrasol',  anchoHoja:1.80, altoHoja:2.60, grosorMm:6,  stock:62.65, permiteMedia:true,  permiteCuarto:false },
  { id:'FS6-230',      descripcion:'Filtrasol 6mm 2.30×2.60',       grupo:'VIDRIO', subclasif:'Filtrasol',       color:'Filtrasol',  anchoHoja:2.30, altoHoja:2.60, grosorMm:6,  stock:22.5,  permiteMedia:true,  permiteCuarto:false },
  { id:'FS6-260x300',  descripcion:'Filtrasol 6mm 2.60×3.00',       grupo:'VIDRIO', subclasif:'Filtrasol',       color:'Filtrasol',  anchoHoja:2.60, altoHoja:3.00, grosorMm:6,  stock:14,    permiteMedia:true,  permiteCuarto:false },
  { id:'FS6-260x360',  descripcion:'Filtrasol 6mm 2.60×3.60',       grupo:'VIDRIO', subclasif:'Filtrasol',       color:'Filtrasol',  anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:22,    permiteMedia:true,  permiteCuarto:true  },
  { id:'FS9-260x360',  descripcion:'Filtrasol 9mm 2.60×3.60',       grupo:'VIDRIO', subclasif:'Filtrasol',       color:'Filtrasol',  anchoHoja:2.60, altoHoja:3.60, grosorMm:9,  stock:18,    permiteMedia:true,  permiteCuarto:true  },
  // ── TINTEX ────────────────────────────────────────────────────────────────
  { id:'TX6-180',      descripcion:'Tintex 6mm 1.80×2.60',          grupo:'VIDRIO', subclasif:'Tintex',          color:'Tintex',     anchoHoja:1.80, altoHoja:2.60, grosorMm:6,  stock:18.5,  permiteMedia:true,  permiteCuarto:false },
  { id:'TX6-230',      descripcion:'Tintex 6mm 2.30×2.60',          grupo:'VIDRIO', subclasif:'Tintex',          color:'Tintex',     anchoHoja:2.30, altoHoja:2.60, grosorMm:6,  stock:31,    permiteMedia:true,  permiteCuarto:false },
  { id:'TX6-260x360',  descripcion:'Tintex 6mm 2.60×3.60',          grupo:'VIDRIO', subclasif:'Tintex',          color:'Tintex',     anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:6.25,  permiteMedia:true,  permiteCuarto:true  },
  { id:'TX9-260x360',  descripcion:'Tintex 9mm 2.60×3.60',          grupo:'VIDRIO', subclasif:'Tintex',          color:'Tintex',     anchoHoja:2.60, altoHoja:3.60, grosorMm:9,  stock:9,     permiteMedia:true,  permiteCuarto:true  },
  // ── SATINADO (PAVIA) ──────────────────────────────────────────────────────
  { id:'SAT3-180',     descripcion:'Satinado 3mm 1.80×2.60',        grupo:'VIDRIO', subclasif:'Satinado',        color:'Satinado',   anchoHoja:1.80, altoHoja:2.60, grosorMm:3,  stock:40.5,  permiteMedia:true,  permiteCuarto:false },
  { id:'SAT6-260x360', descripcion:'Satinado 6mm 2.60×3.60',        grupo:'VIDRIO', subclasif:'Satinado',        color:'Satinado',   anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:6,     permiteMedia:true,  permiteCuarto:true  },
  // ── VITROSOL ──────────────────────────────────────────────────────────────
  { id:'VS6-260x360',  descripcion:'Vitrosol 6mm 2.60×3.60',        grupo:'VIDRIO', subclasif:'Vitrosol',        color:'Vitrosol',   anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:8.5,   permiteMedia:true,  permiteCuarto:true  },
  { id:'VS9-260x360',  descripcion:'Vitrosol 9mm 2.60×3.60',        grupo:'VIDRIO', subclasif:'Vitrosol',        color:'Vitrosol',   anchoHoja:2.60, altoHoja:3.60, grosorMm:9,  stock:9,     permiteMedia:true,  permiteCuarto:true  },
  // ── REFLECTA ──────────────────────────────────────────────────────────────
  { id:'RB3.6',        descripcion:'Reflecta Bronce 6mm 3.60×2.50', grupo:'VIDRIO', subclasif:'Reflecta Bronce', color:'Reflecta',   anchoHoja:3.60, altoHoja:2.50, grosorMm:6,  stock:13.25, permiteMedia:true,  permiteCuarto:false },
  { id:'RP3.6',        descripcion:'Reflecta Plata 6mm 2.60×3.60',  grupo:'VIDRIO', subclasif:'Reflecta Plata',  color:'Reflecta',   anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:12,    permiteMedia:true,  permiteCuarto:true  },
  // ── CRISTAZUL / FILTRA PLUS ───────────────────────────────────────────────
  { id:'6MMA3.6',      descripcion:'Cristazul 6mm 2.60×3.60',       grupo:'VIDRIO', subclasif:'Cristazul',       color:'Azul',       anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:5.5,   permiteMedia:true,  permiteCuarto:true  },
  { id:'6MMFP3.6',     descripcion:'Filtra Plus 6mm 2.60×3.60',     grupo:'VIDRIO', subclasif:'Filtra Plus',     color:'Filtrasol',  anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:10.5,  permiteMedia:true,  permiteCuarto:true  },
  // ── ESPEJO ────────────────────────────────────────────────────────────────
  { id:'3MME1.8',      descripcion:'Espejo 3mm 1.80×2.60',          grupo:'ESPEJO', subclasif:'Espejo',          color:'Espejo',     anchoHoja:1.80, altoHoja:2.60, grosorMm:3,  stock:40,    permiteMedia:true,  permiteCuarto:false },
  { id:'4MME1.8',      descripcion:'Espejo 4mm 1.80×2.60',          grupo:'ESPEJO', subclasif:'Espejo',          color:'Espejo',     anchoHoja:1.80, altoHoja:2.60, grosorMm:4,  stock:11,    permiteMedia:true,  permiteCuarto:false },
  { id:'6MME1.8',      descripcion:'Espejo 6mm 1.80×2.60',          grupo:'ESPEJO', subclasif:'Espejo',          color:'Espejo',     anchoHoja:1.80, altoHoja:2.60, grosorMm:6,  stock:94,    permiteMedia:true,  permiteCuarto:false },
  { id:'6MME2.3',      descripcion:'Espejo 6mm 2.30×2.60',          grupo:'ESPEJO', subclasif:'Espejo',          color:'Espejo',     anchoHoja:2.30, altoHoja:2.60, grosorMm:6,  stock:15,    permiteMedia:true,  permiteCuarto:false },
  { id:'6MME3.6',      descripcion:'Espejo 6mm 2.60×3.60',          grupo:'ESPEJO', subclasif:'Espejo',          color:'Espejo',     anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:6.5,   permiteMedia:true,  permiteCuarto:true  },
  // ── ESPEJO FILTRASOL / VITROSOL ───────────────────────────────────────────
  { id:'6MMEF3.6',     descripcion:'Espejo Filtrasol 6mm 2.60×3.60',grupo:'ESPEJO', subclasif:'Espejo Filtrasol',color:'Espejo',     anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:12.5,  permiteMedia:true,  permiteCuarto:true  },
  { id:'6MMEV3.6',     descripcion:'Espejo Vitrosol 6mm 2.60×3.60', grupo:'ESPEJO', subclasif:'Espejo Vitrosol', color:'Espejo',     anchoHoja:2.60, altoHoja:3.60, grosorMm:6,  stock:14,    permiteMedia:true,  permiteCuarto:true  },
]

/** Devuelve todos los materiales que coinciden en subclasif + grosor + color */
export function getMaterialesPorTipo(
  subclasif: string,
  grosorMm: number,
  color: string
): Material[] {
  return INVENTARIO_BASE.filter(
    m => m.subclasif === subclasif && m.grosorMm === grosorMm && m.color === color && m.stock > 0
  )
}
