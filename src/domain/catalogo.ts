import type { FormaPagamento, Setor, SetorId, TipoVeiculo } from './tipos';

export const TIPOS_VEICULO: { valor: TipoVeiculo; rotulo: string }[] = [
  { valor: 'carro', rotulo: 'Carro' },
  { valor: 'moto', rotulo: 'Moto' },
  { valor: 'utilitario', rotulo: 'Utilitário (SUV, picape, van)' },
];

export const FORMAS_PAGAMENTO: { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'debito', rotulo: 'Cartão de débito' },
  { valor: 'credito', rotulo: 'Cartão de crédito' },
  { valor: 'pix', rotulo: 'Pix' },
];

export const SETORES: Setor[] = [
  { id: 'A', nome: 'Coberto', tipos: ['carro', 'utilitario'] },
  { id: 'B', nome: 'Descoberto', tipos: ['carro', 'utilitario'] },
  { id: 'M', nome: 'Motos', tipos: ['moto'] },
];

export const rotuloTipo = (tipo: TipoVeiculo) =>
  TIPOS_VEICULO.find((t) => t.valor === tipo)!.rotulo.split(' (')[0];

export const rotuloForma = (forma: FormaPagamento) =>
  FORMAS_PAGAMENTO.find((f) => f.valor === forma)!.rotulo;

export function rotuloSetor(id: SetorId): string {
  const setor = SETORES.find((s) => s.id === id)!;
  return `Setor ${setor.id}, ${setor.nome.toLowerCase()}`;
}

/** Evita colocar uma moto numa vaga de carro e vice-versa. */
export const setoresDoTipo = (tipo: TipoVeiculo) => SETORES.filter((s) => s.tipos.includes(tipo));
