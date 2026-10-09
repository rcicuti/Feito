export type Aba = 'hoje' | 'grupos' | 'terapia' | 'perfil'

export function NavInferior({ aba, onMudar, mostrarTerapia = false }: { aba: Aba; onMudar: (a: Aba) => void; mostrarTerapia?: boolean }) {
  const itens: { id: Aba; emoji: string; rotulo: string }[] = [
    { id: 'hoje', emoji: '✅', rotulo: 'Hoje' },
    { id: 'grupos', emoji: '👥', rotulo: 'Grupos' },
    ...(mostrarTerapia ? [{ id: 'terapia' as Aba, emoji: '🤝', rotulo: 'Terapia' }] : []),
    { id: 'perfil', emoji: '🌱', rotulo: 'Perfil' },
  ]
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex max-w-md">
        {itens.map((i) => (
          <button
            key={i.id} type="button" onClick={() => onMudar(i.id)}
            aria-current={aba === i.id ? 'page' : undefined}
            className={`flex min-h-[60px] flex-1 flex-col items-center justify-center gap-0.5 text-sm font-bold ${aba === i.id ? 'text-brand' : 'text-soft'}`}
          >
            <span className="text-xl" aria-hidden>{i.emoji}</span>
            {i.rotulo}
          </button>
        ))}
      </div>
    </nav>
  )
}
