import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProgresso } from '../hooks/useProgresso'
import { useGrupos } from '../hooks/useGrupos'
import { useComecandoAgora } from '../hooks/useComecandoAgora'
import { NavInferior, type Aba } from '../components/NavInferior'
import Hoje from './Hoje'
import Perfil from './Perfil'
import Grupos from './Grupos'
import Terapia from './Terapia'
import { useAcompanhamento } from '../hooks/useAcompanhamento'
import GrupoDetalhe from './GrupoDetalhe'

const CHAVE_CONVITE = 'feito-convite'

function lerConvite(): string | null {
  try { return localStorage.getItem(CHAVE_CONVITE) } catch { return null }
}

export default function Principal() {
  const { user, profile } = useAuth()
  const progresso = useProgresso(user!.id)
  const grupos = useGrupos()
  const acomp = useAcompanhamento(Boolean(profile?.is_therapist))
  const agora = useComecandoAgora(user!.id, grupos.grupos.length > 0)
  const [convite, setConvite] = useState<string | null>(lerConvite)
  const [aba, setAba] = useState<Aba>(convite ? 'grupos' : 'hoje')
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null)

  function conviteTratado() {
    setConvite(null)
    try { localStorage.removeItem(CHAVE_CONVITE) } catch { /* tudo bem */ }
  }

  function mudarAba(a: Aba) {
    setAba(a)
    if (a !== 'grupos') setGrupoAberto(null)
  }

  return (
    <>
      {aba === 'hoje' && <Hoje progresso={progresso} grupos={grupos.grupos} terapeutas={acomp.paraCompartilhar} agora={agora} onPerfil={() => mudarAba('perfil')} />}
      {aba === 'terapia' && <Terapia est={acomp} />}
      {aba === 'perfil' && <Perfil progresso={progresso} onTerapia={() => mudarAba('terapia')} />}
      {aba === 'grupos' && (grupoAberto
        ? <GrupoDetalhe grupoId={grupoAberto} estado={grupos} agora={agora} onVoltar={() => setGrupoAberto(null)} />
        : <Grupos estado={grupos} agora={agora} conviteInicial={convite} onConviteTratado={conviteTratado} onAbrir={setGrupoAberto} />)}
      <NavInferior aba={aba} onMudar={mudarAba} mostrarTerapia={Boolean(profile?.is_therapist) || acomp.terapeutas.length > 0 || aba === 'terapia'} />
    </>
  )
}
