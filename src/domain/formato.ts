const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const horaSegundos = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const mesAno = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

type DataEntrada = Date | string;

/**
 * "AAAA-MM-DD" vira data local. `new Date('2026-11-10')` seria meia-noite UTC,
 * que no fuso de Brasília cai no dia anterior.
 */
function paraData(d: DataEntrada): Date {
  if (typeof d !== 'string') return d;
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  return soData ? new Date(Number(soData[1]), Number(soData[2]) - 1, Number(soData[3])) : new Date(d);
}

/** Valores monetários trafegam em centavos para evitar erro de ponto flutuante. */
export const formatarMoeda = (centavos: number) => moeda.format(centavos / 100);

/** dd/mm/aaaa */
export const formatarData = (d: DataEntrada) => data.format(paraData(d));
/** hh:mm */
export const formatarHora = (d: DataEntrada) => hora.format(paraData(d));
export const formatarHoraSegundos = (d: DataEntrada) => horaSegundos.format(paraData(d));
/** dd/mm/aaaa hh:mm — formato padrão de data e hora em todo o sistema. */
export const formatarDataHora = (d: DataEntrada) => `${formatarData(d)} ${formatarHora(d)}`;

export function formatarDiaSemana(d: DataEntrada): string {
  const nome = diaSemana.format(paraData(d));
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

/** "2026-10" → "Outubro de 2026" */
export function formatarCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split('-').map(Number);
  const texto = mesAno.format(new Date(ano, mes - 1, 1));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** 168 → "2h 48min" */
export function formatarDuracao(minutos: number): string {
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  const min = minutos % 60;
  const partes: string[] = [];
  if (dias) partes.push(`${dias}d`);
  if (horas) partes.push(`${horas}h`);
  if (min || partes.length === 0) partes.push(`${min}min`);
  return partes.join(' ');
}

export function minutosEntre(inicio: DataEntrada, fim: DataEntrada): number {
  return Math.max(0, Math.floor((paraData(fim).getTime() - paraData(inicio).getTime()) / 60000));
}

/** Diferença em dias de calendário (fim − início), ignorando o horário. */
export function diasEntre(inicio: DataEntrada, fim: DataEntrada): number {
  const a = paraData(inicio);
  const b = paraData(fim);
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / 86400000);
}

/** "12345" → 12345 centavos a partir de texto digitado como "123,45" ou "123". */
export function lerMoeda(texto: string): number | null {
  const limpo = texto.replace(/[^\d,]/g, '');
  if (!limpo) return null;
  const [inteiro, decimal = ''] = limpo.split(',');
  const centavos = Number(inteiro || '0') * 100 + Number(decimal.padEnd(2, '0').slice(0, 2));
  return Number.isFinite(centavos) ? centavos : null;
}

/** Exibe só os dígitos centrais do CPF (LGPD: minimização em telas de listagem). */
export function mascararCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : cpf;
}

export function formatarCpfDigitado(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function cpfValido(cpf: string): boolean {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const digito = (fatia: number) => {
    let soma = 0;
    for (let i = 0; i < fatia; i++) soma += Number(d[i]) * (fatia + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}
