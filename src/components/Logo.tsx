// Marca: quadrado verde com um check branco + "feito" em escuro + "!" em verde
export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${grande ? 'text-5xl' : 'text-2xl'}`} aria-label="Feito!" role="img">
      <svg viewBox="0 0 32 32" className={grande ? 'h-12 w-12' : 'h-8 w-8'} aria-hidden>
        <rect width="32" height="32" rx="8" fill="rgb(var(--brand))" />
        <path d="M9 16.5l4.8 4.8L23 11.5" fill="none" stroke="rgb(var(--brand-ink))" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span aria-hidden className="text-ink">feito<span className="ml-0.5 text-brand">!</span></span>
    </span>
  )
}
