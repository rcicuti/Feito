// As duas "chaves" que o paciente controla, com explicação simples do que cada uma mostra
export function Chaves({ tarefas, resumo, onTarefas, onResumo, desabilitado = false }: {
  tarefas: boolean; resumo: boolean; onTarefas: (v: boolean) => void; onResumo: (v: boolean) => void; desabilitado?: boolean
}) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={desabilitado}>
      <legend className="sr-only">O que compartilhar</legend>
      <label className={`flex items-start gap-3 rounded-2xl border p-4 ${tarefas ? 'border-brand bg-brand/10' : 'border-line bg-card'}`}>
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--brand))]" checked={tarefas} onChange={(e) => onTarefas(e.target.checked)} />
        <span>
          <span className="block font-bold">Tarefas que eu marcar para ele(a)</span>
          <span className="block text-sm text-soft">Só as conclusões em que você escolher “Meu(minha) terapeuta”: título, legenda e, se você deixar, a foto. Desligar apaga o que já foi compartilhado.</span>
        </span>
      </label>
      <label className={`flex items-start gap-3 rounded-2xl border p-4 ${resumo ? 'border-brand bg-brand/10' : 'border-line bg-card'}`}>
        <input type="checkbox" className="mt-1 h-5 w-5 accent-[rgb(var(--brand))]" checked={resumo} onChange={(e) => onResumo(e.target.checked)} />
        <span>
          <span className="block font-bold">Resumo semanal de adesão</span>
          <span className="block text-sm text-soft">Só números por semana: em quantos dias você fez tarefas e quantas fez (contando todas, inclusive as privadas). Nunca mostra títulos, fotos ou legendas.</span>
        </span>
      </label>
    </fieldset>
  )
}
