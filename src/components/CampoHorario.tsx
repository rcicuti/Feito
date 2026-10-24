import { horaParaISO, mascaraHora } from '../lib/dates'

interface Props {
  id?: string
  valor: string // texto digitado, ex.: "08:30"
  onChange: (texto: string) => void
  className?: string
}

// Campo de horário digitado (abre o teclado numérico), no lugar da roda de seleção.
export function CampoHorario({ id, valor, onChange, className = '' }: Props) {
  const incompleto = valor.length > 0 && horaParaISO(valor) === null
  return (
    <div className="flex flex-col gap-1">
      <input
        id={id} className={`field ${className}`} inputMode="numeric" autoComplete="off" placeholder="HH:MM (ex.: 08:30)" maxLength={5}
        value={valor} onChange={(e) => onChange(mascaraHora(e.target.value))}
        aria-invalid={incompleto}
      />
      {valor.length === 5 && incompleto && (
        <span role="alert" className="text-sm font-semibold text-brand-fg">Esse horário não parece certo. Use de 00:00 a 23:59.</span>
      )}
    </div>
  )
}
