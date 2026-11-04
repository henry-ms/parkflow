import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Aviso } from '../../components/Aviso';
import { Botao, classeBotao } from '../../components/Botao';
import { Campo, Entrada, Selecao } from '../../components/Campo';
import { CabecalhoPagina, Painel } from '../../components/Pagina';
import { EntradaPlaca } from '../../components/Placa';
import { setoresDoTipo, TIPOS_VEICULO } from '../../domain/catalogo';
import { formatarHora } from '../../domain/formato';
import { formatarPlaca, validarPlaca } from '../../domain/placa';
import type { Estadia, SetorId, TipoVeiculo, Vaga } from '../../domain/tipos';
import { useAssincrono } from '../../hooks/useAssincrono';
import { ErroApi, ocupacaoPorSetor, registrarEntrada, sugerirVaga, veiculoNoPatio } from '../../services/api';
import { DialogoAlterarVaga } from './DialogoAlterarVaga';
import { EntradaRegistrada } from './EntradaRegistrada';
import { PainelVaga } from './PainelVaga';
import css from './Entrada.module.css';

export default function PaginaEntrada() {
  const [registrada, setRegistrada] = useState<Estadia | null>(null);
  // Remontar o formulário a cada nova entrada limpa todos os campos de uma vez.
  const [chave, setChave] = useState(0);

  return (
    <>
      <CabecalhoPagina titulo="Registrar entrada" voltar={{ para: '/operador', rotulo: 'Voltar para o início' }} />
      {registrada ? (
        <EntradaRegistrada
          estadia={registrada}
          aoAtualizar={setRegistrada}
          aoNovaEntrada={() => {
            setRegistrada(null);
            setChave((c) => c + 1);
          }}
        />
      ) : (
        <FormularioEntrada key={chave} aoRegistrar={setRegistrada} />
      )}
    </>
  );
}

type Erros = { placa?: string; setor?: string };

