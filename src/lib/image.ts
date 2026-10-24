// Reduz e comprime a foto no celular antes de enviar (economiza armazenamento).
// - lado maior de 1024 px (suficiente para o feed e para guardar a "prova")
// - formato WebP (cerca de 40% menor que JPEG na mesma qualidade); se o aparelho não souber gerar WebP, usa JPEG
// - ao recriar a imagem, os dados escondidos da foto (como a localização do GPS) não são enviados
export const LADO_MAX_FOTO = 1024
export const QUALIDADE_FOTO = 0.7

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), tipo, qualidade))
}

export async function comprimirImagem(arquivo: File, ladoMax = LADO_MAX_FOTO, qualidade = QUALIDADE_FOTO): Promise<Blob> {
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
  // aparelhos sem suporte a WebP devolvem outro formato (PNG, grande): nesse caso cai para JPEG
  const webp = await paraBlob(canvas, 'image/webp', qualidade)
  if (webp && webp.type === 'image/webp') return webp
  const jpeg = await paraBlob(canvas, 'image/jpeg', qualidade)
  if (!jpeg) throw new Error('Não foi possível comprimir a foto.')
  return jpeg
}

export function extensaoDaFoto(blob: Blob): 'webp' | 'jpg' {
  return blob.type === 'image/webp' ? 'webp' : 'jpg'
}
