import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fontes servidas pelo próprio app (sem chamadas a terceiros) e só nos pesos usados.
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow-semi-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-600.css';

import './styles/tokens.css';
import './styles/base.css';
import { Aplicacao } from './app/Aplicacao';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Aplicacao />
  </StrictMode>,
);