function FormularioEntrada({ aoRegistrar }: { aoRegistrar: (e: Estadia) => void }) {
  const navegar = useNavigate();
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState<TipoVeiculo>('carro');
  const [setor, setSetor] = useState<SetorId>('A');
  const [modeloCor, setModeloCor] = useState('');
  const [erros, setErros] = useState<Erros>({});
  const [duplicada, setDuplicada] = useState<Estadia | null>(null);
  const [vagaManual, setVagaManual] = useState<string | null>(null);
  const [escolhendoVaga, setEscolhendoVaga] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const refPlaca = useRef<HTMLInputElement>(null);

  const ocupacao = useAssincrono(ocupacaoPorSetor);
  const sugestao = useAssincrono<Vaga | null>(() => sugerirVaga(setor), [setor]);
  const vaga = vagaManual ?? sugestao.dados?.codigo ?? null;
  const setoresPermitidos = setoresDoTipo(tipo);

  useEffect(() => refPlaca.current?.focus(), []);

  // Moto só vai para o setor de motos; carro e utilitário não vão para lá.
  function mudarTipo(novo: TipoVeiculo) {
    setTipo(novo);
    const permitidos = setoresDoTipo(novo);
    if (!permitidos.some((s) => s.id === setor)) mudarSetor(permitidos[0].id);
  }

  function mudarSetor(novo: SetorId) {
    setSetor(novo);
    setVagaManual(null);
    setErros((e) => ({ ...e, setor: undefined }));
  }

  async function conferirPlaca(valor = placa): Promise<string | null> {
    const r = validarPlaca(valor);
    if (!r.valida) {
      setErros((e) => ({ ...e, placa: r.mensagem }));
      return null;
    }
    setErros((e) => ({ ...e, placa: undefined }));
    const presente = await veiculoNoPatio(r.placa).catch(() => null);
    setDuplicada(presente);
    return presente ? null : r.placa;
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setAviso(null);
    const placaValida = await conferirPlaca();
    const setorLotado = !vaga && !sugestao.carregando;
    if (setorLotado) setErros((x) => ({ ...x, setor: 'Este setor está lotado. Escolha outro setor.' }));
    if (!placaValida || !vaga) return refPlaca.current?.focus();

    setEnviando(true);
    try {
      aoRegistrar(await registrarEntrada({ placa: placaValida, tipo, modeloCor: modeloCor.trim(), vaga }));
    } catch (erro) {
      setEnviando(false);
      if (erro instanceof ErroApi && erro.codigo === 'placa-duplicada') {
        setDuplicada(erro.dados as Estadia);
      } else if (erro instanceof ErroApi && erro.codigo === 'vaga-ocupada') {
        setVagaManual(null);
        await sugestao.recarregar();
        setAviso(`A vaga ${vaga} foi ocupada por outra entrada agora há pouco. Sugerimos outra vaga ao lado; confira e confirme de novo.`);
      } else {
        setAviso((erro as Error).message);
      }
    }
  }

  return (
    <form className={css.grade} onSubmit={enviar} noValidate>
      <Painel titulo="Dados do veículo" idTitulo="titulo-dados" className={css.formulario}>
        {aviso && <Aviso tom="problema" titulo={aviso} />}

        <Campo rotulo="Placa" dica="Mercosul (ABC1D23) ou modelo antigo (ABC-1234)." erro={erros.placa} obrigatorio>
          {(p) => (
            <EntradaPlaca
              {...p}
              ref={refPlaca}
              valor={placa}
              aoMudar={(v) => {
                setPlaca(v);
                setDuplicada(null);
                // Depois de um erro, revalida a cada tecla para mostrar quando ficou certo.
                if (erros.placa) {
                  const r = validarPlaca(v);
                  setErros((x) => ({ ...x, placa: r.valida ? undefined : r.mensagem }));
                }
              }}
              onBlur={() => placa && void conferirPlaca()}
              disabled={enviando}
            />
          )}
        </Campo>

        {duplicada && (
          <Aviso
            tom="problema"
            titulo={`${formatarPlaca(duplicada.placa)} já está no pátio.`}
            acoes={
              <Link to={`/operador/saida?busca=${duplicada.placa}`} className={classeBotao('secundario', 'sm')}>
                Registrar a saída deste veículo
              </Link>
            }
          >
            Está na vaga {duplicada.vaga} desde {formatarHora(duplicada.entrada)}, ticket nº {duplicada.ticket}. Uma nova entrada só pode ser
            registrada depois da saída. Se a placa foi digitada errado, corrija o campo acima.
          </Aviso>
        )}

        <div className={css.duasColunas}>
          <Campo rotulo="Tipo de veículo" obrigatorio>
            {(p) => (
              <Selecao {...p} value={tipo} onChange={(e) => mudarTipo(e.target.value as TipoVeiculo)} disabled={enviando}>
                {TIPOS_VEICULO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>

          <Campo rotulo="Setor" erro={erros.setor} obrigatorio dica={tipo === 'moto' ? 'Motos ficam no setor M.' : undefined}>
            {(p) => (
              <Selecao {...p} value={setor} onChange={(e) => mudarSetor(e.target.value as SetorId)} disabled={enviando}>
                {setoresPermitidos.map((s) => {
                  const livres = ocupacao.dados?.find((o) => o.setor === s.id)?.livres;
                  return (
                    <option key={s.id} value={s.id}>
                      {`${s.id}, ${s.nome.toLowerCase()}`}
                      {livres === undefined ? '' : livres === 0 ? ' (lotado)' : ` (${livres} livres)`}
                    </option>
                  );
                })}
              </Selecao>
            )}
          </Campo>
        </div>

        <Campo rotulo="Modelo e cor" opcional>
          {(p) => (
            <Entrada
              {...p}
              value={modeloCor}
              onChange={(e) => setModeloCor(e.target.value)}
              placeholder="Ex.: Gol prata"
              maxLength={40}
              disabled={enviando}
            />
          )}
        </Campo>
      </Painel>

      <PainelVaga
        vaga={vaga}
        setor={setor}
        carregando={sugestao.carregando}
        manual={vagaManual !== null}
        aoAlterar={() => setEscolhendoVaga(true)}
        aoVoltarSugestao={() => setVagaManual(null)}
        desabilitado={enviando}
      />

      <div className={css.acoes}>
        <Botao onClick={() => navegar('/operador')} disabled={enviando}>
          Cancelar
        </Botao>
        <Botao type="submit" variante="primario" tamanho="lg" carregando={enviando} textoCarregando="Registrando entrada…">
          Confirmar e emitir ticket
        </Botao>
      </div>

      <DialogoAlterarVaga
        aberto={escolhendoVaga}
        setor={setor}
        atual={vaga}
        aoFechar={() => setEscolhendoVaga(false)}
        aoEscolher={(codigo) => {
          setVagaManual(codigo === sugestao.dados?.codigo ? null : codigo);
          setEscolhendoVaga(false);
        }}
      />
    </form>
  );
}
