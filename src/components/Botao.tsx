import type { ComponentPropsWithRef, ReactNode } from 'react';
import { Carregando } from './Carregando';
import css from './Botao.module.css';

export type VarianteBotao = 'primario' | 'secundario' | 'discreto' | 'perigo';
export type TamanhoBotao = 'sm' | 'md' | 'lg';

/** Classe compartilhada para links que precisam parecer botões. */
export function classeBotao(variante: VarianteBotao = 'secundario', tamanho: TamanhoBotao = 'md', larguraTotal = false) {
  return [css.botao, css[variante], css[tamanho], larguraTotal && css.larguraTotal].filter(Boolean).join(' ');
}

interface Props extends ComponentPropsWithRef<'button'> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
  icone?: ReactNode;
  larguraTotal?: boolean;
  /** Enquanto verdadeiro, o botão fica bloqueado e mostra `textoCarregando`. */
  carregando?: boolean;
  textoCarregando?: string;
}

export function Botao({
  variante = 'secundario',
  tamanho = 'md',
  icone,
  larguraTotal,
  carregando = false,
  textoCarregando,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={[classeBotao(variante, tamanho, larguraTotal), className].filter(Boolean).join(' ')}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...props}
    >
      {carregando ? <Carregando /> : icone}
      <span>{carregando && textoCarregando ? textoCarregando : children}</span>
    </button>
  );
}
