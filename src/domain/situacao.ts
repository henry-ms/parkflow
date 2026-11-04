import { diasEntre } from './formato';
import type { Contrato, Fatura, Situacao } from './tipos';

/** Regra única de cor: verde = regular, vermelho = problema, neutro = rotina. */
export type Tom = 'regular' | 'problema' | 'neutro';

export const SITUACOES: Record<Situacao, { rotulo: string; tom: Tom; explicacao: string }> = {
  'em-dia': { rotulo: 'Em dia', tom: 'regular', explicacao: 'Mensalidades pagas até o último vencimento.' },
  'a-vencer': { rotulo: 'A vencer', tom: 'neutro', explicacao: 'Fatura emitida e ainda dentro do prazo de pagamento.' },
  vencida: { rotulo: 'Vencida', tom: 'problema', explicacao: 'O vencimento passou e o pagamento não foi identificado.' },
  paga: { rotulo: 'Paga', tom: 'regular', explicacao: 'Pagamento confirmado. O recibo fica disponível.' },
};

export function situacaoContrato(c: Contrato, hoje = new Date()): Situacao {
  return diasEntre(c.vencimento, hoje) > 0 ? 'vencida' : 'em-dia';
}

export function situacaoFatura(f: Fatura, hoje = new Date()): Situacao {
  if (f.pagaEm) return 'paga';
  return diasEntre(f.vencimento, hoje) > 0 ? 'vencida' : 'a-vencer';
}

/** Texto de apoio para prazos: "vence hoje", "faltam 6 dias", "vencida há 3 dias". */
export function descreverPrazo(vencimento: string, hoje = new Date()): string {
  const dias = diasEntre(hoje, vencimento);
  if (dias === 0) return 'vence hoje';
  if (dias > 0) return dias === 1 ? 'vence amanhã' : `faltam ${dias} dias`;
  const atraso = -dias;
  return atraso === 1 ? 'vencida há 1 dia' : `vencida há ${atraso} dias`;
}
