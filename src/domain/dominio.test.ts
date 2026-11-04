import { describe, expect, it } from 'vitest';
import { cpfValido, formatarData, formatarDiaSemana, formatarDuracao, lerMoeda } from './formato';
import { formatarPlaca, normalizarPlaca, validarPlaca } from './placa';
import { calcularTarifa } from './tarifa';

describe('placa', () => {
  it('normaliza caixa, hífen e espaços', () => {
    expect(normalizarPlaca(' abc-1d23 ')).toBe('ABC1D23');
  });

  it('aceita Mercosul e padrão antigo', () => {
    expect(validarPlaca('ABC1D23')).toEqual({ valida: true, placa: 'ABC1D23' });
    expect(validarPlaca('abc-1234')).toEqual({ valida: true, placa: 'ABC1234' });
  });

  it('explica o que falta na placa incompleta', () => {
    expect(validarPlaca('ABC1')).toEqual({ valida: false, mensagem: 'A placa tem 7 caracteres. Faltam 3.' });
  });

  it('recusa formatos inválidos', () => {
    expect(validarPlaca('1BC1D23').valida).toBe(false);
    expect(validarPlaca('ABCD123').valida).toBe(false);
  });

  it('exibe hífen só no padrão antigo', () => {
    expect(formatarPlaca('ABC1234')).toBe('ABC-1234');
    expect(formatarPlaca('ABC1D23')).toBe('ABC1D23');
  });
});

describe('calcularTarifa', () => {
  const entrada = new Date('2026-11-04T08:14:00');
  const depois = (min: number) => new Date(entrada.getTime() + min * 60000);

  it('não cobra dentro da tolerância', () => {
    expect(calcularTarifa('carro', entrada, depois(10)).total).toBe(0);
  });

  it('cobra só a 1ª hora até 60 min', () => {
    expect(calcularTarifa('carro', entrada, depois(60)).total).toBe(800);
  });

  it('conta fração iniciada como inteira (2h48min = 1ª hora + 4 frações)', () => {
    const c = calcularTarifa('carro', entrada, depois(168));
    expect(c.minutos).toBe(168);
    expect(c.total).toBe(800 + 4 * 300);
    expect(c.linhas).toHaveLength(2);
  });

  it('limita ao valor da diária', () => {
    const c = calcularTarifa('carro', entrada, depois(20 * 60));
    expect(c.total).toBe(4500);
    expect(c.linhas.at(-1)?.descricao).toBe('Limite da diária');
  });

  it('soma diárias completas e o restante', () => {
    expect(calcularTarifa('moto', entrada, depois(1440 + 90)).total).toBe(2500 + 500 + 200);
  });

  it('acrescenta a taxa de ticket perdido', () => {
    expect(calcularTarifa('carro', entrada, depois(60), { ticketPerdido: true }).total).toBe(2800);
  });
});

describe('formato', () => {
  it('11/09/2026 é sexta-feira (dado corrigido na avaliação heurística)', () => {
    expect(formatarDiaSemana(new Date(2026, 8, 11))).toBe('Sexta-feira');
  });

  it('lê datas AAAA-MM-DD no fuso local, sem voltar um dia', () => {
    expect(formatarData('2026-11-10')).toBe('10/11/2026');
  });

  it('formata duração', () => {
    expect(formatarDuracao(168)).toBe('2h 48min');
    expect(formatarDuracao(60)).toBe('1h');
    expect(formatarDuracao(5)).toBe('5min');
  });

  it('lê valores digitados em reais', () => {
    expect(lerMoeda('50')).toBe(5000);
    expect(lerMoeda('20,5')).toBe(2050);
    expect(lerMoeda('')).toBeNull();
  });

  it('valida dígitos do CPF', () => {
    expect(cpfValido('123.456.789-09')).toBe(true);
    expect(cpfValido('123.456.789-00')).toBe(false);
    expect(cpfValido('111.111.111-11')).toBe(false);
  });
});
