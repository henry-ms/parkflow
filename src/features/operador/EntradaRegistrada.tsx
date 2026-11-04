import { useCallback, useEffect, useRef, useState } from 'react';
import { Botao } from '../../components/Botao';
import { Carregando } from '../../components/Carregando';
import { Campo } from '../../components/Campo';
import { Dialogo } from '../../components/Dialogo';
import { IconeConfirmado, IconeImpressora, IconeProblema } from '../../components/Icones';
import { ListaDados } from '../../components/ListaDados';
import { useNotificar } from '../../components/Notificacoes';
import { Painel } from '../../components/Pagina';
import { EntradaPlaca, Placa } from '../../components/Placa';
import { rotuloTipo } from '../../domain/catalogo';
import { formatarDataHora } from '../../domain/formato';
import { formatarPlaca, validarPlaca } from '../../domain/placa';
import type { Estadia } from '../../domain/tipos';
import { cancelarEntrada, corrigirPlaca, ErroApi, imprimirTicket } from '../../services/api';
import css from './Entrada.module.css';

interface Props {
  estadia: Estadia;
  aoAtualizar: (e: Estadia) => void;
  aoNovaEntrada: () => void;
}

type Impressao = 'imprimindo' | 'impresso' | 'falhou';

export function EntradaRegistrada({ estadia, aoAtualizar, aoNovaEntrada }: Props) {
  const notificar = useNotificar();
  const [impressao, setImpressao] = useState<Impressao>('imprimindo');
  const [corrigindo, setCorrigindo] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const refNova = useRef<HTMLButtonElement>(null);

  const imprimir = useCallback(() => {
    setImpressao('imprimindo');
    imprimirTicket(estadia.ticket).then(
      () => setImpressao('impresso'),
      () => setImpressao('falhou'),
    );
  }, [estadia.ticket]);

  useEffect(imprimir, [imprimir]);
  useEffect(() => {
    if (impressao === 'impresso') refNova.current?.focus();
  }, [impressao]);

  return (
    <div className={css.registrada}>
      <Painel destaque className={css.ticket}>
        <div className={css.confirmacao} role="status">
          <IconeConfirmado tamanho={28} className={css.iconeOk} />
          <h2>Entrada registrada</h2>
        </div>

        <div className={css.ticketPlaca}>
          <Placa placa={estadia.placa} tamanho="md" />
        </div>

        <ListaDados
          colunas={2}
          dados={[
            { termo: 'Ticket nº', valor: estadia.ticket },
            { termo: 'Vaga', valor: estadia.vaga },
            { termo: 'Entrada', valor: formatarDataHora(estadia.entrada) },
            { termo: 'Veículo', valor: [rotuloTipo(estadia.tipo), estadia.modeloCor].filter(Boolean).join(', ') },
          ]}
        />

        <div className={css.impressao} role="status" aria-live="polite">
          {impressao === 'imprimindo' && (
            <p>
              <Carregando /> Imprimindo ticket…
            </p>
          )}
          {impressao === 'impresso' && (
            <>
              <p>
                <IconeConfirmado className={css.iconeOk} /> Ticket impresso. Entregue ao motorista.
              </p>
              <Botao tamanho="sm" icone={<IconeImpressora tamanho={16} />} onClick={imprimir}>
                Reimprimir ticket
              </Botao>
            </>
          )}
          {impressao === 'falhou' && (
            <>
              <p className={css.falhaImpressao}>
                <IconeProblema /> A impressora não respondeu. Confira se está ligada e com papel.
              </p>
              <Botao tamanho="sm" icone={<IconeImpressora tamanho={16} />} onClick={imprimir}>
                Tentar novamente
              </Botao>
            </>
          )}
        </div>

        <div className={css.acoesTicket}>
          <Botao ref={refNova} variante="primario" tamanho="lg" onClick={aoNovaEntrada}>
            Registrar nova entrada
          </Botao>
          <Botao onClick={() => setCorrigindo(true)}>Corrigir placa</Botao>
          <Botao variante="discreto" onClick={() => setCancelando(true)}>
            Cancelar esta entrada
          </Botao>
        </div>
      </Painel>

      <DialogoCorrigirPlaca
        aberto={corrigindo}
        estadia={estadia}
        aoFechar={() => setCorrigindo(false)}
        aoCorrigir={(nova) => {
          setCorrigindo(false);
          aoAtualizar(nova);
          notificar(`Placa corrigida para ${formatarPlaca(nova.placa)}. Reimprimindo o ticket.`);
          setImpressao('imprimindo');
          imprimirTicket(nova.ticket).then(() => setImpressao('impresso'), () => setImpressao('falhou'));
        }}
      />

      <DialogoCancelarEntrada
        aberto={cancelando}
        estadia={estadia}
        aoFechar={() => setCancelando(false)}
        aoCancelar={() => {
          setCancelando(false);
          notificar(`Entrada cancelada. A vaga ${estadia.vaga} está livre de novo.`, 'neutro');
          aoNovaEntrada();
        }}
      />
    </div>
  );
}

