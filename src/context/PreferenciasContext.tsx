import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Animacoes = 'auto' | 'reduzidas'
interface Prefs { animacoes: Animacoes; sons: boolean }

const CHAVE = 'feito-prefs'
const PADRAO: Prefs = { animacoes: 'auto', sons: false } // "auto" segue a configuração do aparelho; sons começam desligados

function ler(): Prefs {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '{}') as Partial<Prefs>
    return { animacoes: bruto.animacoes === 'reduzidas' ? 'reduzidas' : 'auto', sons: bruto.sons === true }
  } catch {
    return PADRAO
  }
}

const Ctx = createContext<{ prefs: Prefs; mudar: (p: Partial<Prefs>) => void } | null>(null)

export function PreferenciasProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(ler)

  useEffect(() => {
    document.documentElement.classList.toggle('reduzir-animacoes', prefs.animacoes === 'reduzidas')
    try { localStorage.setItem(CHAVE, JSON.stringify(prefs)) } catch { /* sem armazenamento local: tudo bem */ }
  }, [prefs])

  const mudar = useCallback((p: Partial<Prefs>) => setPrefs((atual) => ({ ...atual, ...p })), [])
  return <Ctx.Provider value={{ prefs, mudar }}>{children}</Ctx.Provider>
}

export function usePreferencias() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePreferencias precisa estar dentro de PreferenciasProvider')
  return c
}
