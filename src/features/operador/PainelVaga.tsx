import { Botao } from '../../components/Botao';
import { Esqueleto } from '../../components/Carregando';
import { rotuloSetor } from '../../domain/catalogo';
import type { SetorId } from '../../domain/tipos';
import css from './Entrada.module.css';

interface Props {
  vaga: string | null;
  setor: SetorId;
  carregando: boolean;
  manual: boolean;
  aoAlterar: () => void;
  aoVoltarSugestao: () => void;
  desabilitado: boolean;
}

/** A vaga aparece como pintada no chão: o código que o motorista vai procurar no pátio. */
export function PainelVaga({ vaga, setor, carregando, manual, aoAlterar, aoVoltarSugestao, desabilitado }: Props) {
  return (
    <aside className={css.painelVaga} aria-labelledby="titulo-vaga" aria-live="polite">
      <h2 id="titulo-vaga" className={css.tituloVaga}>
        {manual ? 'Vaga escolhida' : 'Vaga sugerida'}
      </h2>

      <div className={css.vagaPintada}>
        {carregando && !vaga ? (
          <span className={css.procurando}>Procurando vaga livre…</span>
        ) : vaga ? (
          <span className={css.codigoVaga}>{vaga}</span>
        ) : (
          <span className={css.semVaga}>Sem vaga livre</span>
        )}
      </div>

      <div className={css.infoVaga}>
        {carregando && !vaga ? (
          <Esqueleto largura="10rem" />
        ) : vaga ? (
          <>
            <p className={css.setorVaga}>{rotuloSetor(setor)}</p>
            <p>{manual ? 'Escolhida pelo operador.' : 'Primeira vaga livre a partir da cancela.'}</p>
          </>
        ) : (
          <p>
            <strong>{rotuloSetor(setor)} está lotado.</strong> Escolha outro setor no formulário.
          </p>
        )}
      </div>

      {vaga && (
        <div className={css.acoesVaga}>
          <Botao larguraTotal onClick={aoAlterar} disabled={desabilitado}>
            Alterar vaga
          </Botao>
          {manual && (
            <Botao variante="discreto" larguraTotal onClick={aoVoltarSugestao} disabled={desabilitado}>
              Usar a vaga sugerida
            </Botao>
          )}
        </div>
      )}
    </aside>
  );
}
