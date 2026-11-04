import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { IconeProblema } from './Icones';
import css from './Campo.module.css';

export interface PropsControle {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
  'aria-required'?: true;
}

interface PropsCampo {
  rotulo: string;
  /** Ajuda permanente, exibida abaixo do rótulo. */
  dica?: ReactNode;
  /** Mensagem de erro: borda, ícone e texto, nunca só cor. */
  erro?: string | null;
  opcional?: boolean;
  obrigatorio?: boolean;
  className?: string;
  children: (controle: PropsControle) => ReactNode;
}

/**
 * Estrutura comum de todos os campos: rótulo, dica, controle e erro,
 * já ligados por `id`/`aria-describedby` para leitores de tela.
 */
export function Campo({ rotulo, dica, erro, opcional, obrigatorio, className, children }: PropsCampo) {
  const id = useId();
  const idDica = dica ? `${id}-dica` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descritores = [idErro, idDica].filter(Boolean).join(' ') || undefined;

  return (
    <div className={[css.campo, erro && css.comErro, className].filter(Boolean).join(' ')}>
      <label htmlFor={id} className={css.rotulo}>
        {rotulo}
        {opcional && <span className={css.opcional}> (opcional)</span>}
      </label>
      {dica && (
        <p id={idDica} className={css.dica}>
          {dica}
        </p>
      )}
      {children({
        id,
        'aria-invalid': erro ? true : undefined,
        'aria-describedby': descritores,
        'aria-required': obrigatorio ? true : undefined,
      })}
      {erro && (
        <p id={idErro} className={css.erro}>
          <IconeProblema tamanho={16} />
          <span>{erro}</span>
        </p>
      )}
    </div>
  );
}

export function Entrada({ className, ...props }: ComponentPropsWithRef<'input'>) {
  return <input className={[css.controle, className].filter(Boolean).join(' ')} {...props} />;
}

interface PropsSelecao extends ComponentPropsWithRef<'select'> {
  /** Texto da opção vazia inicial, que obriga uma escolha consciente. */
  textoVazio?: string;
}

export function Selecao({ className, textoVazio, children, ...props }: PropsSelecao) {
  return (
    <span className={css.selecaoCaixa}>
      <select className={[css.controle, css.selecao, className].filter(Boolean).join(' ')} {...props}>
        {textoVazio && (
          <option value="" disabled>
            {textoVazio}
          </option>
        )}
        {children}
      </select>
    </span>
  );
}
