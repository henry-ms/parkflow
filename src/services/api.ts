/**
 * Contrato da API usado pelas telas. Nesta versão, as respostas vêm da base em
 * memória com latência simulada; trocar por chamadas HTTP não muda as telas.
 */
import { calcularTarifa } from '../domain/tarifa';
import { situacaoContrato } from '../domain/situacao';
import type {
  Contrato, Estadia, Fatura, FormaPagamento, Movimentacao, Perfil, SetorId, TipoVeiculo, Usuario, Vaga,
} from '../domain/tipos';
import { SETORES } from '../domain/catalogo';
import * as banco from './banco';

export type CodigoErro =
  | 'credenciais'
  | 'placa-duplicada'
  | 'vaga-ocupada'
  | 'setor-lotado'
  | 'nao-encontrado'
  | 'pagamento-recusado'
  | 'contrato-duplicado'
  | 'conexao';

export class ErroApi extends Error {
  constructor(public codigo: CodigoErro, mensagem: string, public dados?: unknown) {
    super(mensagem);
  }
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latencia = () => esperar(250 + Math.random() * 450);

function exigirConexao() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ErroApi('conexao', 'Sem conexão com o servidor. Verifique a rede e tente novamente.');
  }
}

async function chamada<T>(fn: () => T, ms?: number): Promise<T> {
  exigirConexao();
  await (ms ? esperar(ms) : latencia());
  // Cópia profunda: as telas nunca alteram a base por referência.
  return structuredClone(fn());
}

// ---------------------------------------------------------------- autenticação

export interface Sessao extends Usuario {
  contratoId?: string;
}

const CONTAS: { identificadores: string[]; senha: string; sessao: Sessao }[] = [
  { identificadores: ['operador01'], senha: 'parkflow', sessao: { id: 'u-op-01', nome: 'Rafael Antunes', perfil: 'operador' } },
  { identificadores: ['gerente01'], senha: 'parkflow', sessao: { id: 'u-ge-01', nome: 'Márcia Lopes', perfil: 'gerente' } },
  {
    identificadores: [banco.CPF_MENSALISTA_DEMO, 'ana.souza@email.com', 'ana.souza'],
    senha: 'parkflow',
    sessao: { id: 'u-me-2041', nome: 'Ana Souza', perfil: 'mensalista', contratoId: '2041' },
  },
];

export function autenticar(identificador: string, senha: string): Promise<Sessao> {
  return chamada(() => {
    const id = identificador.trim().toLowerCase();
    const soDigitos = id.replace(/[.\-\s]/g, '');
    const conta = CONTAS.find(
      (c) => c.senha === senha && c.identificadores.some((i) => i === id || (/^\d{11}$/.test(soDigitos) && i === soDigitos)),
    );
    if (!conta) throw new ErroApi('credenciais', 'Usuário ou senha incorretos.');
    return conta.sessao;
  }, 700);
}

export function solicitarRecuperacaoSenha(_identificador: string): Promise<void> {
  // A resposta é a mesma exista ou não a conta, para não revelar cadastros.
  return chamada(() => undefined, 800);
}

export const HOME_DO_PERFIL: Record<Perfil, string> = {
  operador: '/operador',
  gerente: '/gerente/mensalistas',
  mensalista: '/mensalista/faturas',
};

// ---------------------------------------------------------------- turno

export interface Caixa {
  aberto: boolean;
  desde: string;
}

export function obterCaixa(): Promise<Caixa> {
  return chamada(() => ({ aberto: true, desde: banco.inicioTurno.toISOString() }), 150);
}

export interface OcupacaoSetor {
  setor: SetorId;
  nome: string;
  livres: number;
  total: number;
}

export interface ResumoTurno {
  atualizadoEm: string;
  inicioTurno: string;
  vagasLivres: number;
  vagasAvulsos: number;
  vagasMensalistas: number;
  noPatio: number;
  mensalistasNoPatio: number;
  recebido: number;
  saidasCobradas: number;
  ocupacao: OcupacaoSetor[];
  movimentacoes: Movimentacao[];
}

const disponivelAvulso = (v: Vaga) => !v.ocupada && !v.reservadaMensalista;

function calcularOcupacao(): OcupacaoSetor[] {
  return SETORES.map((s) => {
    const doSetor = banco.vagas.filter((v) => v.setor === s.id && !v.reservadaMensalista);
    return { setor: s.id, nome: s.nome, total: doSetor.length, livres: doSetor.filter((v) => !v.ocupada).length };
  });
}

export function ocupacaoPorSetor(): Promise<OcupacaoSetor[]> {
  return chamada(calcularOcupacao, 200);
}

