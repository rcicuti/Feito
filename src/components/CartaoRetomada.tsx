interface Props {
  dias: number
  onDescanso: () => void
  onRetomar: () => void
}

// Aparece quando passaram dias em branco. Nunca cobra: oferece descanso ou recomeço.
export function CartaoRetomada({ dias, onDescanso, onRetomar }: Props) {
  const podeDescansar = dias <= 7
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-line bg-card p-4 animate-rise" aria-label="Descanso ou retomada">
      <p className="text-lg font-bold">
        {dias === 1 ? 'Ontem passou em branco por aqui, e tudo bem.' : 'Alguns dias passaram, e tudo bem.'}
      </p>
      <p className="text-soft">
        {podeDescansar
          ? 'Se foi um dia de descanso, marque e sua sequência continua de onde parou. Se não, é só retomar hoje.'
          : 'Que bom ver você de volta. Cada recomeço também é um passo.'}
      </p>
      <div className="flex flex-wrap gap-2">
        {podeDescansar && <button className="btn-primary !min-h-[48px] !py-2" onClick={onDescanso}>Foi descanso</button>}
        <button className="btn-outline !min-h-[48px] !py-2" onClick={onRetomar}>Vou retomar hoje</button>
      </div>
    </section>
  )
}
