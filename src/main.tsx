import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'

registerSW({ immediate: true })

// Link de convite (?convite=CODIGO): guarda o código para sobreviver ao login e limpa o endereço
try {
  const url = new URL(window.location.href)
  const c = url.searchParams.get('convite')
  if (c) {
    localStorage.setItem('feito-convite', c.slice(0, 20))
    url.searchParams.delete('convite')
    window.history.replaceState({}, '', url.pathname + url.search + url.hash)
  }
} catch { /* tudo bem */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
