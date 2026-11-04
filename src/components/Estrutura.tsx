import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAutenticacao } from '../auth/Autenticacao';
import { useConectado } from '../hooks/utilitarios';
import { HOME_DO_PERFIL } from '../services/api';
import type { Perfil } from '../domain/tipos';
import { IconeSair, IconeSemConexao } from './Icones';
import css from './Estrutura.module.css';

export interface ItemNavegacao {
  para: string;
  rotulo: string;
  /** Tecla de atalho exibida ao lado do rótulo. */
  atalho?: string;
}

const NOME_PERFIL: Record<Perfil, string> = { operador: 'Operador de caixa', gerente: 'Gerente', mensalista: 'Mensalista' };

export function Marca() {
  return (
    <span className={css.marca}>
      <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
        <rect width="32" height="32" rx="6" fill="var(--c-acao)" />
        <path d="M11 25V7h6.5a5.5 5.5 0 0 1 0 11H15v7z" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinejoin="round" />
      </svg>
      ParkFlow
    </span>
  );
}

/** Estrutura de cada perfil: barra superior só com as funções daquele perfil. */
export function Estrutura({ itens, status, atalhos }: { itens: ItemNavegacao[]; status?: ReactNode; atalhos?: ReactNode }) {
  const { sessao } = useAutenticacao();
  const local = useLocation();
  const principal = useRef<HTMLElement>(null);
  const primeiraVez = useRef(true);

  // Em SPA, o leitor de tela não percebe a troca de página: levamos o foco ao conteúdo.
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false;
      return;
    }
    principal.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [local.pathname]);

  if (!sessao) return null;

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className={css.barra}>
        <div className={css.interno}>
          <Link to={HOME_DO_PERFIL[sessao.perfil]} className={css.linkMarca} aria-label="ParkFlow, ir para o início">
            <Marca />
          </Link>
          <nav aria-label="Principal" className={css.navegacao}>
            <ul>
              {itens.map((item) => (
                <li key={item.para}>
                  <NavLink to={item.para} end className={({ isActive }) => (isActive ? `${css.item} ${css.ativo}` : css.item)}>
                    {item.rotulo}
                    {item.atalho && (
                      <kbd className={css.tecla} aria-label={`atalho ${item.atalho}`}>
                        {item.atalho}
                      </kbd>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          {status && <div className={css.status}>{status}</div>}
          <MenuUsuario nome={sessao.nome} perfil={NOME_PERFIL[sessao.perfil]} atalhos={atalhos} />
        </div>
      </header>
      <AvisoSemConexao />
      <main id="conteudo" ref={principal} tabIndex={-1} className={css.principal}>
        <Outlet />
      </main>
    </>
  );
}

function MenuUsuario({ nome, perfil, atalhos }: { nome: string; perfil: string; atalhos?: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const { sair } = useAutenticacao();
  const navegar = useNavigate();
  const idPainel = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const iniciais = nome
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };
    document.addEventListener('pointerdown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  return (
    <div className={css.usuario} ref={raiz}>
      <button
        ref={botao}
        type="button"
        className={css.botaoUsuario}
        aria-expanded={aberto}
        aria-controls={idPainel}
        onClick={() => setAberto((a) => !a)}
      >
        <span className={css.avatar} aria-hidden="true">
          {iniciais}
        </span>
        <span className={css.identificacao}>
          <span className={css.nome}>{nome}</span>
          <span className={css.perfil}>{perfil}</span>
        </span>
        <span className="visualmente-oculto">, abrir menu da conta</span>
      </button>
      <div id={idPainel} className={css.painelUsuario} hidden={!aberto}>
        {atalhos && <div className={css.atalhos}>{atalhos}</div>}
        <button
          type="button"
          className={css.sair}
          onClick={() => {
            sair();
            navegar('/login', { replace: true, state: { saiu: true } });
          }}
        >
          <IconeSair />
          Sair do ParkFlow
        </button>
      </div>
    </div>
  );
}

function AvisoSemConexao() {
  const conectado = useConectado();
  if (conectado) return null;
  return (
    <div className={css.semConexao} role="alert">
      <IconeSemConexao />
      <p>
        <strong>Sem conexão.</strong> Os dados na tela podem estar desatualizados e nenhuma operação será registrada até a rede voltar.
      </p>
    </div>
  );
}
