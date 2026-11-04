import { useDeferredValue, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Aviso } from '../../components/Aviso';
import { Botao, classeBotao } from '../../components/Botao';
import { Campo, Entrada } from '../../components/Campo';
import { Esqueleto } from '../../components/Carregando';
import { IconeBusca, IconeVoltar } from '../../components/Icones';
import { CabecalhoPagina, Painel } from '../../components/Pagina';
import { Placa } from '../../components/Placa';
import { formatarDuracao, formatarHora, minutosEntre } from '../../domain/formato';
import { formatarPlaca } from '../../domain/placa';
import type { Estadia } from '../../domain/tipos';
import { useAssincrono } from '../../hooks/useAssincrono';
import { useRelogio } from '../../hooks/utilitarios';
import { buscarEstadia, contratoDaPlaca, ErroApi, listarNoPatio } from '../../services/api';
import { CobrancaSaida, SaidaConcluida, type ResultadoSaida, type SelecaoSaida } from './CobrancaSaida';
import css from './Saida.module.css';

const LIMITE_LISTA = 12;

export default function PaginaSaida() {
  const [params, setParams] = useSearchParams();
  const noPatio = useAssincrono(listarNoPatio);
  const [termo, setTermo] = useState(params.get('busca') ?? '');
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [naoEncontrado, setNaoEncontrado] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [selecao, setSelecao] = useState<SelecaoSaida | null>(null);
  const [resultado, setResultado] = useState<ResultadoSaida | null>(null);
  const refBusca = useRef<HTMLInputElement>(null);

  async function selecionar(estadia: Estadia) {
    const contrato = estadia.mensalista ? await contratoDaPlaca(estadia.placa).catch(() => null) : null;
    // O horário de saída fica fixo no momento da consulta: o valor não muda enquanto o cliente paga.
    setSelecao({ estadia, saidaEm: new Date().toISOString(), contrato });
    setNaoEncontrado(null);
  }

  async function buscar(valor = termo) {
    setNaoEncontrado(null);
    if (!valor.trim()) {
      setErroBusca('Digite a placa ou o número do ticket.');
      return refBusca.current?.focus();
    }
    setErroBusca(null);
    setBuscando(true);
    try {
      await selecionar(await buscarEstadia(valor));
    } catch (e) {
      if (e instanceof ErroApi && e.codigo === 'nao-encontrado') setNaoEncontrado(valor.trim().toUpperCase());
      else setErroBusca((e as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  // Vindo do aviso de placa duplicada na entrada, a busca já começa feita.
  useEffect(() => {
    const inicial = params.get('busca');
    if (inicial) void buscar(inicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function recomecar() {
    setResultado(null);
    setSelecao(null);
    setTermo('');
    setParams({}, { replace: true });
    void noPatio.recarregar();
    requestAnimationFrame(() => refBusca.current?.focus());
  }

  const voltar = { para: '/operador', rotulo: 'Voltar para o início' };

  if (resultado) {
    return (
      <>
        <CabecalhoPagina titulo="Registrar saída" voltar={voltar} />
        <SaidaConcluida resultado={resultado} aoNovaSaida={recomecar} />
      </>
    );
  }

  if (selecao) {
    return (
      <>
        <CabecalhoPagina titulo="Registrar saída" voltar={voltar} />
        <Botao variante="discreto" tamanho="sm" icone={<IconeVoltar />} className={css.trocar} onClick={() => setSelecao(null)}>
          Voltar para a busca
        </Botao>
        <CobrancaSaida selecao={selecao} aoConcluir={setResultado} />
      </>
    );
  }

  return (
    <>
      <CabecalhoPagina titulo="Registrar saída" voltar={voltar} descricao="Busque pelo veículo ou escolha na lista dos que estão no pátio." />

      <form
        className={css.busca}
        role="search"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          void buscar();
        }}
      >
        <Campo rotulo="Placa ou nº do ticket" erro={erroBusca} dica="O leitor de código de barras do ticket também preenche este campo.">
          {(p) => (
            <Entrada
              {...p}
              ref={refBusca}
              autoFocus
              type="search"
              value={termo}
              onChange={(e) => {
                setTermo(e.target.value);
                setNaoEncontrado(null);
                setErroBusca(null);
              }}
              placeholder="ABC1D23 ou 0428"
              autoComplete="off"
              spellCheck={false}
              className={css.campoBusca}
            />
          )}
        </Campo>
        <Botao type="submit" variante="primario" icone={<IconeBusca />} carregando={buscando} textoCarregando="Buscando…">
          Buscar
        </Botao>
      </form>

      {naoEncontrado && (
        <div className={css.aviso}>
          <Aviso
            tom="problema"
            titulo={`Nenhum veículo no pátio com ${/^\d+$/.test(naoEncontrado) ? `o ticket nº ${naoEncontrado}` : `a placa ${formatarPlaca(naoEncontrado.replace(/[^A-Z0-9]/g, ''))}`}.`}
            acoes={
              <Link to="/operador/entrada" className={classeBotao('secundario', 'sm')}>
                Registrar uma entrada
              </Link>
            }
          >
            Confira os caracteres com a placa do veículo ou o número impresso no ticket. Se o cliente perdeu o ticket, busque pela placa. Se o
            veículo não tem entrada registrada, registre a entrada antes.
          </Aviso>
        </div>
      )}

      <ListaPatio termo={termo} estadias={noPatio.dados} carregando={noPatio.carregando} erro={noPatio.erro} aoTentarDeNovo={noPatio.recarregar} aoEscolher={selecionar} />
    </>
  );
}

interface PropsLista {
  termo: string;
  estadias?: Estadia[];
  carregando: boolean;
  erro?: Error;
  aoTentarDeNovo: () => void;
  aoEscolher: (e: Estadia) => void;
}

/** Reconhecer em vez de lembrar: o operador escolhe o carro na lista, sem decorar placa ou ticket. */
function ListaPatio({ termo, estadias, carregando, erro, aoTentarDeNovo, aoEscolher }: PropsLista) {
  const agora = useRelogio();
  const termoAdiado = useDeferredValue(termo);
  const filtradas = useMemo(() => {
    const t = termoAdiado.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!estadias) return [];
    if (!t) return estadias;
    return estadias.filter((e) => e.placa.includes(t) || e.ticket.includes(t));
  }, [estadias, termoAdiado]);
  const visiveis = filtradas.slice(0, LIMITE_LISTA);

  return (
    <Painel titulo="Veículos no pátio" idTitulo="titulo-patio">
      {erro && (
        <Aviso tom="problema" titulo="Não foi possível carregar a lista do pátio." acoes={<Botao tamanho="sm" onClick={aoTentarDeNovo}>Tentar novamente</Botao>}>
          A busca por placa ou ticket continua funcionando.
        </Aviso>
      )}
      {!estadias && carregando && <Esqueleto altura="14rem" />}
      {estadias && (
        <>
          <p className={css.contagem} aria-live="polite">
            {filtradas.length === 0
              ? `Nenhum veículo no pátio corresponde a "${termo}".`
              : filtradas.length > LIMITE_LISTA
                ? `Mostrando ${LIMITE_LISTA} de ${filtradas.length}. Continue digitando para filtrar.`
                : `${filtradas.length} ${filtradas.length === 1 ? 'veículo' : 'veículos'}${termo ? ` com "${termo}"` : ''}.`}
          </p>
          <ul className={css.lista}>
            {visiveis.map((e) => (
              <li key={e.ticket}>
                <button type="button" className={css.itemLista} onClick={() => aoEscolher(e)}>
                  <Placa placa={e.placa} tamanho="sm" />
                  <span className={css.itemVaga}>Vaga {e.vaga}</span>
                  <span className={css.itemEntrada}>
                    Entrou às {formatarHora(e.entrada)}, há {formatarDuracao(minutosEntre(e.entrada, agora))}
                  </span>
                  <span className={css.itemTipo}>{e.mensalista ? 'Mensalista' : `Ticket ${e.ticket}`}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Painel>
  );
}
