import imageCompression from 'browser-image-compression'

const CLOUD_NAME = 'df01aih1r'
const UPLOAD_PRESET = 'facturas_dulce'
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export interface CloudinaryResult {
  url: string
  publicId: string
}

export async function subirFotoFactura(archivo: File): Promise<CloudinaryResult> {
  const comprimido = await imageCompression(archivo, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  })

  const formData = new FormData()
  formData.append('file', comprimido)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'facturas')

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Error al subir la foto a Cloudinary')

  const data = await res.json()
  return { url: data.secure_url, publicId: data.public_id }
}

export async function eliminarFotoFactura(publicId: string): Promise<void> {
  // La eliminación desde el cliente requiere firma (operación de servidor).
  // Por ahora se omite silenciosamente; las fotos de facturas canceladas
  // permanecen en Cloudinary pero no se muestran en la app.
  console.warn('Eliminación de foto no implementada para:', publicId)
}
