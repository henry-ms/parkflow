/**
 * Base em memória para o protótipo. Todos os dados são fictícios e gerados
 * em relação ao horário atual, para que datas, permanências e vencimentos
 * sejam coerentes entre si em qualquer dia em que o protótipo for aberto.
 */
import { calcularTarifa } from '../domain/tarifa';
import type { Contrato, Estadia, Fatura, Movimentacao, SetorId, TipoVeiculo, Vaga } from '../domain/tipos';

function geradorAleatorio(semente: number) {
  return () => {
    semente |= 0;
    semente = (semente + 0x6d2b79f5) | 0;
    let t = Math.imul(semente ^ (semente >>> 15), 1 | semente);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const aleatorio = geradorAleatorio(2026);
const inteiro = (min: number, max: number) => Math.floor(aleatorio() * (max - min + 1)) + min;
const escolher = <T,>(lista: readonly T[]) => lista[inteiro(0, lista.length - 1)];

const LETRAS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const placasUsadas = new Set<string>();
function novaPlaca(): string {
  let placa: string;
  do {
    placa =
      escolher([...LETRAS]) + escolher([...LETRAS]) + escolher([...LETRAS]) +
      inteiro(0, 9) + escolher([...LETRAS]) + inteiro(0, 9) + inteiro(0, 9);
  } while (placasUsadas.has(placa));
  placasUsadas.add(placa);
  return placa;
}

function cpfFicticio(): string {
  const base = Array.from({ length: 9 }, () => inteiro(0, 9));
  const digito = (nums: number[]) => {
    const soma = nums.reduce((s, n, i) => s + n * (nums.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(base);
  const d2 = digito([...base, d1]);
  return [...base, d1, d2].join('');
}

const agora = new Date();
const minutosAtras = (min: number) => new Date(agora.getTime() - min * 60000).toISOString();

function dataIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Próxima data com o dia de vencimento informado, a partir de hoje (inclusive). */
function proximoVencimento(dia: number): Date {
  const d = new Date(agora.getFullYear(), agora.getMonth(), dia);
  if (dia < agora.getDate()) d.setMonth(d.getMonth() + 1);
  return d;
}

export const inicioTurno: Date = (() => {
  const seis = new Date(agora);
  seis.setHours(6, 0, 0, 0);
  if (agora.getTime() - seis.getTime() >= 30 * 60000) return seis;
  const recente = new Date(agora.getTime() - 60 * 60000);
  recente.setMinutes(0, 0, 0);
  return recente;
})();

// ---------------------------------------------------------------- vagas

const QUANTIDADE: Record<SetorId, number> = { A: 60, B: 50, M: 20 };
export const vagas: Vaga[] = (Object.keys(QUANTIDADE) as SetorId[]).flatMap((setor) =>
  Array.from({ length: QUANTIDADE[setor] }, (_, i) => ({
    codigo: `${setor}-${String(i + 1).padStart(2, '0')}`,
    setor,
    ocupada: false,
    reservadaMensalista: false,
  })),
);
const vaga = (codigo: string) => vagas.find((v) => v.codigo === codigo)!;

// ---------------------------------------------------------------- contratos

const PESSOAS: { nome: string; tipo: TipoVeiculo; vaga: string; dia: number; atrasoDias?: number }[] = [
  { nome: 'Ana Souza', tipo: 'carro', vaga: 'A-03', dia: 10 },
  { nome: 'Bruno Lima', tipo: 'carro', vaga: 'A-01', dia: 5, atrasoDias: 5 },
  { nome: 'Carla Dias', tipo: 'utilitario', vaga: 'A-02', dia: 15 },
  { nome: 'Diego Melo', tipo: 'carro', vaga: 'A-04', dia: 20 },
  { nome: 'Elisa Rocha', tipo: 'carro', vaga: 'A-05', dia: 10 },
  { nome: 'Fábio Nunes', tipo: 'moto', vaga: 'M-01', dia: 5 },
  { nome: 'Gabriela Pires', tipo: 'carro', vaga: 'A-06', dia: 15 },
  { nome: 'Heitor Campos', tipo: 'utilitario', vaga: 'B-01', dia: 20 },
  { nome: 'Isabela Torres', tipo: 'carro', vaga: 'A-07', dia: 10 },
  { nome: 'João Ribeiro', tipo: 'carro', vaga: 'B-02', dia: 5 },
  { nome: 'Karina Alves', tipo: 'moto', vaga: 'M-02', dia: 15 },
  { nome: 'Leandro Freitas', tipo: 'carro', vaga: 'B-03', dia: 20, atrasoDias: 12 },
  { nome: 'Marina Costa', tipo: 'carro', vaga: 'A-08', dia: 10 },
  { nome: 'Nelson Prado', tipo: 'utilitario', vaga: 'B-04', dia: 15 },
  { nome: 'Otávio Reis', tipo: 'carro', vaga: 'B-05', dia: 5 },
  { nome: 'Paula Martins', tipo: 'carro', vaga: 'B-06', dia: 20, atrasoDias: 2 },
];

export const MENSALIDADE_PADRAO: Record<TipoVeiculo, number> = { carro: 28000, moto: 15000, utilitario: 33000 };

/** Ana Souza é a mensalista usada no login de demonstração. */
export const CPF_MENSALISTA_DEMO = '12345678909';
placasUsadas.add('RTA4B17');

export const contratos: Contrato[] = PESSOAS.map((p, i) => {
  const vencimento = p.atrasoDias
    ? new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - p.atrasoDias)
    : proximoVencimento(p.dia);
  vaga(p.vaga).reservadaMensalista = true;
  return {
    id: String(2041 + i),
    nome: p.nome,
    cpf: i === 0 ? CPF_MENSALISTA_DEMO : cpfFicticio(),
    placa: i === 0 ? 'RTA4B17' : novaPlaca(),
    tipo: p.tipo,
    vaga: p.vaga,
    mensalidade: MENSALIDADE_PADRAO[p.tipo],
    diaVencimento: p.atrasoDias ? vencimento.getDate() : p.dia,
    vencimento: dataIso(vencimento),
  };
});

/** Faturas da mensalista de demonstração: uma a vencer e três pagas. */
export const faturasMensalista: Fatura[] = (() => {
  const c = contratos[0];
  const [ano, mes] = c.vencimento.split('-').map(Number);
  const aberta = new Date(ano, mes - 1, c.diaVencimento);
  return Array.from({ length: 4 }, (_, i) => {
    const venc = new Date(aberta.getFullYear(), aberta.getMonth() - i, c.diaVencimento);
    const competencia = `${venc.getFullYear()}-${String(venc.getMonth() + 1).padStart(2, '0')}`;
    const pagaEm = i === 0 ? undefined : dataIso(new Date(venc.getFullYear(), venc.getMonth(), venc.getDate() - inteiro(1, 3)));
    return { id: `F-${competencia}`, competencia, valor: c.mensalidade, vencimento: dataIso(venc), pagaEm };
  });
})();

// ---------------------------------------------------------------- pátio

let proximoTicket = 345;
const novoTicket = () => {
  if (proximoTicket === 428) proximoTicket++;
  return String(proximoTicket++).padStart(4, '0');
};

export const estadias: Estadia[] = [];

function estacionar(e: Omit<Estadia, 'ticket'> & { ticket?: string }) {
  vaga(e.vaga).ocupada = true;
  placasUsadas.add(e.placa);
  estadias.push({ ...e, ticket: e.ticket ?? novoTicket() });
}

// Veículos de exemplo citados na documentação e úteis para demonstrar cada regra.
estacionar({ placa: 'ABC1D23', tipo: 'carro', modeloCor: 'Gol prata', vaga: 'A-12', entrada: minutosAtras(168), mensalista: false, ticket: '0428' });
estacionar({ placa: 'QRS2E45', tipo: 'carro', modeloCor: 'Onix branco', vaga: 'A-27', entrada: minutosAtras(95), mensalista: false });
estacionar({ placa: 'MTO3F21', tipo: 'moto', modeloCor: 'CG 160 vermelha', vaga: 'M-04', entrada: minutosAtras(41), mensalista: false });
estacionar({ placa: 'KLM4G56', tipo: 'carro', modeloCor: 'HB20 preto', vaga: 'B-18', entrada: minutosAtras(6), mensalista: false });
estacionar({ placa: 'DEF5H67', tipo: 'utilitario', modeloCor: 'Hilux cinza', vaga: 'A-40', entrada: minutosAtras(26 * 60 + 15), mensalista: false });

// 12 mensalistas presentes (todos menos quatro).
contratos
  .filter((_, i) => ![3, 7, 10, 14].includes(i))
  .forEach((c) => estacionar({ placa: c.placa, tipo: c.tipo, vaga: c.vaga, entrada: minutosAtras(inteiro(30, 420)), mensalista: true }));

const MODELOS: Record<TipoVeiculo, string[]> = {
  carro: ['Onix prata', 'HB20 branco', 'Argo vermelho', 'Corolla preto', 'Kwid branco', 'Polo cinza', 'Mobi azul', 'Civic prata'],
  moto: ['CG 160 preta', 'Biz azul', 'Fazer 250 branca', 'PCX cinza'],
  utilitario: ['Compass preto', 'Strada branca', 'Toro cinza', 'Creta prata'],
};

const ALVO_AVULSOS: Record<SetorId, number> = { A: 36, B: 21, M: 9 };
(Object.keys(ALVO_AVULSOS) as SetorId[]).forEach((setor) => {
  const livres = vagas.filter((v) => v.setor === setor && !v.ocupada && !v.reservadaMensalista);
  for (let i = 0; i < ALVO_AVULSOS[setor]; i++) {
    const v = livres.splice(inteiro(0, livres.length - 1), 1)[0];
    const tipo: TipoVeiculo = setor === 'M' ? 'moto' : aleatorio() < 0.2 ? 'utilitario' : 'carro';
    estacionar({ placa: novaPlaca(), tipo, modeloCor: escolher(MODELOS[tipo]), vaga: v.codigo, entrada: minutosAtras(inteiro(15, 480)), mensalista: false });
  }
});

// ---------------------------------------------------------------- movimentações do turno

export const movimentacoes: Movimentacao[] = (() => {
  const lista: Movimentacao[] = [];
  const janela = Math.max(1, Math.floor((agora.getTime() - inicioTurno.getTime()) / 60000));

  estadias
    .filter((e) => new Date(e.entrada) >= inicioTurno)
    .forEach((e) => lista.push({ id: `E${e.ticket}`, horario: e.entrada, placa: e.placa, evento: 'entrada', vaga: e.vaga }));

  const saidas = Math.min(30, Math.floor(janela / 10));
  for (let i = 0; i < saidas; i++) {
    const horario = new Date(inicioTurno.getTime() + inteiro(5, janela - 1) * 60000);
    const permanencia = inteiro(25, 240);
    const tipo: TipoVeiculo = aleatorio() < 0.15 ? 'moto' : 'carro';
    const { total } = calcularTarifa(tipo, new Date(horario.getTime() - permanencia * 60000), horario);
    lista.push({
      id: `S${i}`,
      horario: horario.toISOString(),
      placa: novaPlaca(),
      evento: 'saida',
      vaga: `${tipo === 'moto' ? 'M' : escolher(['A', 'B'])}-${String(inteiro(9, 50)).padStart(2, '0')}`,
      valor: total,
    });
  }
  return lista.sort((a, b) => b.horario.localeCompare(a.horario));
})();

export const ticketSeguinte = novoTicket;
export { dataIso, placasUsadas };
