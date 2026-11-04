import type { ReactNode } from 'react';
import css from './ListaDados.module.css';

export interface Dado {
  termo: string;
  valor: ReactNode;
  /** Destaca a linha que o usuário precisa conferir (ex.: total, troco). */
  destaque?: boolean;
}

/** Pares rótulo/valor alinhados, para resumos e conferências. */
export function ListaDados({ dados, colunas = 1 }: { dados: Dado[]; colunas?: 1 | 2 }) {
  return (
    <dl className={`${css.lista} ${colunas === 2 ? css.duas : ''}`}>
      {dados.map((d) => (
        <div key={d.termo} className={d.destaque ? css.destaque : undefined}>
          <dt>{d.termo}</dt>
          <dd>{d.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
