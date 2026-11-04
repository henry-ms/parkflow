import { useEffect, useMemo, useRef, useState } from 'react';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Carregando } from '../../components/Carregando';
import { Campo, Entrada, Selecao } from '../../components/Campo';
import { Dialogo } from '../../components/Dialogo';
import { IconeConfirmado, IconeImpressora } from '../../components/Icones';
import { ListaDados } from '../../components/ListaDados';
import { useNotificar } from '../../components/Notificacoes';
import { Painel } from '../../components/Pagina';
import { Placa } from '../../components/Placa';
import { Selo, SeloSituacao } from '../../components/Selo';
import { FORMAS_PAGAMENTO, rotuloForma, rotuloTipo } from '../../domain/catalogo';
import { formatarData, formatarDataHora, formatarDuracao, formatarMoeda, lerMoeda } from '../../domain/formato';
import { formatarPlaca } from '../../domain/placa';
import { calcularTarifa, TAXA_TICKET_PERDIDO } from '../../domain/tarifa';
import type { Contrato, Estadia, FormaPagamento } from '../../domain/tipos';
import { ErroApi, registrarSaida, type Recibo } from '../../services/api';
import { DetalheCalculo } from './DetalheCalculo';
import css from './Saida.module.css';

export interface SelecaoSaida {
  estadia: Estadia;
  saidaEm: string;
  contrato: (Contrato & { vencida: boolean }) | null;
}

export interface ResultadoSaida {
  recibo: Recibo;
  estadia: Estadia;
  forma: FormaPagamento | 'mensalista';
}

const ESPERA: Record<FormaPagamento, string> = {
  dinheiro: 'Registrando o pagamento em dinheiro.',
  debito: 'Peça ao cliente para aproximar ou inserir o cartão na maquininha e digitar a senha.',
  credito: 'Peça ao cliente para aproximar ou inserir o cartão na maquininha e digitar a senha.',
  pix: 'Mostre o QR Code da maquininha ao cliente. A confirmação chega sozinha quando o Pix for pago.',
};