export function obterResumoTurno(): Promise<ResumoTurno> {
  return chamada(() => {
    const avulsas = banco.vagas.filter((v) => !v.reservadaMensalista);
    const saidas = banco.movimentacoes.filter((m) => m.evento === 'saida');
    return {
      atualizadoEm: new Date().toISOString(),
      inicioTurno: banco.inicioTurno.toISOString(),
      vagasLivres: avulsas.filter((v) => !v.ocupada).length,
      vagasAvulsos: avulsas.length,
      vagasMensalistas: banco.vagas.length - avulsas.length,
      noPatio: banco.estadias.length,
      mensalistasNoPatio: banco.estadias.filter((e) => e.mensalista).length,
      recebido: saidas.reduce((s, m) => s + (m.valor ?? 0), 0),
      saidasCobradas: saidas.filter((m) => (m.valor ?? 0) > 0).length,
      ocupacao: calcularOcupacao(),
      movimentacoes: banco.movimentacoes.slice(0, 8),
    };
  });
}

// ---------------------------------------------------------------- entrada

export function listarVagas(setor: SetorId): Promise<Vaga[]> {
  return chamada(() => banco.vagas.filter((v) => v.setor === setor && !v.reservadaMensalista), 200);
}

/** Primeira vaga livre do setor, na ordem física (mais próxima da cancela). */
export function sugerirVaga(setor: SetorId): Promise<Vaga | null> {
  return chamada(() => banco.vagas.find((v) => v.setor === setor && disponivelAvulso(v)) ?? null, 200);
}

export function veiculoNoPatio(placa: string): Promise<Estadia | null> {
  return chamada(() => banco.estadias.find((e) => e.placa === placa) ?? null, 200);
}

export interface NovaEntrada {
  placa: string;
  tipo: TipoVeiculo;
  modeloCor?: string;
  vaga: string;
}

export function registrarEntrada(dados: NovaEntrada): Promise<Estadia> {
  return chamada(() => {
    const presente = banco.estadias.find((e) => e.placa === dados.placa);
    if (presente) throw new ErroApi('placa-duplicada', 'Veículo já está no pátio.', presente);
    const v = banco.vagas.find((x) => x.codigo === dados.vaga);
    if (!v || !disponivelAvulso(v)) throw new ErroApi('vaga-ocupada', 'A vaga escolhida foi ocupada.');
    const estadia: Estadia = {
      ticket: banco.ticketSeguinte(),
      placa: dados.placa,
      tipo: dados.tipo,
      modeloCor: dados.modeloCor || undefined,
      vaga: v.codigo,
      entrada: new Date().toISOString(),
      mensalista: false,
    };
    v.ocupada = true;
    banco.estadias.push(estadia);
    banco.movimentacoes.unshift({ id: `E${estadia.ticket}`, horario: estadia.entrada, placa: estadia.placa, evento: 'entrada', vaga: v.codigo });
    return estadia;
  }, 600);
}

export function imprimirTicket(_ticket: string): Promise<void> {
  return chamada(() => undefined, 1200);
}

/** Correção permitida enquanto o veículo não saiu. */
export function corrigirPlaca(ticket: string, placa: string): Promise<Estadia> {
  return chamada(() => {
    const outra = banco.estadias.find((e) => e.placa === placa && e.ticket !== ticket);
    if (outra) throw new ErroApi('placa-duplicada', 'Veículo já está no pátio.', outra);
    const e = banco.estadias.find((x) => x.ticket === ticket);
    if (!e) throw new ErroApi('nao-encontrado', 'Entrada não encontrada.');
    e.placa = placa;
    const mov = banco.movimentacoes.find((m) => m.id === `E${ticket}`);
    if (mov) mov.placa = placa;
    return e;
  });
}

export function cancelarEntrada(ticket: string): Promise<void> {
  return chamada(() => {
    const i = banco.estadias.findIndex((x) => x.ticket === ticket);
    if (i < 0) throw new ErroApi('nao-encontrado', 'Entrada não encontrada.');
    const [e] = banco.estadias.splice(i, 1);
    banco.vagas.find((v) => v.codigo === e.vaga)!.ocupada = false;
    const m = banco.movimentacoes.findIndex((x) => x.id === `E${ticket}`);
    if (m >= 0) banco.movimentacoes.splice(m, 1);
  });
}

// ---------------------------------------------------------------- saída

export function listarNoPatio(): Promise<Estadia[]> {
  return chamada(() => [...banco.estadias].sort((a, b) => b.entrada.localeCompare(a.entrada)));
}

/** Aceita placa (com ou sem hífen) ou número do ticket, digitado ou lido por leitor. */
export function buscarEstadia(termo: string): Promise<Estadia> {
  return chamada(() => {
    const t = termo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const ticket = t.replace(/^0+/, '');
    const e = banco.estadias.find((x) => x.placa === t || (/^\d+$/.test(t) && x.ticket.replace(/^0+/, '') === ticket));
    if (!e) throw new ErroApi('nao-encontrado', 'Nenhum veículo no pátio com esse dado.');
    return e;
  });
}

export function contratoDaPlaca(placa: string): Promise<(Contrato & { vencida: boolean }) | null> {
  return chamada(() => {
    const c = banco.contratos.find((x) => x.placa === placa);
    return c ? { ...c, vencida: situacaoContrato(c) === 'vencida' } : null;
  }, 150);
}

