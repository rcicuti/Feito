// Datas sempre no fuso local da pessoa, no formato YYYY-MM-DD.
export function hojeISO(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dia}`
}

export function amanhaISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return hojeISO(d)
}

export function idadeEmAnos(nascimentoISO: string): number {
  const n = new Date(nascimentoISO + 'T00:00:00')
  const h = new Date()
  let idade = h.getFullYear() - n.getFullYear()
  const fezAniversario =
    h.getMonth() > n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() >= n.getDate())
  if (!fezAniversario) idade--
  return idade
}

export const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const DIAS_NOMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export function saudacao(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function dataPorExtenso(): string {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function horaCurta(t: string | null): string | null {
  return t ? t.slice(0, 5) : null
}