function DialogoCorrigirPlaca({ aberto, estadia, aoFechar, aoCorrigir }: { aberto: boolean; estadia: Estadia; aoFechar: () => void; aoCorrigir: (e: Estadia) => void }) {
  const [placa, setPlaca] = useState(estadia.placa);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setPlaca(estadia.placa);
      setErro(null);
    }
  }, [aberto, estadia.placa]);

  async function salvar() {
    const r = validarPlaca(placa);
    if (!r.valida) return setErro(r.mensagem);
    if (r.placa === estadia.placa) return setErro('A placa é a mesma já registrada. Altere os caracteres que estão errados.');
    setSalvando(true);
    try {
      aoCorrigir(await corrigirPlaca(estadia.ticket, r.placa));
    } catch (e) {
      setErro(
        e instanceof ErroApi && e.codigo === 'placa-duplicada'
          ? `${formatarPlaca(r.placa)} já está no pátio, na vaga ${(e.dados as Estadia).vaga}. Confira a placa.`
          : (e as Error).message,
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Corrigir placa"
      largura="sm"
      bloquearFechamento={salvando}
      descricao={`Ticket nº ${estadia.ticket}, vaga ${estadia.vaga}. A correção é permitida enquanto o veículo estiver no pátio.`}
      rodape={
        <>
          <Botao onClick={aoFechar} disabled={salvando}>
            Voltar
          </Botao>
          <Botao variante="primario" onClick={salvar} carregando={salvando} textoCarregando="Salvando correção…">
            Salvar e reimprimir ticket
          </Botao>
        </>
      }
    >
      <Campo rotulo="Placa correta" erro={erro} obrigatorio>
        {(p) => (
          <EntradaPlaca
            {...p}
            autoFocus
            valor={placa}
            aoMudar={(v) => {
              setPlaca(v);
              setErro(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && void salvar()}
          />
        )}
      </Campo>
    </Dialogo>
  );
}

function DialogoCancelarEntrada({ aberto, estadia, aoFechar, aoCancelar }: { aberto: boolean; estadia: Estadia; aoFechar: () => void; aoCancelar: () => void }) {
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmar() {
    setCancelando(true);
    setErro(null);
    try {
      await cancelarEntrada(estadia.ticket);
      aoCancelar();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCancelando(false);
    }
  }

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={`Cancelar a entrada de ${formatarPlaca(estadia.placa)}?`}
      largura="sm"
      bloquearFechamento={cancelando}
      descricao={`O ticket nº ${estadia.ticket} deixa de valer e a vaga ${estadia.vaga} volta a ficar livre. Use quando a entrada foi registrada por engano.`}
      rodape={
        <>
          <Botao onClick={aoFechar} disabled={cancelando}>
            Manter a entrada
          </Botao>
          <Botao variante="perigo" onClick={confirmar} carregando={cancelando} textoCarregando="Cancelando…">
            Cancelar a entrada
          </Botao>
        </>
      }
    >
      {erro && <p className={css.falhaImpressao}>{erro}</p>}
    </Dialogo>
  );
}
