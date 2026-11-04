import type { ComponentPropsWithRef } from 'react';
import { formatarPlaca, normalizarPlaca, TAMANHO_PLACA } from '../domain/placa';
import css from './Placa.module.css';

type Tamanho = 'sm' | 'md' | 'lg';

/**
 * Placa no padrão Mercosul. É o elemento que o operador confere com o carro
 * à sua frente, por isso aparece sempre no mesmo desenho, em todas as telas.
 */
export function Placa({ placa, tamanho = 'md' }: { placa: string; tamanho?: Tamanho }) {
  return (
    <span className={`${css.placa} ${css[tamanho]}`}>
      <span className={css.faixa} aria-hidden="true">
        BRASIL
      </span>
      <span className={css.caracteres}>{formatarPlaca(placa)}</span>
    </span>
  );
}

interface PropsEntradaPlaca extends Omit<ComponentPropsWithRef<'input'>, 'onChange' | 'value'> {
  valor: string;
  aoMudar: (placaNormalizada: string) => void;
}

/** Campo de placa com o mesmo desenho da placa física: o que se digita é o que se vê na rua. */
export function EntradaPlaca({ valor, aoMudar, className, ...props }: PropsEntradaPlaca) {
  const invalida = props['aria-invalid'];
  return (
    <span className={[css.placa, css.lg, css.editavel, invalida && css.invalida, className].filter(Boolean).join(' ')}>
      <span className={css.faixa} aria-hidden="true">
        BRASIL
      </span>
      <input
        className={css.entrada}
        value={valor}
        onChange={(e) => aoMudar(normalizarPlaca(e.target.value))}
        maxLength={TAMANHO_PLACA + 1}
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="ABC1D23"
        {...props}
      />
    </span>
  );
}
