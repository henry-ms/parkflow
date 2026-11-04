import { useDeferredValue, useMemo, useState } from 'react';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Entrada } from '../../components/Campo';
import { Esqueleto } from '../../components/Carregando';
import { IconeBusca, IconeMais, IconeOrdemAsc, IconeOrdemDesc, IconeOrdenar } from '../../components/Icones';
import { useNotificar } from '../../components/Notificacoes';
import { CabecalhoPagina, Painel } from '../../components/Pagina';
import { Placa } from '../../components/Placa';
import { SeloSituacao } from '../../components/Selo';
import { formatarData, formatarMoeda, mascararCpf } from '../../domain/formato';
import { descreverPrazo, situacaoContrato, SITUACOES } from '../../domain/situacao';
import type { Contrato, Situacao } from '../../domain/tipos';
import { useAssincrono } from '../../hooks/useAssincrono';
import { listarContratos } from '../../services/api';
import { DialogoNovoContrato } from './DialogoNovoContrato';
import css from './Mensalistas.module.css';

type Filtro = 'todos' | 'em-dia' | 'vencida';
type Coluna = 'nome' | 'placa' | 'vaga' | 'mensalidade' | 'vencimento' | 'situacao';
type Linha = Contrato & { situacao: Situacao };

const COLUNAS: { id: Coluna; rotulo: string; numero?: boolean }[] = [
  { id: 'nome', rotulo: 'Mensalista' },
  { id: 'placa', rotulo: 'Placa' },
  { id: 'vaga', rotulo: 'Vaga' },
  { id: 'mensalidade', rotulo: 'Mensalidade', numero: true },
  { id: 'vencimento', rotulo: 'Vencimento' },
  { id: 'situacao', rotulo: 'Situação' },
];

