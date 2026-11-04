import { Link } from 'react-router-dom';
import { AtualizadoEm } from '../../components/AtualizadoEm';
import { Aviso } from '../../components/Aviso';
import { Botao, classeBotao } from '../../components/Botao';
import { Esqueleto } from '../../components/Carregando';
import { CabecalhoPagina, Painel } from '../../components/Pagina';
import { Placa } from '../../components/Placa';
import { SeloEvento } from '../../components/Selo';
import { formatarData, formatarDiaSemana, formatarHora, formatarHoraSegundos, formatarMoeda } from '../../domain/formato';
import { useAssincrono } from '../../hooks/useAssincrono';
import { useAtualizacaoPeriodica } from '../../hooks/utilitarios';
import { obterResumoTurno, type ResumoTurno } from '../../services/api';
import css from './Inicio.module.css';

const INTERVALO_SEGUNDOS = 30;

export default function PaginaInicio() {
  const resumo = useAssincrono(obterResumoTurno);
  useAtualizacaoPeriodica(resumo.recarregar, INTERVALO_SEGUNDOS * 1000);
  const { dados, erro, carregando } = resumo;

  return (
    <>
      <CabecalhoPagina
        titulo="Visão do turno"
        descricao={
          dados ? (
            <>
              {formatarDiaSemana(dados.inicioTurno)}, {formatarData(dados.inicioTurno)}. Turno iniciado às {formatarHora(dados.inicioTurno)}.
            </>
          ) : (
            <Esqueleto largura="18rem" />
          )
        }
        acoes={
          <>
            <AtualizadoEm em={dados?.atualizadoEm} atualizando={carregando} aoAtualizar={resumo.recarregar} intervaloSegundos={INTERVALO_SEGUNDOS} />
            <Link to="/operador/saida" className={classeBotao('secundario')}>
              Registrar saída
            </Link>
            <Link to="/operador/entrada" className={classeBotao('primario')}>
              Registrar entrada
            </Link>
          </>
        }
      />

      {erro && (
        <div className={css.aviso}>
          <Aviso
            tom="problema"
            titulo={dados ? 'Não foi possível atualizar o resumo.' : 'Não foi possível carregar o resumo do turno.'}
            acoes={
              <Botao variante="secundario" tamanho="sm" onClick={resumo.recarregar}>
                Tentar novamente
              </Botao>
            }
          >
            {dados
              ? `Os números abaixo são de ${formatarHoraSegundos(dados.atualizadoEm)}. ${erro.message}`
              : `${erro.message} As operações de entrada e saída continuam disponíveis no menu.`}
          </Aviso>
        </div>
      )}

      {dados ? <Indicadores resumo={dados} /> : !erro && <IndicadoresCarregando />}
      {dados ? <UltimasMovimentacoes resumo={dados} /> : !erro && <Esqueleto altura="18rem" />}
    </>
  );
}

function Indicadores({ resumo }: { resumo: ResumoTurno }) {
  const avulsosNoPatio = resumo.noPatio - resumo.mensalistasNoPatio;
  return (
    <section className={css.indicadores} aria-labelledby="titulo-indicadores">
      <h2 id="titulo-indicadores" className="visualmente-oculto">
        Indicadores do turno
      </h2>

      <div className={`${css.indicador} ${css.clicavel}`}>
        <Link to="/operador/entrada" className={css.link}>
          <span className={css.rotulo}>Vagas livres</span>
          <span className={css.valor}>{resumo.vagasLivres}</span>
          <span className={css.complemento}>de {resumo.vagasAvulsos} vagas para avulsos</span>
        </Link>
        <ul className={css.setores} aria-label="Vagas livres por setor">
          {resumo.ocupacao.map((s) => {
            const lotado = s.livres === 0;
            return (
              <li key={s.setor}>
                <span className={css.setorNome}>
                  Setor {s.setor}, {s.nome.toLowerCase()}
                </span>
                <span className={lotado ? css.lotado : undefined}>{lotado ? 'Lotado' : `${s.livres} livres`}</span>
                {/* A barra mede o mesmo que o texto ao lado: a parte livre do setor. */}
                <span className={`${css.barra} ${lotado ? css.barraLotada : ''}`} aria-hidden="true">
                  <span style={{ width: `${(s.livres / s.total) * 100}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`${css.indicador} ${css.clicavel}`}>
        <Link to="/operador/saida" className={css.link}>
          <span className={css.rotulo}>Veículos no pátio</span>
          <span className={css.valor}>{resumo.noPatio}</span>
          <span className={css.complemento}>
            {avulsosNoPatio} avulsos e {resumo.mensalistasNoPatio} mensalistas
          </span>
        </Link>
        <p className={css.nota}>{resumo.vagasMensalistas} vagas fixas de mensalistas não entram na conta de vagas livres.</p>
      </div>

      <div className={css.indicador}>
        <span className={css.rotulo}>Recebido no turno</span>
        <span className={css.valor}>{formatarMoeda(resumo.recebido)}</span>
        <span className={css.complemento}>em {resumo.saidasCobradas} saídas cobradas</span>
      </div>
    </section>
  );
}

function IndicadoresCarregando() {
  return (
    <div className={css.indicadores} role="status" aria-label="Carregando indicadores">
      {[0, 1, 2].map((i) => (
        <div key={i} className={css.indicador}>
          <Esqueleto largura="8rem" />
          <Esqueleto altura="2.5rem" largura="6rem" />
          <Esqueleto largura="10rem" />
        </div>
      ))}
    </div>
  );
}

function UltimasMovimentacoes({ resumo }: { resumo: ResumoTurno }) {
  return (
    <Painel titulo="Últimas movimentações" idTitulo="titulo-movimentacoes">
      {resumo.movimentacoes.length === 0 ? (
        <p className={css.vazio}>Nenhuma movimentação neste turno ainda. Entradas e saídas aparecem aqui assim que forem registradas.</p>
      ) : (
        <div className={css.rolagem} role="region" aria-labelledby="titulo-movimentacoes" tabIndex={0}>
          <table className={css.tabela}>
            <thead>
              <tr>
                <th scope="col">Horário</th>
                <th scope="col">Placa</th>
                <th scope="col">Movimento</th>
                <th scope="col">Vaga</th>
                <th scope="col" className={css.numero}>
                  Valor
                </th>
              </tr>
            </thead>
            <tbody>
              {resumo.movimentacoes.map((m) => (
                <tr key={m.id}>
                  <td>
                    <time dateTime={m.horario}>{formatarHora(m.horario)}</time>
                  </td>
                  <td>
                    <Placa placa={m.placa} tamanho="sm" />
                  </td>
                  <td>
                    <SeloEvento evento={m.evento} />
                  </td>
                  <td>{m.vaga}</td>
                  <td className={css.numero}>
                    {m.valor !== undefined ? (
                      formatarMoeda(m.valor)
                    ) : m.evento === 'saida' ? (
                      <span className={css.semValor}>Mensalista</span>
                    ) : (
                      <span className={css.semValor}>
                        <span aria-hidden="true">–</span>
                        <span className="visualmente-oculto">sem cobrança na entrada</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Painel>
  );
}
