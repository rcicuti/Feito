import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'
export type Paleta = 'sol' | 'limao'

// As duas paletas do manual de marca. Cada uma tem modo claro e modo escuro.
export const PALETAS: Record<Paleta, { nome: string; descricao: string; cores: Record<Tema, string[]> }> = {
  sol: { nome: 'Sol + tinta', descricao: 'Quente e chamativa, estilo adesivo.', cores: { claro: ['#FFC400', '#17130A', '#FFF8E0'], escuro: ['#FFC400', '#2B2410', '#17130A'] } },
  limao: { nome: 'Noite + limão', descricao: 'Energia de jogo, o escuro de contraste máximo.', cores: { claro: ['#B8F200', '#14121F', '#F4F3FA'], escuro: ['#B8F200', '#231F36', '#14121F'] } },
}

interface Estado { tema: Tema; alternar: () => void; paleta: Paleta; escolherPaleta: (p: Paleta) => void }
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
    <Ctx.Provider value={{ tema, alternar: () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')), paleta, escolherPaleta: setPaleta }}>
      {children}
    </Ctx.Provider>
  )
}

export function useTema() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTema precisa estar dentro de ThemeProvider')
  return c
}
