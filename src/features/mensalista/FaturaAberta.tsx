import { useState } from 'react';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { IconeConfirmado, IconeCopiar } from '../../components/Icones';
import { SeloSituacao } from '../../components/Selo';
import { formatarCompetencia, formatarData, formatarMoeda } from '../../domain/formato';
import { descreverPrazo, situacaoFatura } from '../../domain/situacao';
import type { Fatura } from '../../domain/tipos';
import { gerarSegundaVia, type SegundaVia } from '../../services/api';
import css from './Faturas.module.css';

/** A fatura que pede ação fica no topo, com uma só ação principal. */
export function FaturaAberta({ fatura }: { fatura: Fatura }) {
  const situacao = situacaoFatura(fatura);
  const vencida = situacao === 'vencida';
  const [segundaVia, setSegundaVia] = useState<SegundaVia | null>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      setSegundaVia(await gerarSegundaVia(fatura));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setGerando(false);
    }
  }

  async function copiar() {
    if (!segundaVia) return;
    try {
      await navigator.clipboard.writeText(segundaVia.linhaDigitavel.replace(/\D/g, ''));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 4000);
    } catch {
      setErro('Não foi possível copiar. Selecione o código e copie manualmente.');
    }
  }

  return (
    <section className={`${css.aberta} ${vencida ? css.abertaVencida : ''}`} aria-labelledby={`fatura-${fatura.id}`}>
      <div className={css.abertaCabecalho}>
        <h2 id={`fatura-${fatura.id}`}>Fatura de {formatarCompetencia(fatura.competencia)}</h2>
        <SeloSituacao situacao={situacao} />
      </div>

      <div className={css.valorLinha}>
        <div>
          <p className={css.rotuloValor}>Valor cobrado</p>
          <p className={css.valor}>{formatarMoeda(fatura.valor)}</p>
        </div>
        <p className={vencida ? css.prazoVencido : css.prazo}>
          Vencimento em {formatarData(fatura.vencimento)}, {descreverPrazo(fatura.vencimento)}.
        </p>
      </div>

      <p className={css.instrucoes}>
        {vencida
          ? 'Pague o quanto antes para manter sua vaga. Gere a 2ª via do boleto com a data atualizada e pague no aplicativo do banco ou em lotéricas.'
          : 'Pague até o vencimento pelo aplicativo do seu banco, com o código do boleto. Por Pix, o pagamento aparece aqui em poucos minutos.'}
      </p>

      {erro && <Aviso tom="problema" titulo={erro} />}

      {segundaVia ? (
        <div className={css.segundaVia} role="status">
          <p className={css.prontaTitulo}>
            <IconeConfirmado className={css.iconeOk} /> 2ª via pronta. Válida até {formatarData(segundaVia.validaAte)}.
          </p>
          <p className={css.rotuloValor} id={`codigo-${fatura.id}`}>
            Código do boleto
          </p>
          <p className={css.codigo} aria-labelledby={`codigo-${fatura.id}`}>
            {segundaVia.linhaDigitavel}
          </p>
          <Botao variante="primario" icone={copiado ? <IconeConfirmado /> : <IconeCopiar />} onClick={copiar}>
            {copiado ? 'Código copiado' : 'Copiar código'}
          </Botao>
        </div>
      ) : (
        <Botao variante="primario" tamanho="lg" onClick={gerar} carregando={gerando} textoCarregando="Gerando 2ª via…">
          Gerar 2ª via do boleto
        </Botao>
      )}
    </section>
  );
}
