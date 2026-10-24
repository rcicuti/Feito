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

export function somarDias(iso: string, n: number): string {
  const [a, m, d] = iso.split('-').map(Number)
  return hojeISO(new Date(a, m - 1, d + n))
}

// "830" -> "08:30" (só números; os dois pontos entram sozinhos)
export function mascaraHora(v: string): string {
  let n = v.replace(/\D/g, '')
  if (n.length > 0 && n[0] > '2') n = '0' + n // "8" vira "08"
  n = n.slice(0, 4)
  return n.length <= 2 ? n : `${n.slice(0, 2)}:${n.slice(2)}`
}

// Texto digitado -> 'HH:MM'; '' se estiver vazio; null se estiver incompleto ou inválido
export function horaParaISO(txt: string): string | null {
  if (!txt.trim()) return ''
  const m = /^(\d{2}):(\d{2})$/.exec(txt.trim())
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null
  return `${m[1]}:${m[2]}`
}

// "2026-10-29" -> "quinta, 29/10"
export function diaCurto(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  const dt = new Date(a, m - 1, d)
  return `${DIAS_NOMES[dt.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}
