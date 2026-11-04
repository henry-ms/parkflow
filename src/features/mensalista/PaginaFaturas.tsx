import { useState } from 'react';
import { useAutenticacao } from '../../auth/Autenticacao';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Esqueleto } from '../../components/Carregando';
import { Dialogo } from '../../components/Dialogo';
import { ListaDados } from '../../components/ListaDados';
import { CabecalhoPagina, Painel } from '../../components/Pagina';
import { Placa } from '../../components/Placa';
import { SeloSituacao } from '../../components/Selo';
import { formatarCompetencia, formatarData, formatarMoeda } from '../../domain/formato';
import { situacaoFatura } from '../../domain/situacao';
import type { Fatura } from '../../domain/tipos';
import { useAssincrono } from '../../hooks/useAssincrono';
import { obterPainelMensalista } from '../../services/api';
import { FaturaAberta } from './FaturaAberta';
import css from './Faturas.module.css';

export default function PaginaFaturas() {
  const { sessao } = useAutenticacao();
  const painel = useAssincrono(() => obterPainelMensalista(sessao!.contratoId!), [sessao]);
  const [recibo, setRecibo] = useState<Fatura | null>(null);
  const primeiroNome = sessao?.nome.split(' ')[0];

  if (painel.erro) {
    return (
      <>
        <CabecalhoPagina titulo="Minhas faturas" />
        <Aviso tom="problema" titulo="Não foi possível carregar suas faturas." acoes={<Botao onClick={painel.recarregar}>Tentar novamente</Botao>}>
          {painel.erro.message}
        </Aviso>
      </>
    );
  }

  const dados = painel.dados;
  const abertas = dados?.faturas.filter((f) => !f.pagaEm) ?? [];
  const pagas = dados?.faturas.filter((f) => f.pagaEm) ?? [];

  return (
    <>
      <CabecalhoPagina titulo="Minhas faturas" descricao={`Olá, ${primeiroNome}. Aqui ficam as mensalidades do seu contrato.`} />

      {dados ? (
        <section className={css.contrato} aria-label="Seu contrato">
          <ListaDados
            colunas={2}
            dados={[
              { termo: 'Contrato nº', valor: dados.contrato.id },
              { termo: 'Placa', valor: <Placa placa={dados.contrato.placa} tamanho="sm" /> },
              { termo: 'Vaga fixa', valor: dados.contrato.vaga },
              { termo: 'Vencimento', valor: `Todo dia ${dados.contrato.diaVencimento}` },
            ]}
          />
        </section>
      ) : (
        <Esqueleto altura="6rem" />
      )}

      <div className={css.colunas}>
        <div className={css.principal}>
          {!dados && <Esqueleto altura="16rem" />}
          {dados && abertas.length === 0 && (
            <Aviso tom="regular" titulo="Nenhuma fatura em aberto.">
              Suas mensalidades estão pagas. A próxima fatura aparece aqui quando for emitida.
            </Aviso>
          )}
          {abertas.map((f) => (
            <FaturaAberta key={f.id} fatura={f} />
          ))}

          {dados && pagas.length > 0 && (
            <Painel titulo="Faturas pagas" idTitulo="titulo-pagas">
              <ul className={css.pagas}>
                {pagas.map((f) => (
                  <li key={f.id}>
                    <span className={css.mes}>{formatarCompetencia(f.competencia)}</span>
                    <span>{formatarMoeda(f.valor)}</span>
                    <span className={css.pagaEm}>
                      <SeloSituacao situacao={situacaoFatura(f)} /> em {formatarData(f.pagaEm!)}
                    </span>
                    <Botao tamanho="sm" onClick={() => setRecibo(f)} aria-label={`Ver recibo de ${formatarCompetencia(f.competencia)}`}>
                      Ver recibo
                    </Botao>
                  </li>
                ))}
              </ul>
            </Painel>
          )}
        </div>

        {dados && (
          <aside className={css.ajuda} aria-labelledby="titulo-ajuda">
            <h2 id="titulo-ajuda">Dúvidas sobre sua fatura?</h2>
            <p>Fale com o {dados.contato.nome}.</p>
            <dl className={css.contato}>
              <div>
                <dt>Telefone</dt>
                <dd>
                  <a href={`tel:${dados.contato.telefone.replace(/\D/g, '')}`}>{dados.contato.telefone}</a>
                </dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>
                  <a href={`mailto:${dados.contato.email}`}>
                    {dados.contato.email.split('@')[0]}
                    <wbr />@{dados.contato.email.split('@')[1]}
                  </a>
                </dd>
              </div>
              <div>
                <dt>Atendimento</dt>
                <dd>{dados.contato.horario}</dd>
              </div>
            </dl>
            <details>
              <summary>Paguei e a fatura continua em aberto</summary>
              <p>Pagamentos por Pix aparecem em poucos minutos. Por boleto, podem levar até 3 dias úteis. Se passar disso, fale com o atendimento e tenha o comprovante em mãos.</p>
            </details>
            <details>
              <summary>Perdi o boleto</summary>
              <p>Use "Gerar 2ª via do boleto" na fatura em aberto. O código pode ser copiado e pago no aplicativo do seu banco.</p>
            </details>
            <details>
              <summary>Quero trocar o veículo do contrato</summary>
              <p>A troca de placa é feita pela gerência do estacionamento. Leve o documento do novo veículo.</p>
            </details>
          </aside>
        )}
      </div>

      <Dialogo aberto={recibo !== null} aoFechar={() => setRecibo(null)} titulo="Recibo de pagamento" largura="sm" rodape={<Botao variante="primario" onClick={() => setRecibo(null)}>Fechar</Botao>}>
        {recibo && dados && (
          <ListaDados
            dados={[
              { termo: 'Referente a', valor: formatarCompetencia(recibo.competencia) },
              { termo: 'Contrato nº', valor: dados.contrato.id },
              { termo: 'Vencimento', valor: formatarData(recibo.vencimento) },
              { termo: 'Pago em', valor: formatarData(recibo.pagaEm!) },
              { termo: 'Valor pago', valor: formatarMoeda(recibo.valor), destaque: true },
            ]}
          />
        )}
      </Dialogo>
    </>
  );
}
