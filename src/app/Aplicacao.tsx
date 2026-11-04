import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProvedorAutenticacao, useAutenticacao } from '../auth/Autenticacao';
import { ProvedorNotificacoes } from '../components/Notificacoes';
import type { Perfil } from '../domain/tipos';
import { HOME_DO_PERFIL } from '../services/api';
import PaginaLogin from '../features/login/PaginaLogin';
import { carregadoresArea } from './areas';
import { CarregandoArea, FalhaAoCarregar, NaoEncontrada } from './Estados';

const AreaOperador = lazy(carregadoresArea.operador);
const AreaGerente = lazy(carregadoresArea.gerente);
const AreaMensalista = lazy(carregadoresArea.mensalista);
const PaginaRecuperarSenha = lazy(() => import('../features/login/PaginaRecuperarSenha'));

function ExigirPerfil({ perfil, children }: { perfil: Perfil; children: ReactNode }) {
  const { sessao } = useAutenticacao();
  const local = useLocation();
  if (!sessao) return <Navigate to="/login" replace state={{ destino: local.pathname }} />;
  // Separação rígida: quem tenta abrir a área de outro perfil volta para a própria.
  if (sessao.perfil !== perfil) return <Navigate to={HOME_DO_PERFIL[sessao.perfil]} replace />;
  return (
    <FalhaAoCarregar>
      <Suspense fallback={<CarregandoArea />}>{children}</Suspense>
    </FalhaAoCarregar>
  );
}

function Raiz() {
  const { sessao } = useAutenticacao();
  return <Navigate to={sessao ? HOME_DO_PERFIL[sessao.perfil] : '/login'} replace />;
}

export function Aplicacao() {
  return (
    <BrowserRouter>
      <ProvedorAutenticacao>
        <ProvedorNotificacoes>
          <Routes>
            <Route path="/" element={<Raiz />} />
            <Route path="/login" element={<PaginaLogin />} />
            <Route
              path="/recuperar-senha"
              element={
                <Suspense fallback={<CarregandoArea />}>
                  <PaginaRecuperarSenha />
                </Suspense>
              }
            />
            <Route path="/operador/*" element={<ExigirPerfil perfil="operador"><AreaOperador /></ExigirPerfil>} />
            <Route path="/gerente/*" element={<ExigirPerfil perfil="gerente"><AreaGerente /></ExigirPerfil>} />
            <Route path="/mensalista/*" element={<ExigirPerfil perfil="mensalista"><AreaMensalista /></ExigirPerfil>} />
            <Route path="*" element={<NaoEncontrada />} />
          </Routes>
        </ProvedorNotificacoes>
      </ProvedorAutenticacao>
    </BrowserRouter>
  );
}
