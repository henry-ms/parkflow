import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconeFechar } from './Icones';
import css from './Dialogo.module.css';

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: ReactNode;
  children?: ReactNode;
  rodape?: ReactNode;
  largura?: 'sm' | 'md' | 'lg';
  /** Impede fechar com Esc durante operações em andamento. */
  bloquearFechamento?: boolean;
}

/**
 * Diálogo modal sobre o <dialog> nativo: foco preso, Esc e retorno de foco
 * ao elemento de origem sem código extra.
 */
export function Dialogo({ aberto, aoFechar, titulo, descricao, children, rodape, largura = 'md', bloquearFechamento }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idDescricao = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className={`${css.dialogo} ${css[largura]}`}
      aria-labelledby={idTitulo}
      aria-describedby={descricao ? idDescricao : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (!bloquearFechamento) aoFechar();
      }}
    >
      {aberto && (
        <>
          <header className={css.cabecalho}>
            <h2 id={idTitulo}>{titulo}</h2>
            <button type="button" className={css.fechar} onClick={aoFechar} disabled={bloquearFechamento} aria-label="Fechar">
              <IconeFechar />
            </button>
          </header>
          {descricao && (
            <div id={idDescricao} className={css.descricao}>
              {descricao}
            </div>
          )}
          {children && <div className={css.corpo}>{children}</div>}
          {rodape && <footer className={css.rodape}>{rodape}</footer>}
        </>
      )}
    </dialog>
  );
}
