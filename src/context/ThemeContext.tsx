import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'claro' | 'escuro'
const Ctx = createContext<{ tema: Tema; alternar: () => void } | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() =>
    document.documentElement.classList.contains('dark') ? 'escuro' : 'claro',
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'escuro')
    try {
      localStorage.setItem('feito-tema', tema)
    } catch {
      /* sem armazenamento local: tudo bem */
    }
  }, [tema])
  return <Ctx.Provider value={{ tema, alternar: () => setTema((t) => (t === 'claro' ? 'escuro' : 'claro')) }}>{children}</Ctx.Provider>
}

export function useTema() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTema precisa estar dentro de ThemeProvider')
  return c
}
