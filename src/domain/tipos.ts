export type Perfil = 'operador' | 'gerente' | 'mensalista';
export type TipoVeiculo = 'carro' | 'moto' | 'utilitario';
export type FormaPagamento = 'dinheiro' | 'debito' | 'credito' | 'pix';
export type SetorId = 'A' | 'B' | 'M';

/** Vocabulário único de situação financeira, usado por contratos e faturas. */
export type Situacao = 'em-dia' | 'a-vencer' | 'vencida' | 'paga';

export type EventoPatio = 'entrada' | 'saida';

export interface Usuario {
  id: string;
  nome: string;
  perfil: Perfil;
}

export interface Setor {
  id: SetorId;
  nome: string;
  tipos: TipoVeiculo[];
}

export interface Vaga {
  codigo: string;
  setor: SetorId;
  ocupada: boolean;
  /** Vagas fixas de mensalistas nunca são sugeridas para avulsos. */
  reservadaMensalista: boolean;
}

export interface Estadia {
  ticket: string;
  placa: string;
  tipo: TipoVeiculo;
  modeloCor?: string;
  vaga: string;
  /** ISO 8601 */
  entrada: string;
  mensalista: boolean;
}

export interface Movimentacao {
  id: string;
  /** ISO 8601 */
  horario: string;
  placa: string;
  evento: EventoPatio;
  vaga: string;
  /** Centavos; só existe em saídas cobradas. */
  valor?: number;
}

export interface Contrato {
  id: string;
  nome: string;
  cpf: string;
  placa: string;
  tipo: TipoVeiculo;
  vaga: string;
  /** Centavos */
  mensalidade: number;
  diaVencimento: number;
  /** Próximo vencimento ainda não pago, ISO (data). */
  vencimento: string;
}

export interface Fatura {
  id: string;
  /** AAAA-MM */
  competencia: string;
  /** Centavos */
  valor: number;
  /** ISO (data) */
  vencimento: string;
  /** ISO (data); ausente enquanto não for paga. */
  pagaEm?: string;
}
