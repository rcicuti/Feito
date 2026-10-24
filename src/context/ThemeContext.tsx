import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'
export type Paleta = 'sol' | 'limao'

// As duas paletas do manual de marca. Cada uma tem modo claro e modo escuro.
export const PALETAS: Record<Paleta, { nome: string; descricao: string; cores: Record<Tema, string[]> }> = {
  sol: { nome: 'Sol + tinta', descricao: 'Quente e chamativa, estilo adesivo.', cores: { claro: ['#FFC400', '#17130A', '#FFF8E0'], escuro: ['#FFC400', '#2B2410', '#17130A'] } },
  limao: { nome: 'Noite + limão', descricao: 'Energia de jogo, o escuro de contraste máximo.', cores: { claro: ['#B8F200', '#14121F', '#F4F3FA'], escuro: ['#B8F200', '#231F36', '#14121F'] } },
}

// Cores do ícone da aba do navegador em cada tema (fundo e traço do check)
const ICONE: Record<Paleta, { fundo: string; traco: string }> = {
  sol: { fundo: '#FFC400', traco: '#17130A' },
  limao: { fundo: '#B8F200', traco: '#14121F' },
}

function iconeDaAba(p: Paleta): string {
  const { fundo, traco } = ICONE[p]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="10" fill="${fundo}"/><path d="M8.2 17.4c1.9 1.5 3.3 3.2 4.5 5.3 2.3-6.6 6.2-11.1 11.3-14.1" fill="none" stroke="${traco}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

interface Estado { tema: Tema; alternar: () => void; definirTema: (t: Tema) => void; paleta: Paleta; escolherPaleta: (p: Paleta) => void }
const Ctx = createContext<Estado | null>(null)

function paletaSalva(): Paleta {
  try {
    return localStorage.getItem('feito-paleta') === 'limao' ? 'limao' : 'sol'
  } catch {
    return 'sol'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.classList.contains('dark') ? 'escuro' : 'claro',
  )
  const [paleta, setPaleta] = useState<Paleta>(paletaSalva)

  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('dark', tema === 'escuro')
    html.dataset.paleta = paleta
    try {
      localStorage.setItem('feito-tema', tema)
      localStorage.setItem('feito-paleta', paleta)
    } catch {
      /* sem armazenamento local: tudo bem */
    }
    // ícone da aba do navegador acompanha o tema escolhido
    let icone = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!icone) {
      icone = document.createElement('link')
      icone.rel = 'icon'
      document.head.appendChild(icone)
    }
    icone.type = 'image/svg+xml'
    icone.href = iconeDaAba(paleta)
    // cor da barra do navegador acompanha o fundo do tema
    const [r, g, b] = getComputedStyle(html).getPropertyValue('--bg').trim().split(/\s+/).map(Number)
    if ([r, g, b].every((n) => Number.isFinite(n))) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'theme-color'
        document.head.appendChild(meta)
      }
      meta.removeAttribute('media')
      meta.content = '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')
    }
  }, [tema, paleta])

  return (
    <Ctx.Provider value={{ tema, alternar: () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')), definirTema: setTema, paleta, escolherPaleta: setPaleta }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTema() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTema precisa estar dentro de ThemeProvider')
  return c
}
