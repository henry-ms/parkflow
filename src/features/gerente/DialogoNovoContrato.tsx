import { useEffect, useState } from 'react';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Campo, Entrada, Selecao } from '../../components/Campo';
import { Dialogo } from '../../components/Dialogo';
import { ListaDados } from '../../components/ListaDados';
import { EntradaPlaca } from '../../components/Placa';
import { rotuloTipo, TIPOS_VEICULO } from '../../domain/catalogo';
import { cpfValido, formatarCpfDigitado, formatarMoeda, lerMoeda } from '../../domain/formato';
import { formatarPlaca, validarPlaca } from '../../domain/placa';
import type { Contrato, TipoVeiculo, Vaga } from '../../domain/tipos';
import { criarContrato, ErroApi, mensalidadePadrao, vagasParaContrato } from '../../services/api';
import css from './Mensalistas.module.css';

const DIAS_VENCIMENTO = [5, 10, 15, 20, 25];

interface Props {
  aberto: boolean;
  aoFechar: () => void;
  aoSalvar: (c: Contrato) => void;
}

type Erros = Partial<Record<'nome' | 'cpf' | 'placa' | 'vaga' | 'mensalidade' | 'geral', string>>;

const vazio = () => ({ nome: '', cpf: '', placa: '', tipo: 'carro' as TipoVeiculo, vaga: '', mensalidade: '', dia: '10' });

