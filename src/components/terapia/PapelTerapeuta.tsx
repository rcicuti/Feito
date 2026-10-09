import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ehMenor } from '../../lib/grupos'
import { mensagemTerapia } from '../../lib/terapia'
import { Confirmar } from '../grupo/Confirmar'

// Perfil: acompanhamento profissional (ser terapeuta ou ir para a aba Terapia)
export function PapelTerapeuta({ onAbrirTerapia }: { onAbrirTerapia: () => void }) {
  const { profile, recarregarPerfil } = useAuth()
  const menor = ehMenor(profile)
  const ativo = Boolean(profile?.is_therapist)
  const [crp, setCrp] = useState(profile?.crp ?? '')
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [desligando, setDesligando] = useState(false)

  async function definir(ligar: boolean) {
    setOcupado(true)
    setAviso(null)
    const { error } = await supabase.rpc('definir_papel_terapeuta', { p_ativo: ligar, p_crp: ligar ? crp : null })
    setOcupado(false)
    if (error) return setAviso(mensagemTerapia(error, 'Não consegui mudar agora.'))
    await recarregarPerfil()
    setAviso(ligar ? 'Perfil de terapeuta ativo. Veja a aba Terapia.' : 'Perfil de terapeuta desligado.')
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-5" aria-label="Acompanhamento profissional">
      <h2 className="text-lg font-extrabold">Acompanhamento profissional</h2>
      {menor ? (
        <p className="text-sm text-soft">Por enquanto, vínculo com terapeuta é só para maiores de 18 anos.</p>
      ) : (
        <>
          <button className="btn-outline" onClick={onAbrirTerapia}>Abrir Terapia</button>
          <label className="flex min-h-[48px] items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--brand))]" checked={ativo} disabled={ocupado} onChange={(e) => (e.target.checked ? void definir(true) : setDesligando(true))} />
            <span>
              <span className="block font-semibold">Sou terapeuta / profissional</span>
              <span className="block text-sm text-soft">Ativa a área de pacientes. Você só vê o que cada paciente decidir compartilhar.</span>
            </span>
          </label>
          {!ativo && (
            <p className="text-xs text-soft">Se for ativar, o CRP (opcional) aparece para quem for se vincular. O app não verifica o CRP.</p>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">CRP <span className="font-normal text-soft">(opcional)</span></span>
            <input className="field" maxLength={30} placeholder="Ex.: 06/123456" value={crp} onChange={(e) => setCrp(e.target.value)} onBlur={() => { if (ativo && crp !== (profile?.crp ?? '')) void definir(true) }} />
          </label>
        </>
      )}
      {aviso && <p role="status" className="rounded-2xl bg-brand/10 p-3 text-sm">{aviso}</p>}
      {desligando && (
        <Confirmar
          titulo="Desligar o perfil de terapeuta?"
          texto="Todos os vínculos com seus pacientes são encerrados e o seu código deixa de funcionar. Os dados dos pacientes continuam só com eles."
          confirmar="Desligar"
          onConfirmar={async () => { await definir(false); setDesligando(false) }}
          onCancelar={() => setDesligando(false)}
        />
      )}
    </section>
  )
}
