import { formatarDuracao, formatarMoeda, minutosEntre } from './formato';
import type { TipoVeiculo } from './tipos';

export interface Tarifa {
  tipo: TipoVeiculo;
  /** Todos os valores em centavos. */
  primeiraHora: number;
  fracaoMinutos: number;
  valorFracao: number;
  diariaMaxima: number;
}

export const TOLERANCIA_MINUTOS = 10;
export const TAXA_TICKET_PERDIDO = 2000;

export const TARIFAS: Record<TipoVeiculo, Tarifa> = {
  carro: { tipo: 'carro', primeiraHora: 800, fracaoMinutos: 30, valorFracao: 300, diariaMaxima: 4500 },
  moto: { tipo: 'moto', primeiraHora: 500, fracaoMinutos: 30, valorFracao: 200, diariaMaxima: 2500 },
  utilitario: { tipo: 'utilitario', primeiraHora: 1000, fracaoMinutos: 30, valorFracao: 400, diariaMaxima: 5500 },
};

export interface LinhaCalculo {
  descricao: string;
  detalhe?: string;
  /** Centavos; negativo quando é um abatimento (limite da diária). */
  valor: number;
}

export interface CalculoTarifa {
  minutos: number;
  linhas: LinhaCalculo[];
  total: number;
  resumoRegra: string;
}

export function descreverTarifa(t: Tarifa): string {
  return `${formatarMoeda(t.primeiraHora)} a 1ª hora + ${formatarMoeda(t.valorFracao)} a cada ${t.fracaoMinutos} min ou fração, até ${formatarMoeda(t.diariaMaxima)} por dia`;
}

/** Valor de um período de até 24h, sem considerar tolerância. */
function valorPeriodo(t: Tarifa, minutos: number) {
  const excedente = Math.max(0, minutos - 60);
  const fracoes = Math.ceil(excedente / t.fracaoMinutos);
  const bruto = t.primeiraHora + fracoes * t.valorFracao;
  return { excedente, fracoes, bruto, final: Math.min(bruto, t.diariaMaxima) };
}

/**
 * Calcula o valor de uma estadia avulsa e devolve cada parcela do cálculo,
 * para que operador e cliente vejam de onde veio o total.
 */
export function calcularTarifa(
  tipo: TipoVeiculo,
  entrada: Date | string,
  saida: Date | string,
  opcoes: { ticketPerdido?: boolean } = {},
): CalculoTarifa {
  const t = TARIFAS[tipo];
  const minutos = minutosEntre(entrada, saida);
  const linhas: LinhaCalculo[] = [];

  if (minutos <= TOLERANCIA_MINUTOS) {
    linhas.push({
      descricao: `Tolerância de ${TOLERANCIA_MINUTOS} min`,
      detalhe: `Permanência de ${formatarDuracao(minutos)}, sem cobrança`,
      valor: 0,
    });
  } else {
    const diasCompletos = Math.floor(minutos / 1440);
    const resto = minutos % 1440;

    if (diasCompletos > 0) {
      linhas.push({
        descricao: diasCompletos === 1 ? '1 diária completa' : `${diasCompletos} diárias completas`,
        detalhe: `${diasCompletos} × ${formatarMoeda(t.diariaMaxima)}`,
        valor: diasCompletos * t.diariaMaxima,
      });
    }

    if (resto > 0 && !(diasCompletos > 0 && resto <= TOLERANCIA_MINUTOS)) {
      const p = valorPeriodo(t, resto);
      const prefixo = diasCompletos > 0 ? 'Último dia: ' : '';
      linhas.push({ descricao: `${prefixo}1ª hora`, valor: t.primeiraHora });
      if (p.fracoes > 0) {
        linhas.push({
          descricao: `${p.fracoes} ${p.fracoes === 1 ? 'fração' : 'frações'} de ${t.fracaoMinutos} min`,
          detalhe: `Excedente de ${formatarDuracao(p.excedente)}, fração iniciada conta inteira: ${p.fracoes} × ${formatarMoeda(t.valorFracao)}`,
          valor: p.fracoes * t.valorFracao,
        });
      }
      if (p.bruto > p.final) {
        linhas.push({
          descricao: 'Limite da diária',
          detalhe: `O período não passa de ${formatarMoeda(t.diariaMaxima)}`,
          valor: p.final - p.bruto,
        });
      }
    }
  }

  if (opcoes.ticketPerdido) {
    linhas.push({ descricao: 'Ticket perdido', detalhe: 'Taxa fixa', valor: TAXA_TICKET_PERDIDO });
  }

  return {
    minutos,
    linhas,
    total: linhas.reduce((soma, l) => soma + l.valor, 0),
    resumoRegra: descreverTarifa(t),
  };
}
