import { Logo } from '../components/Logo'

export default function ConfigurarSupabase() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 p-6">
      <Logo grande />
      <h1 className="text-xl font-bold">Falta conectar o Supabase</h1>
      <p className="text-soft">
        Crie o arquivo <code className="rounded bg-card px-1">.env</code> na raiz do projeto com as duas variáveis abaixo
        (copie de <code className="rounded bg-card px-1">.env.example</code>) e reinicie o app.
      </p>
      <pre className="overflow-x-auto rounded-2xl border border-line bg-card p-4 text-sm">
{`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
      </pre>
      <p className="text-sm text-soft">Os passos completos estão no README.</p>
    </main>
  )
}
