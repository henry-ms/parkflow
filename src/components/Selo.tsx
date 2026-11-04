import type { ReactNode } from 'react';
import { SITUACOES, type Tom } from '../domain/situacao';
import type { EventoPatio, Situacao } from '../domain/tipos';
import { IconeConfirmado, IconeEntrada, IconeProblema, IconeRelogio, IconeSaida } from './Icones';
import css from './Selo.module.css';

/** Selo de status: cor + ícone + texto. A cor nunca aparece sozinha. */
export function Selo({ tom, icone, children }: { tom: Tom; icone?: ReactNode; children: ReactNode }) {
  const padrao = tom === 'regular' ? <IconeConfirmado tamanho={14} /> : tom === 'problema' ? <IconeProblema tamanho={14} /> : null;
  return (
    <span className={`${css.selo} ${css[tom]}`}>
      {icone ?? padrao}
      <span>{children}</span>
    </span>
  );
}

export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  const { rotulo, tom } = SITUACOES[situacao];
  return (
    <Selo tom={tom} icone={situacao === 'a-vencer' ? <IconeRelogio tamanho={14} /> : undefined}>
      {rotulo}
    </Selo>
  );
}

/** Entrada e saída são rotina do pátio: sempre neutras, diferenciadas por ícone e texto. */
export function SeloEvento({ evento }: { evento: EventoPatio }) {
  return (
    <Selo tom="neutro" icone={evento === 'entrada' ? <IconeEntrada tamanho={14} /> : <IconeSaida tamanho={14} />}>
      {evento === 'entrada' ? 'Entrada' : 'Saída'}
    </Selo>
  );
}