/** Dois passos: preencher e conferir. Nada é salvo sem a conferência. */
export function DialogoNovoContrato({ aberto, aoFechar, aoSalvar }: Props) {
  const [dados, setDados] = useState(vazio);
  const [erros, setErros] = useState<Erros>({});
  const [etapa, setEtapa] = useState<'preencher' | 'conferir'>('preencher');
  const [vagas, setVagas] = useState<Vaga[] | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setDados({ ...vazio(), mensalidade: String(mensalidadePadrao('carro') / 100) });
    setErros({});
    setEtapa('preencher');
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    setVagas(null);
    vagasParaContrato(dados.tipo).then(setVagas, () => setVagas([]));
  }, [aberto, dados.tipo]);

  const mudar = (campo: keyof ReturnType<typeof vazio>, valor: string) => {
    setDados((d) => ({ ...d, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined, geral: undefined }));
  };

  function revisar() {
    const novos: Erros = {};
    if (dados.nome.trim().split(/\s+/).length < 2) novos.nome = 'Informe nome e sobrenome do mensalista.';
    if (!dados.cpf) novos.cpf = 'Informe o CPF do mensalista.';
    else if (!cpfValido(dados.cpf)) novos.cpf = 'CPF inválido. Confira os 11 dígitos.';
    const placa = validarPlaca(dados.placa);
    if (!placa.valida) novos.placa = placa.mensagem;
    if (!dados.vaga) novos.vaga = 'Escolha a vaga fixa do contrato.';
    const valor = lerMoeda(dados.mensalidade);
    if (!valor || valor <= 0) novos.mensalidade = 'Informe o valor da mensalidade.';
    setErros(novos);
    if (Object.keys(novos).length === 0) setEtapa('conferir');
  }

  async function salvar() {
    setSalvando(true);
    try {
      const contrato = await criarContrato({
        nome: dados.nome.trim(),
        cpf: dados.cpf.replace(/\D/g, ''),
        placa: (validarPlaca(dados.placa) as { placa: string }).placa,
        tipo: dados.tipo,
        vaga: dados.vaga,
        mensalidade: lerMoeda(dados.mensalidade)!,
        diaVencimento: Number(dados.dia),
      });
      aoSalvar(contrato);
    } catch (e) {
      setEtapa('preencher');
      if (e instanceof ErroApi && e.codigo === 'contrato-duplicado') setErros({ placa: 'Já existe um contrato para essa placa. Confira a placa ou edite o contrato existente.' });
      else if (e instanceof ErroApi && e.codigo === 'vaga-ocupada') {
        setErros({ vaga: 'Essa vaga deixou de estar livre. Escolha outra.' });
        vagasParaContrato(dados.tipo).then(setVagas);
      } else setErros({ geral: (e as Error).message });
    } finally {
      setSalvando(false);
    }
  }

  const conferir = etapa === 'conferir';

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={conferir ? 'Confira o contrato' : 'Novo contrato'}
      descricao={conferir ? 'Revise os dados antes de salvar. A primeira mensalidade é gerada no próximo dia de vencimento.' : 'Todos os campos são obrigatórios.'}
      bloquearFechamento={salvando}
      rodape={
        conferir ? (
          <>
            <Botao onClick={() => setEtapa('preencher')} disabled={salvando}>
              Voltar e editar
            </Botao>
            <Botao variante="primario" onClick={salvar} carregando={salvando} textoCarregando="Salvando contrato…" autoFocus>
              Salvar contrato
            </Botao>
          </>
        ) : (
          <>
            <Botao onClick={aoFechar}>Cancelar</Botao>
            <Botao variante="primario" onClick={revisar}>
              Revisar contrato
            </Botao>
          </>
        )
      }
    >
      {erros.geral && <Aviso tom="problema" titulo={erros.geral} />}
      {conferir ? (
        <ListaDados
          dados={[
            { termo: 'Mensalista', valor: dados.nome.trim() },
            { termo: 'CPF', valor: dados.cpf },
            { termo: 'Placa', valor: formatarPlaca(dados.placa) },
            { termo: 'Veículo', valor: rotuloTipo(dados.tipo) },
            { termo: 'Vaga fixa', valor: dados.vaga },
            { termo: 'Vencimento', valor: `Todo dia ${dados.dia}` },
            { termo: 'Mensalidade', valor: formatarMoeda(lerMoeda(dados.mensalidade) ?? 0), destaque: true },
          ]}
        />
      ) : (
        <form className={css.formContrato} onSubmit={(e) => (e.preventDefault(), revisar())} noValidate>
          <Campo rotulo="Nome completo" erro={erros.nome} obrigatorio className={css.largo}>
            {(p) => <Entrada {...p} autoFocus value={dados.nome} onChange={(e) => mudar('nome', e.target.value)} autoComplete="off" />}
          </Campo>
          <Campo rotulo="CPF" erro={erros.cpf} obrigatorio>
            {(p) => <Entrada {...p} inputMode="numeric" placeholder="000.000.000-00" value={dados.cpf} onChange={(e) => mudar('cpf', formatarCpfDigitado(e.target.value))} />}
          </Campo>
          <Campo rotulo="Tipo de veículo" obrigatorio>
            {(p) => (
              <Selecao
                {...p}
                value={dados.tipo}
                onChange={(e) => {
                  const tipo = e.target.value as TipoVeiculo;
                  setDados((d) => ({ ...d, tipo, vaga: '', mensalidade: String(mensalidadePadrao(tipo) / 100) }));
                }}
              >
                {TIPOS_VEICULO.map((t) => (
                  <option key={t.valor} value={t.valor}>
                    {t.rotulo}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>
          <Campo rotulo="Placa" erro={erros.placa} obrigatorio className={css.largo}>
            {(p) => <EntradaPlaca {...p} valor={dados.placa} aoMudar={(v) => mudar('placa', v)} />}
          </Campo>
          <Campo rotulo="Vaga fixa" erro={erros.vaga} obrigatorio dica={vagas ? `${vagas.length} vagas livres para este tipo.` : 'Carregando vagas…'}>
            {(p) => (
              <Selecao {...p} textoVazio="Selecione" value={dados.vaga} onChange={(e) => mudar('vaga', e.target.value)} disabled={!vagas}>
                {vagas?.map((v) => (
                  <option key={v.codigo} value={v.codigo}>
                    {v.codigo}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>
          <Campo rotulo="Dia de vencimento" obrigatorio>
            {(p) => (
              <Selecao {...p} value={dados.dia} onChange={(e) => mudar('dia', e.target.value)}>
                {DIAS_VENCIMENTO.map((d) => (
                  <option key={d} value={d}>
                    Todo dia {d}
                  </option>
                ))}
              </Selecao>
            )}
          </Campo>
          <Campo rotulo="Mensalidade (R$)" erro={erros.mensalidade} obrigatorio dica="Preenchida com o valor padrão do tipo de veículo.">
            {(p) => <Entrada {...p} inputMode="decimal" value={dados.mensalidade} onChange={(e) => mudar('mensalidade', e.target.value.replace(/[^\d,]/g, ''))} />}
          </Campo>
          <button type="submit" hidden />
        </form>
      )}
    </Dialogo>
  );
}
