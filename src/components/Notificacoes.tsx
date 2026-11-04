import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { IconeConfirmado, IconeFechar, IconeInfo } from './Icones';
import css from './Notificacoes.module.css';

type Tom = 'regular' | 'neutro';
interface Notificacao {
  id: number;
  texto: string;
  tom: Tom;
}

const Contexto = createContext<((texto: string, tom?: Tom) => void) | null>(null);

/** Confirmações curtas e não bloqueantes, anunciadas de forma educada ao leitor de tela. */
export function ProvedorNotificacoes({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Notificacao[]>([]);
  const proximo = useRef(0);

  const remover = useCallback((id: number) => setLista((l) => l.filter((n) => n.id !== id)), []);

  const notificar = useCallback(
    (texto: string, tom: Tom = 'regular') => {
      const id = ++proximo.current;
      setLista((l) => [...l.slice(-2), { id, texto, tom }]);
      setTimeout(() => remover(id), 6000);
    },
    [remover],
  );

  const valor = useMemo(() => notificar, [notificar]);

  return (
    <Contexto value={valor}>
      {children}
      <div className={css.regiao} role="status" aria-live="polite">
        {lista.map((n) => (
          <div key={n.id} className={`${css.notificacao} ${css[n.tom]}`}>
            {n.tom === 'regular' ? <IconeConfirmado /> : <IconeInfo />}
            <p>{n.texto}</p>
            <button type="button" onClick={() => remover(n.id)} aria-label="Dispensar aviso">
              <IconeFechar tamanho={16} />
            </button>
          </div>
        ))}
      </div>
    </Contexto>
  );
}

export function useNotificar() {
  const ctx = use(Contexto);
  if (!ctx) throw new Error('useNotificar precisa estar dentro de ProvedorNotificacoes');
  return ctx;
}
