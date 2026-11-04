import { formatarHoraSegundos } from '../domain/formato';
import { Botao } from './Botao';
import { IconeAtualizar } from './Icones';
import css from './AtualizadoEm.module.css';

interface Props {
  em?: string;
  atualizando: boolean;
  aoAtualizar: () => void;
  intervaloSegundos?: number;
}

/** Mostra quando os dados foram lidos e permite atualizar na hora. */
export function AtualizadoEm({ em, atualizando, aoAtualizar, intervaloSegundos }: Props) {
  return (
    <div className={css.atualizado}>
      <p>
        <span>
          {atualizando ? (
            'Atualizando…'
          ) : em ? (
            <>
              Atualizado às <time dateTime={em}>{formatarHoraSegundos(em)}</time>
            </>
          ) : (
            'Ainda não atualizado'
          )}
        </span>
        {intervaloSegundos && <span className={css.auto}>Atualiza sozinho a cada {intervaloSegundos} segundos</span>}
      </p>
      <Botao tamanho="sm" variante="discreto" icone={<IconeAtualizar tamanho={16} />} onClick={aoAtualizar} disabled={atualizando}>
        Atualizar
      </Botao>
    </div>
  );
}
