import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Logo } from '../components/Logo'

export default function NovaSenha() {
  const { finalizarRecuperacao } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (senha !== confirma) {
      setErro('As duas senhas não são iguais. Confira e tente de novo.')
      return
    }
    setEnviando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    setEnviando(false)
    if (error) {
      setErro('Não consegui salvar a nova senha. O link pode ter expirado: peça um novo na tela de login.')
      return
    }
    finalizarRecuperacao() // a pessoa já está logada e segue para o app
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 p-6">
      <header className="flex flex-col gap-2">
        <Logo />
        <h1 className="text-2xl font-extrabold">Crie uma nova senha</h1>
        <p className="text-soft">Escolha uma senha que você consiga lembrar. Pode ser uma frase.</p>
      </header>
      <form onSubmit={salvar} className="flex flex-col gap-3">
        <label className="sr-only" htmlFor="nova-senha">Nova senha</label>
        <input id="nova-senha" type="password" required minLength={6} autoComplete="new-password" placeholder="Nova senha (mínimo 6 caracteres)" className="field" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <label className="sr-only" htmlFor="confirma-senha">Repita a nova senha</label>
        <input id="confirma-senha" type="password" required minLength={6} autoComplete="new-password" placeholder="Repita a nova senha" className="field" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
        {erro && <p role="alert" className="text-sm text-soft">{erro}</p>}
        <button type="submit" disabled={enviando} className="btn-primary">{enviando ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
    </main>
  )
}
