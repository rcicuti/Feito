import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { EstadoAcompanhamento } from '../hooks/useAcompanhamento'
import { ehMenor } from '../lib/grupos'
import { Logo } from '../components/Logo'
import { MeuAcompanhamento } from '../components/terapia/MeuAcompanhamento'
import { MeusPacientes } from '../components/terapia/MeusPacientes'

export default function Terapia({ est }: { est: EstadoAcompanhamento }) {
  const { user, profile } = useAuth()
  const ehTerapeuta = Boolean(profile?.is_therapist)
  const [modo, setModo] = useState<'pacientes' | 'meu'>(ehTerapeuta ? 'pacientes' : 'meu')
  const atual = ehTerapeuta ? modo : 'meu'

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 pb-28 pt-5">
      <header className="flex items-center justify-between"><Logo /></header>
      <h1 className="text-2xl font-extrabold">Terapia</h1>
      {ehTerapeuta && (
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-card p-1">
          <button role="tab" aria-selected={atual === 'pacientes'} onClick={() => setModo('pacientes')} className={`min-h-[44px] rounded-xl text-sm font-bold ${atual === 'pacientes' ? 'bg-brand text-brand-ink' : 'text-soft'}`}>Meus pacientes</button>
          <button role="tab" aria-selected={atual === 'meu'} onClick={() => setModo('meu')} className={`min-h-[44px] rounded-xl text-sm font-bold ${atual === 'meu' ? 'bg-brand text-brand-ink' : 'text-soft'}`}>Meu acompanhamento</button>
        </div>
      )}
      {atual === 'pacientes' ? <MeusPacientes est={est} meuId={user!.id} /> : <MeuAcompanhamento est={est} menor={ehMenor(profile)} />}
      <p className="text-center text-xs text-soft">O Feito! não substitui acompanhamento profissional e não tem chat clínico.</p>
    </div>
  )
}
