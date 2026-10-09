// Reduz e comprime a foto no celular antes de enviar (economiza armazenamento).
export async function comprimirImagem(arquivo: File, ladoMax = 1280, qualidade = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo)
  const escala = Math.min(1, ladoMax / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * escala)
  const h = Math.round(bitmap.height * escala)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não foi possível preparar a foto.')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível comprimir a foto.'))), 'image/jpeg', qualidade),
  )
}