export function CobrancaSaida({ selecao, aoConcluir }: { selecao: SelecaoSaida; aoConcluir: (r: ResultadoSaida) => void }) {
  const { estadia, saidaEm, contrato } = selecao;
  const [ticketPerdido, setTicketPerdido] = useState(false);
  const [forma, setForma] = useState<FormaPagamento | ''>('');
  const [recebidoTexto, setRecebidoTexto] = useState('');
  const [erros, setErros] = useState<{ forma?: string; recebido?: string }>({});
  const [conferindo, setConferindo] = useState(false);
  const [aguardando, setAguardando] = useState(false);
  const [recusa, setRecusa] = useState<string | null>(null);
  const refForma = useRef<HTMLSelectElement>(null);
  const refRecebido = useRef<HTMLInputElement>(null);

  const calculo = useMemo(() => calcularTarifa(estadia.tipo, estadia.entrada, saidaEm, { ticketPerdido }), [estadia, saidaEm, ticketPerdido]);
  const mensalista = estadia.mensalista;
  const total = mensalista ? 0 : calculo.total;
  const cobrar = total > 0;
  const recebido = lerMoeda(recebidoTexto);
  const troco = forma === 'dinheiro' && recebido !== null && recebido >= total ? recebido - total : null;

  function validar() {
    const novos: typeof erros = {};
    if (cobrar && !forma) novos.forma = 'Escolha a forma de pagamento.';
    if (cobrar && forma === 'dinheiro') {
      if (recebido === null) novos.recebido = 'Informe quanto o cliente entregou.';
      else if (recebido < total) novos.recebido = `O valor recebido é menor que o total. Faltam ${formatarMoeda(total - recebido)}.`;
    }
    setErros(novos);
    if (novos.forma) refForma.current?.focus();
    else if (novos.recebido) refRecebido.current?.focus();
    return !novos.forma && !novos.recebido;
  }

  async function confirmar() {
    setConferindo(false);
    setAguardando(true);
    setRecusa(null);
    const formaFinal = mensalista ? 'mensalista' : cobrar ? (forma as FormaPagamento) : 'dinheiro';
    try {
      const recibo = await registrarSaida({
        ticket: estadia.ticket,
        forma: formaFinal,
        ticketPerdido,
        valorRecebido: forma === 'dinheiro' ? (recebido ?? undefined) : undefined,
      });
      aoConcluir({ recibo, estadia, forma: formaFinal });
    } catch (e) {
      setAguardando(false);
      setRecusa(
        e instanceof ErroApi && e.codigo === 'pagamento-recusado'
          ? 'Pagamento recusado pela operadora do cartão.'
          : (e as Error).message,
      );
    }
  }

  const notas = [2000, 5000, 10000].filter((n) => n > total).slice(0, 2);
  const textoBotao = mensalista || !cobrar ? 'Registrar saída' : 'Confirmar pagamento';

  return (
    <div className={css.grade}>
      <Painel titulo="Dados da estadia" idTitulo="titulo-estadia" className={css.estadia}>
        <div className={css.placaLinha}>
          <Placa placa={estadia.placa} tamanho="md" />
          <Selo tom="neutro">No pátio</Selo>
        </div>
        <ListaDados
          colunas={2}
          dados={[
            { termo: 'Ticket nº', valor: estadia.ticket },
            { termo: 'Vaga', valor: estadia.vaga },
            { termo: 'Veículo', valor: [rotuloTipo(estadia.tipo), estadia.modeloCor].filter(Boolean).join(', ') },
            { termo: 'Entrada', valor: formatarDataHora(estadia.entrada) },
            { termo: 'Saída', valor: formatarDataHora(saidaEm) },
            { termo: 'Permanência', valor: formatarDuracao(calculo.minutos), destaque: true },
          ]}
        />
        {!mensalista && (
          <>
            <DetalheCalculo tipo={estadia.tipo} calculo={calculo} />
            <label className={css.ticketPerdido}>
              <input type="checkbox" checked={ticketPerdido} onChange={(e) => setTicketPerdido(e.target.checked)} disabled={aguardando} />
              <span>
                Cliente perdeu o ticket <span className={css.taxa}>(acrescenta {formatarMoeda(TAXA_TICKET_PERDIDO)})</span>
              </span>
            </label>
          </>
        )}
      </Painel>

      <aside className={css.pagamento} aria-labelledby="titulo-pagamento">
        <h2 id="titulo-pagamento" className={css.tituloPagamento}>
          {mensalista ? 'Saída de mensalista' : 'Total a pagar'}
        </h2>

        {aguardando ? (
          <div className={css.aguardando} role="status" aria-live="polite">
            <Carregando tamanho={28} />
            <p className={css.aguardandoTitulo}>{cobrar && forma !== 'dinheiro' ? 'Aguardando confirmação do pagamento…' : 'Registrando saída…'}</p>
            {cobrar && forma && <p>{ESPERA[forma]}</p>}
            <p className={css.valorEspera}>{formatarMoeda(total)}</p>
          </div>
        ) : mensalista ? (
          <PainelMensalista contrato={contrato} />
        ) : (
          <>
            <p className={css.total}>{formatarMoeda(total)}</p>
            {!cobrar && <p className={css.semCobranca}>Sem cobrança: a permanência ficou dentro da tolerância.</p>}

            {recusa && (
              <Aviso tom="problema" titulo={recusa}>
                Nada foi cobrado. Peça outra forma de pagamento ou tente o cartão de novo.
              </Aviso>
            )}

            {cobrar && (
              <div className={css.camposPagamento}>
                <Campo rotulo="Forma de pagamento" erro={erros.forma} obrigatorio>
                  {(p) => (
                    <Selecao
                      {...p}
                      ref={refForma}
                      textoVazio="Selecione"
                      value={forma}
                      onChange={(e) => {
                        setForma(e.target.value as FormaPagamento);
                        setErros({});
                        setRecusa(null);
                      }}
                    >
                      {FORMAS_PAGAMENTO.map((f) => (
                        <option key={f.valor} value={f.valor}>
                          {f.rotulo}
                        </option>
                      ))}
                    </Selecao>
                  )}
                </Campo>

                {forma === 'dinheiro' && (
                  <>
                    <Campo rotulo="Valor recebido" erro={erros.recebido} obrigatorio>
                      {(p) => (
                        <div className={css.moeda}>
                          <span aria-hidden="true">R$</span>
                          <Entrada
                            {...p}
                            ref={refRecebido}
                            className={css.entradaMoeda}
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="0,00"
                            value={recebidoTexto}
                            onChange={(e) => {
                              setRecebidoTexto(e.target.value.replace(/[^\d,]/g, ''));
                              setErros({});
                            }}
                          />
                        </div>
                      )}
                    </Campo>
                    <div className={css.atalhosValor} role="group" aria-label="Atalhos de valor em dinheiro">
                      <Botao tamanho="sm" onClick={() => setRecebidoTexto((total / 100).toFixed(2).replace('.', ','))}>
                        Valor exato
                      </Botao>
                      {notas.map((n) => (
                        <Botao key={n} tamanho="sm" onClick={() => setRecebidoTexto(String(n / 100))}>
                          {formatarMoeda(n)}
                        </Botao>
                      ))}
                    </div>
                    <p className={css.troco} aria-live="polite">
                      <span>Troco</span>
                      <strong>{troco !== null ? formatarMoeda(troco) : '–'}</strong>
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {!aguardando && (
          <Botao variante="primario" tamanho="lg" larguraTotal onClick={() => validar() && setConferindo(true)}>
            {textoBotao}
          </Botao>
        )}
      </aside>

      <Dialogo
        aberto={conferindo}
        aoFechar={() => setConferindo(false)}
        titulo="Confira antes de confirmar"
        largura="sm"
        descricao={`Depois de confirmar, a vaga ${estadia.vaga} é liberada e a saída não pode ser desfeita pelo caixa.`}
        rodape={
          <>
            <Botao onClick={() => setConferindo(false)}>Voltar e corrigir</Botao>
            <Botao variante="primario" onClick={confirmar} autoFocus>
              {textoBotao}
            </Botao>
          </>
        }
      >
        <ListaDados
          dados={[
            { termo: 'Placa', valor: formatarPlaca(estadia.placa) },
            { termo: 'Vaga a liberar', valor: estadia.vaga },
            { termo: 'Permanência', valor: formatarDuracao(calculo.minutos) },
            ...(mensalista ? [{ termo: 'Cobrança', valor: 'Mensalista, sem cobrança avulsa' }] : []),
            ...(!mensalista && ticketPerdido ? [{ termo: 'Ticket perdido', valor: `+ ${formatarMoeda(TAXA_TICKET_PERDIDO)}` }] : []),
            ...(cobrar && forma ? [{ termo: 'Forma de pagamento', valor: rotuloForma(forma) }] : []),
            ...(forma === 'dinheiro' && recebido !== null ? [{ termo: 'Valor recebido', valor: formatarMoeda(recebido) }] : []),
            ...(troco !== null ? [{ termo: 'Troco', valor: formatarMoeda(troco) }] : []),
            { termo: 'Total', valor: formatarMoeda(total), destaque: true },
          ]}
        />
      </Dialogo>
    </div>
  );
}

function PainelMensalista({ contrato }: { contrato: SelecaoSaida['contrato'] }) {
  if (!contrato) return <p className={css.semCobranca}>Mensalista sem contrato localizado. Confirme com o gerente antes de liberar.</p>;
  return (
    <div className={css.mensalista}>
      <p>
        <strong>{contrato.nome}</strong>, contrato nº {contrato.id}
      </p>
      <SeloSituacao situacao={contrato.vencida ? 'vencida' : 'em-dia'} />
      {contrato.vencida ? (
        <Aviso tom="problema" titulo={`Mensalidade vencida em ${formatarData(contrato.vencimento)}.`}>
          A saída não é bloqueada. Avise o cliente para regularizar com a gerência.
        </Aviso>
      ) : (
        <p className={css.semCobranca}>Contrato em dia. Não há cobrança avulsa.</p>
      )}
    </div>
  );
}

export function SaidaConcluida({ resultado, aoNovaSaida }: { resultado: ResultadoSaida; aoNovaSaida: () => void }) {
  const { recibo, estadia, forma } = resultado;
  const notificar = useNotificar();
  const refNova = useRef<HTMLButtonElement>(null);
  const [imprimindo, setImprimindo] = useState(false);
  const cobrou = recibo.total > 0;

  useEffect(() => refNova.current?.focus(), []);

  return (
    <Painel destaque className={css.concluida}>
      <div className={css.confirmacao} role="status">
        <IconeConfirmado tamanho={28} className={css.iconeOk} />
        <div>
          <h2>{cobrou ? 'Pagamento confirmado' : 'Saída registrada'}</h2>
          <p>Vaga {recibo.vagaLiberada} liberada.</p>
        </div>
      </div>
      <Placa placa={estadia.placa} tamanho="md" />
      {forma === 'dinheiro' && recibo.troco > 0 && (
        <p className={css.entregarTroco}>
          Entregue o troco: <strong>{formatarMoeda(recibo.troco)}</strong>
        </p>
      )}
      <ListaDados
        colunas={2}
        dados={[
          { termo: 'Recibo nº', valor: recibo.numero },
          { termo: 'Saída', valor: formatarDataHora(recibo.saida) },
          { termo: 'Forma', valor: forma === 'mensalista' ? 'Mensalista' : cobrou ? rotuloForma(forma) : 'Sem cobrança' },
          { termo: 'Total', valor: formatarMoeda(recibo.total), destaque: true },
        ]}
      />
      <div className={css.acoesConcluida}>
        <Botao ref={refNova} variante="primario" tamanho="lg" onClick={aoNovaSaida}>
          Registrar nova saída
        </Botao>
        {cobrou && (
          <Botao
            icone={<IconeImpressora tamanho={16} />}
            carregando={imprimindo}
            textoCarregando="Imprimindo recibo…"
            onClick={() => {
              setImprimindo(true);
              setTimeout(() => {
                setImprimindo(false);
                notificar('Recibo impresso.');
              }, 1000);
            }}
          >
            Imprimir recibo
          </Botao>
        )}
      </div>
    </Painel>
  );
}
