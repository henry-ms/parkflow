import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import { autenticar, type Sessao } from '../services/api';

interface ContextoAutenticacao {
  sessao: Sessao | null;
  entrar: (identificador: string, senha: string) => Promise<Sessao>;
  sair: () => void;
}

const Contexto = createContext<ContextoAutenticacao | null>(null);
const CHAVE = 'parkflow.sessao';

/** A sessão guarda só identificação e perfil; nada de senha ou dado sensível. */
function lerSessao(): Sessao | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Sessao) : null;
  } catch {
    return null;
  }
}

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(lerSessao);

  const entrar = useCallback(async (identificador: string, senha: string) => {
    const nova = await autenticar(identificador, senha);
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(nova));
    } catch {
      /* navegação privada: a sessão vale só enquanto a aba estiver aberta */
    }
    setSessao(nova);
    return nova;
  }, []);

  const sair = useCallback(() => {
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      /* sem armazenamento disponível */
    }
    setSessao(null);
  }, []);

  const valor = useMemo(() => ({ sessao, entrar, sair }), [sessao, entrar, sair]);
  return <Contexto value={valor}>{children}</Contexto>;
}

export function useAutenticacao() {
  const ctx = use(Contexto);
  if (!ctx) throw new Error('useAutenticacao precisa estar dentro de ProvedorAutenticacao');
  return ctx;
}
