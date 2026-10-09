import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProgresso } from '../hooks/useProgresso'
import { NavInferior, type Aba } from '../components/NavInferior'
import Hoje from './Hoje'
import Perfil from './Perfil'

export default function Principal() {
  const { user } = useAuth()
  const progresso = useProgresso(user!.id)
  const [aba, setAba] = useState<Aba>('hoje')

  return (
    <>
      {aba === 'hoje' ? <Hoje progresso={progresso} onPerfil={() => setAba('perfil')} /> : <Perfil progresso={progresso} />}
      <NavInferior aba={aba} onMudar={setAba} />
    </>
  )
}
