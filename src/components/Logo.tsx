// Marca (manual v0.2): quadrado bem arredondado + check de traço orgânico (a haste longa sobe, como um pulinho
// de comemoração) + "feito" em minúsculas + "!" em destaque. Sol sobre tinta no claro; limão sobre noite no escuro.
export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight ${grande ? 'text-5xl' : 'text-2xl'}`} aria-label="Feito!" role="img">
      <svg viewBox="0 0 32 32" className={grande ? 'h-12 w-12' : 'h-8 w-8'} aria-hidden>
        <rect width="32" height="32" rx="10" fill="rgb(var(--brand))" />
        <path d="M8.2 17.4c1.9 1.5 3.3 3.2 4.5 5.3 2.3-6.6 6.2-11.1 11.3-14.1" fill="none" stroke="rgb(var(--brand-ink))" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span aria-hidden className="text-ink">feito<span className="ml-0.5 text-brand-fg">!</span></span>
    </span>
  )
}