export interface Pagamento {
  ticket: string;
  forma: FormaPagamento | 'mensalista';
  ticketPerdido: boolean;
  /** Centavos; só para dinheiro. */
  valorRecebido?: number;
}

export interface Recibo {
  numero: string;
  total: number;
  troco: number;
  vagaLiberada: string;
  saida: string;
}

export function registrarSaida(p: Pagamento): Promise<Recibo> {
  // Cartão e Pix dependem de confirmação externa e demoram mais.
  const espera = p.forma === 'dinheiro' || p.forma === 'mensalista' ? 700 : 2400;
  return chamada(() => {
    const i = banco.estadias.findIndex((x) => x.ticket === p.ticket);
    if (i < 0) throw new ErroApi('nao-encontrado', 'O veículo não está mais no pátio.');
    const e = banco.estadias[i];
    // Veículo de demonstração para o fluxo de cartão recusado.
    if (e.placa === 'QRS2E45' && (p.forma === 'credito' || p.forma === 'debito')) {
      throw new ErroApi('pagamento-recusado', 'A operadora do cartão recusou o pagamento.');
    }
    const saida = new Date();
    const total = e.mensalista ? 0 : calcularTarifa(e.tipo, e.entrada, saida, { ticketPerdido: p.ticketPerdido }).total;
    banco.estadias.splice(i, 1);
    const v = banco.vagas.find((x) => x.codigo === e.vaga)!;
    v.ocupada = false;
    banco.movimentacoes.unshift({ id: `S${e.ticket}`, horario: saida.toISOString(), placa: e.placa, evento: 'saida', vaga: e.vaga, valor: e.mensalista ? undefined : total });
    return {
      numero: `R${e.ticket}`,
      total,
      troco: p.valorRecebido ? Math.max(0, p.valorRecebido - total) : 0,
      vagaLiberada: e.vaga,
      saida: saida.toISOString(),
    };
  }, espera);
}

// ---------------------------------------------------------------- mensalistas

export function listarContratos(): Promise<Contrato[]> {
  return chamada(() => banco.contratos);
}

export function vagasParaContrato(tipo: TipoVeiculo): Promise<Vaga[]> {
  const setores = SETORES.filter((s) => s.tipos.includes(tipo)).map((s) => s.id);
  return chamada(() => banco.vagas.filter((v) => setores.includes(v.setor) && disponivelAvulso(v)), 200);
}

export const mensalidadePadrao = (tipo: TipoVeiculo) => banco.MENSALIDADE_PADRAO[tipo];

export type NovoContrato = Omit<Contrato, 'id' | 'vencimento'>;

export function criarContrato(dados: NovoContrato): Promise<Contrato> {
  return chamada(() => {
    if (banco.contratos.some((c) => c.placa === dados.placa)) {
      throw new ErroApi('contrato-duplicado', 'Já existe um contrato para essa placa.');
    }
    const v = banco.vagas.find((x) => x.codigo === dados.vaga);
    if (!v || !disponivelAvulso(v)) throw new ErroApi('vaga-ocupada', 'A vaga escolhida não está mais livre.');
    v.reservadaMensalista = true;
    const hoje = new Date();
    const venc = new Date(hoje.getFullYear(), hoje.getMonth(), dados.diaVencimento);
    if (venc <= hoje) venc.setMonth(venc.getMonth() + 1);
    const contrato: Contrato = {
      ...dados,
      id: String(2041 + banco.contratos.length),
      vencimento: banco.dataIso(venc),
    };
    banco.contratos.push(contrato);
    banco.placasUsadas.add(contrato.placa);
    return contrato;
  }, 900);
}

// ---------------------------------------------------------------- área do mensalista

export interface PainelMensalista {
  contrato: Contrato;
  faturas: Fatura[];
  contato: { nome: string; telefone: string; email: string; horario: string };
}

export function obterPainelMensalista(contratoId: string): Promise<PainelMensalista> {
  return chamada(() => {
    const contrato = banco.contratos.find((c) => c.id === contratoId);
    if (!contrato) throw new ErroApi('nao-encontrado', 'Contrato não encontrado.');
    return {
      contrato,
      faturas: banco.faturasMensalista,
      contato: {
        nome: 'Estacionamento Central',
        telefone: '(11) 3456-7890',
        email: 'atendimento@estacionamentocentral.com.br',
        horario: 'Segunda a sábado, das 7h às 20h',
      },
    };
  });
}

export interface SegundaVia {
  linhaDigitavel: string;
  validaAte: string;
}

export function gerarSegundaVia(fatura: Fatura): Promise<SegundaVia> {
  return chamada(() => ({
    // Código fictício, gerado só para o protótipo.
    linhaDigitavel: `34191.79001 01043.510047 91020.150008 1 ${fatura.vencimento.replace(/-/g, '').slice(2)}${String(fatura.valor).padStart(10, '0')}`,
    validaAte: fatura.vencimento,
  }), 1400);
}
