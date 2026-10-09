export function Logo({ grande = false }: { grande?: boolean }) {
  return (
    <span className={`font-extrabold tracking-tight text-brand ${grande ? 'text-5xl' : 'text-2xl'}`}>feito!</span>
  )
}
