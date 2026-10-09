import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

type Modo = 'entrar' | 'criar' | 'esqueci'

function traduzirErro(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha não conferem. Quer tentar de novo?'
  if (m.includes('already registered')) return 'Esse e-mail já tem conta. Que tal entrar?'
  if (m.includes('password')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('email')) return 'Confira se o e-mail está certinho.'
  return 'Algo não funcionou desta vez. Tente novamente em instantes.'
}

export default function Login() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setEnviando(true)
    if (modo === 'esqueci') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (error) setErro('Não consegui enviar agora. Tente de novo em alguns minutos.')
      else setAviso('Se esse e-mail tiver uma conta, enviamos um link para criar uma nova senha. Confira também a caixa de spam.')
    } else if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setErro(traduzirErro(error.message))
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setErro(traduzirErro(error.message))
      else if (!data.session) setAviso('Enviamos um link de confirmação para o seu e-mail. Abra e volte aqui.')
    }
    setEnviando(false)
  }

  async function comGoogle() {
    setErro(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setErro('Não deu para entrar com o Google agora. Tente com e-mail.')
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 p-6">
      <header className="flex flex-col gap-2">
        <Logo grande />
        <p className="text-lg text-soft">Pequenos passos. Conquistas reais.</p>
      </header>

      <button type="button" onClick={comGoogle} className="btn-outline w-full">
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
          <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        Continuar com Google
      </button>

      <div className="flex items-center gap-3 text-sm text-soft">
        <span className="h-px flex-1 bg-line" /> ou com e-mail <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={enviar} className="flex flex-col gap-3">
        <label className="sr-only" htmlFor="email">E-mail</label>
        <input id="email" type="email" required autoComplete="email" inputMode="email" placeholder="Seu e-mail" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        {modo !== 'esqueci' && (
          <>
            <label className="sr-only" htmlFor="senha">Senha</label>
            <input id="senha" type="password" required minLength={6} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} placeholder="Senha (mínimo 6 caracteres)" className="field" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </>
        )}
        {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
        {aviso && <p role="status" className="rounded-2xl bg-brand/10 p-3 text-sm">{aviso}</p>}
        <button type="submit" disabled={enviando} className="btn-primary">
          {enviando ? 'Um instante…' : modo === 'entrar' ? 'Entrar' : modo === 'criar' ? 'Criar minha conta' : 'Enviar link para nova senha'}
        </button>
        {modo === 'entrar' && (
          <button type="button" className="btn-ghost !min-h-[44px] !py-2 text-sm" onClick={() => { setModo('esqueci'); setErro(null); setAviso(null) }}>
            Esqueci minha senha
          </button>
        )}
      </form>

      <button type="button" className="btn-ghost" onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setErro(null); setAviso(null) }}>
        {modo === 'entrar' ? 'Ainda não tenho conta' : modo === 'criar' ? 'Já tenho conta' : 'Voltar para entrar'}
      </button>

      <p className="text-center text-xs text-soft">
        Seu espaço é privado. O Feito! não substitui acompanhamento profissional e não faz diagnóstico.
      </p>
    </main>
  )
}