export default function PaginaMensalistas() {
  const notificar = useNotificar();
  const contratos = useAssincrono(listarContratos);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  // Por vencimento crescente, as vencidas aparecem primeiro.
  const [ordem, setOrdem] = useState<{ coluna: Coluna; asc: boolean }>({ coluna: 'vencimento', asc: true });
  const [criando, setCriando] = useState(false);
  const buscaAdiada = useDeferredValue(busca);

  const linhas: Linha[] = useMemo(() => (contratos.dados ?? []).map((c) => ({ ...c, situacao: situacaoContrato(c) })), [contratos.dados]);
  const contagem = useMemo(
    () => ({ todos: linhas.length, 'em-dia': linhas.filter((l) => l.situacao === 'em-dia').length, vencida: linhas.filter((l) => l.situacao === 'vencida').length }),
    [linhas],
  );

  const visiveis = useMemo(() => {
    const t = buscaAdiada.trim().toLowerCase();
    const tPlaca = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return linhas
      .filter((l) => filtro === 'todos' || l.situacao === filtro)
      .filter((l) => !t || l.nome.toLowerCase().includes(t) || (tPlaca && l.placa.includes(tPlaca)) || l.vaga.toLowerCase().includes(t))
      .sort((a, b) => {
        const va = a[ordem.coluna];
        const vb = b[ordem.coluna];
        const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR');
        return ordem.asc ? r : -r;
      });
  }, [linhas, filtro, buscaAdiada, ordem]);

  function ordenar(coluna: Coluna) {
    setOrdem((o) => ({ coluna, asc: o.coluna === coluna ? !o.asc : true }));
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Mensalistas"
        descricao={
          contratos.dados ? (
            <>
              {contagem.todos} contratos ativos.{' '}
              {contagem.vencida > 0 ? `${contagem.vencida} com mensalidade vencida.` : 'Nenhuma mensalidade vencida.'}
            </>
          ) : (
            <Esqueleto largura="16rem" />
          )
        }
        acoes={
          <Botao variante="primario" icone={<IconeMais />} onClick={() => setCriando(true)}>
            Novo contrato
          </Botao>
        }
      />

      <Painel>
        <div className={css.ferramentas}>
          <div className={css.busca}>
            <IconeBusca className={css.iconeBusca} />
            <Entrada
              type="search"
              aria-label="Buscar por nome, placa ou vaga"
              placeholder="Buscar por nome, placa ou vaga"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <fieldset className={css.filtros}>
            <legend className="visualmente-oculto">Filtrar por situação</legend>
            {(
              [
                ['todos', 'Todos'],
                ['em-dia', 'Em dia'],
                ['vencida', 'Vencidas'],
              ] as const
            ).map(([valor, rotulo]) => (
              <label key={valor} className={css.filtro}>
                <input type="radio" name="filtro" value={valor} checked={filtro === valor} onChange={() => setFiltro(valor)} />
                <span>
                  {rotulo} <span className={css.contagem}>{contagem[valor]}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        {contratos.erro && (
          <Aviso tom="problema" titulo="Não foi possível carregar os contratos." acoes={<Botao tamanho="sm" onClick={contratos.recarregar}>Tentar novamente</Botao>}>
            {contratos.erro.message}
          </Aviso>
        )}

        {!contratos.dados && !contratos.erro && <Esqueleto altura="20rem" />}

        {contratos.dados && (
          <div className={css.rolagem} role="region" aria-label="Contratos de mensalistas" tabIndex={0}>
            <table className={css.tabela}>
              <caption className="visualmente-oculto">
                Contratos de mensalistas, ordenados por {COLUNAS.find((c) => c.id === ordem.coluna)!.rotulo.toLowerCase()}, ordem{' '}
                {ordem.asc ? 'crescente' : 'decrescente'}
              </caption>
              <thead>
                <tr>
                  {COLUNAS.map((c) => {
                    const ativa = ordem.coluna === c.id;
                    return (
                      <th key={c.id} scope="col" aria-sort={ativa ? (ordem.asc ? 'ascending' : 'descending') : undefined} className={c.numero ? css.numero : undefined}>
                        <button type="button" className={css.ordenar} onClick={() => ordenar(c.id)}>
                          {c.rotulo}
                          {ativa ? ordem.asc ? <IconeOrdemAsc tamanho={16} /> : <IconeOrdemDesc tamanho={16} /> : <IconeOrdenar tamanho={16} className={css.ordenarInativo} />}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l) => (
                  <tr key={l.id} className={l.situacao === 'vencida' ? css.linhaVencida : undefined}>
                    <td>
                      <span className={css.nome}>{l.nome}</span>
                      <span className={css.cpf}>
                        <span className="visualmente-oculto">CPF </span>
                        {mascararCpf(l.cpf)}
                      </span>
                    </td>
                    <td>
                      <Placa placa={l.placa} tamanho="sm" />
                    </td>
                    <td>{l.vaga}</td>
                    <td className={css.numero}>{formatarMoeda(l.mensalidade)}</td>
                    <td>
                      {formatarData(l.vencimento)}
                      {l.situacao === 'vencida' && <span className={css.prazo}>{descreverPrazo(l.vencimento)}</span>}
                    </td>
                    <td>
                      <SeloSituacao situacao={l.situacao} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visiveis.length === 0 && (
              <div className={css.vazio}>
                <p>{busca ? `Nenhum mensalista encontrado para "${busca}".` : 'Nenhum contrato nesta situação.'}</p>
                <Botao
                  tamanho="sm"
                  onClick={() => {
                    setBusca('');
                    setFiltro('todos');
                  }}
                >
                  Limpar busca e filtros
                </Botao>
              </div>
            )}
          </div>
        )}

        <details className={css.legenda}>
          <summary>O que significa cada situação</summary>
          <dl>
            {(['em-dia', 'vencida'] as const).map((s) => (
              <div key={s}>
                <dt>
                  <SeloSituacao situacao={s} />
                </dt>
                <dd>{SITUACOES[s].explicacao}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Painel>

      <DialogoNovoContrato
        aberto={criando}
        aoFechar={() => setCriando(false)}
        aoSalvar={(c) => {
          setCriando(false);
          notificar(`Contrato de ${c.nome} salvo. Primeiro vencimento em ${formatarData(c.vencimento)}.`);
          void contratos.recarregar();
        }}
      />
    </>
  );
}
