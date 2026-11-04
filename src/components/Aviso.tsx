import type { ReactNode, Ref } from 'react';
import { IconeConfirmado, IconeInfo, IconeProblema } from './Icones';
import css from './Aviso.module.css';

interface Props {
  tom: 'problema' | 'regular' | 'neutro';
  titulo: string;
  children?: ReactNode;
  acoes?: ReactNode;
  ref?: Ref<HTMLDivElement>;
  /** Erros interrompem o leitor de tela; demais avisos aguardam a vez. */
  anunciar?: boolean;
}

const ICONE = { problema: IconeProblema, regular: IconeConfirmado, neutro: IconeInfo };

/** Mensagem em bloco: diz o que aconteceu e o que fazer em seguida. */
export function Aviso({ tom, titulo, children, acoes, ref, anunciar = true }: Props) {
  const Icone = ICONE[tom];
  const papel = anunciar ? (tom === 'problema' ? 'alert' : 'status') : undefined;
  return (
    <div ref={ref} role={papel} tabIndex={-1} className={`${css.aviso} ${css[tom]}`}>
      <Icone tamanho={20} className={css.icone} />
      <div className={css.corpo}>
        <p className={css.titulo}>{titulo}</p>
        {children && <div className={css.texto}>{children}</div>}
        {acoes && <div className={css.acoes}>{acoes}</div>}
      </div>
    </div>
  );
}
