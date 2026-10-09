import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/Logo'

const SLIDES = [
  { emoji: '🌱', titulo: 'Pequenos passos contam', texto: 'Aqui você quebra o dia em tarefas pequenas e reconhece cada uma que fizer. Sem cobrança.' },
  { emoji: '📸', titulo: 'Mostre que está feito', texto: 'Ao concluir, você pode tirar uma foto como “prova” para si mesmo. É opcional: um toque no check também vale.' },
  { emoji: '🔒', titulo: 'Seu espaço é privado', texto: 'Tudo começa só com você. Só você escolhe o que compartilha, e pode mudar de ideia quando quiser.' },
]

export default function Onboarding() {
  const { user, recarregarPerfil } = useAuth()
  const [etapa, setEtapa] = useState(0) // 0 = dados básicos; 1..3 = slides
  const [nome, setNome] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvarBasico() {
    if (!nascimento) {
      setErro('Precisamos da sua data de nascimento para cuidar da sua privacidade.')
      return
    }
    setErro(null)
    setSalvando(true)
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: nome.trim() || null, birth_date: nascimento })
      .eq('id', user!.id)
    setSalvando(false)
    if (error) setErro('Não consegui salvar agora. Tente de novo.')
    else setEtapa(1)
  }

  async function terminar() {
    setSalvando(true)
    await supabase.from('profiles').update({ onboarding_done: true }).eq('id', user!.id)
    await recarregarPerfil()
  }

  if (etapa === 0) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-5 p-6">
        <Logo />
        <h1 className="text-2xl font-extrabold">Vamos nos conhecer rapidinho</h1>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Como você quer ser chamado(a)? <span className="font-normal text-soft">(opcional)</span></span>
          <input className="field" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} autoComplete="given-name" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-semibold">Data de nascimento</span>
          <input type="date" className="field" value={nascimento} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setNascimento(e.target.value)} />
          <span className="text-sm text-soft">Usamos só para proteger menores de idade. Não aparece para ninguém.</span>
        </label>
        {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
        <button className="btn-primary" disabled={salvando} onClick={salvarBasico}>Continuar</button>
      </main>
    )
  }

  const slide = SLIDES[etapa - 1]
  const ultimo = etapa === SLIDES.length
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-between gap-6 p-6">
      <div className="flex justify-end">
        <button className="btn-ghost !min-h-[44px] !py-2" onClick={terminar} disabled={salvando}>Pular</button>
      </div>
      <section className="flex flex-col items-center gap-4 text-center animate-rise" key={etapa}>
        <div className="text-7xl" aria-hidden>{slide.emoji}</div>
        <h1 className="text-2xl font-extrabold">{slide.titulo}</h1>
        <p className="text-lg text-soft">{slide.texto}</p>
      </section>
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-2" aria-hidden>
          {SLIDES.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === etapa - 1 ? 'w-6 bg-brand' : 'w-2 bg-line'}`} />
          ))}
        </div>
        <button className="btn-primary" disabled={salvando} onClick={() => (ultimo ? terminar() : setEtapa(etapa + 1))}>
          {ultimo ? 'Começar' : 'Próximo'}
        </button>
      </div>
    </main>
  )
}
