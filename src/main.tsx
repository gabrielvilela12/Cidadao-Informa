import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { warmApi } from './services/http.ts';
import './index.css';

// Uma sessao existente ja chama /api/auth/me no primeiro render. Para quem vai
// entrar agora, inicia o cold start antes mesmo de o formulario ser enviado.
if (!localStorage.getItem('cidadaoinforma_token')) {
  void warmApi();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
