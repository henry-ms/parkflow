// =========================================================
// Dados de exemplo (fictícios). Os horários são calculados a partir
// de agora, para que permanências e vencimentos façam sentido em
// qualquer dia em que o protótipo for aberto.
// =========================================================

const AGORA = new Date();

function minutosAtras(min) {
  return new Date(AGORA.getTime() - min * 60000);
}

function diasAtras(dias) {
  return new Date(AGORA.getFullYear(), AGORA.getMonth(), AGORA.getDate() - dias);
}

// Próxima data com esse dia do mês (hoje ou depois)
function proximoDia(dia) {
  const d = new Date(AGORA.getFullYear(), AGORA.getMonth(), dia);
  if (dia < AGORA.getDate()) d.setMonth(d.getMonth() + 1);
  return d;
}

const INICIO_TURNO = new Date(AGORA.getFullYear(), AGORA.getMonth(), AGORA.getDate(), 6, 0);

// ---------- Acessos (senha de todos: parkflow)

const USUARIOS = [
  { logins: ['operador01'], nome: 'Rafael Antunes', pagina: 'inicio.html' },
  { logins: ['gerente01'], nome: 'Márcia Lopes', pagina: 'mensalistas.html' },
  { logins: ['12345678909', 'ana.souza@email.com'], nome: 'Ana Souza', pagina: 'faturas.html' },
];

// ---------- Pátio

const SETORES = [
  { id: 'A', nome: 'Coberto', vagas: 12, tipos: ['carro', 'utilitario'] },
  { id: 'B', nome: 'Descoberto', vagas: 10, tipos: ['carro', 'utilitario'] },
  { id: 'M', nome: 'Motos', vagas: 6, tipos: ['moto'] },
];

// Veículos que estão no pátio agora
const PATIO = [
  { placa: 'ABC1D23', tipo: 'carro', modelo: 'Gol prata', vaga: 'A-03', ticket: '0428', entrada: minutosAtras(168) },
  { placa: 'QRS2E45', tipo: 'carro', modelo: 'Onix branco', vaga: 'A-05', ticket: '0431', entrada: minutosAtras(95) },
  { placa: 'KLM4G56', tipo: 'carro', modelo: 'HB20 preto', vaga: 'B-02', ticket: '0440', entrada: minutosAtras(6) },
  { placa: 'MTO3F21', tipo: 'moto', modelo: 'CG 160 vermelha', vaga: 'M-01', ticket: '0436', entrada: minutosAtras(41) },
  { placa: 'DEF5H67', tipo: 'utilitario', modelo: 'Hilux cinza', vaga: 'A-08', ticket: '0402', entrada: minutosAtras(26 * 60 + 15) },
  { placa: 'FGH6J78', tipo: 'carro', modelo: 'Argo vermelho', vaga: 'A-04', ticket: '0434', entrada: minutosAtras(52) },
  { placa: 'JKL8M90', tipo: 'carro', modelo: 'Kwid branco', vaga: 'A-06', ticket: '0430', entrada: minutosAtras(130) },
  { placa: 'NOP1Q23', tipo: 'utilitario', modelo: 'Compass preto', vaga: 'A-07', ticket: '0433', entrada: minutosAtras(75) },
  { placa: 'STU4V56', tipo: 'carro', modelo: 'Polo cinza', vaga: 'B-01', ticket: '0438', entrada: minutosAtras(20) },
  { placa: 'WXY7Z89', tipo: 'carro', modelo: 'Mobi azul', vaga: 'B-03', ticket: '0426', entrada: minutosAtras(240) },
  { placa: 'GHI2K45', tipo: 'moto', modelo: 'Biz azul', vaga: 'M-02', ticket: '0439', entrada: minutosAtras(15) },
  { placa: 'RTA4B17', tipo: 'carro', modelo: 'Corolla preto', vaga: 'A-01', ticket: '-', entrada: minutosAtras(210), mensalista: true },
  { placa: 'BRU2C34', tipo: 'carro', modelo: 'Civic prata', vaga: 'A-02', ticket: '-', entrada: minutosAtras(300), mensalista: true },
];

// Últimas movimentações do turno (as mais recentes primeiro)
const MOVIMENTACOES = [
  { horario: minutosAtras(6), placa: 'KLM4G56', evento: 'entrada', vaga: 'B-02' },
  { horario: minutosAtras(11), placa: 'PQR3T21', evento: 'saida', vaga: 'B-05', valor: 1100 },
  { horario: minutosAtras(15), placa: 'GHI2K45', evento: 'entrada', vaga: 'M-02' },
  { horario: minutosAtras(20), placa: 'STU4V56', evento: 'entrada', vaga: 'B-01' },
  { horario: minutosAtras(27), placa: 'ZXC9V87', evento: 'saida', vaga: 'A-09', valor: 2000 },
  { horario: minutosAtras(41), placa: 'MTO3F21', evento: 'entrada', vaga: 'M-01' },
  { horario: minutosAtras(48), placa: 'LMN5P67', evento: 'saida', vaga: 'A-10', valor: 1400 },
  { horario: minutosAtras(52), placa: 'FGH6J78', evento: 'entrada', vaga: 'A-04' },
];

// Total recebido no turno inteiro (inclui saídas mais antigas que as da lista acima)
const RECEBIDO_TURNO = { valor: 26100, saidas: 17 };

// ---------- Mensalistas

const CONTRATOS = [
  { id: '2041', nome: 'Ana Souza', cpf: '12345678909', placa: 'RTA4B17', vaga: 'A-01', mensalidade: 28000, vencimento: proximoDia(10) },
  { id: '2042', nome: 'Bruno Lima', cpf: '38461275902', placa: 'BRU2C34', vaga: 'A-02', mensalidade: 28000, vencimento: diasAtras(5) },
  { id: '2043', nome: 'Carla Dias', cpf: '52913846071', placa: 'UGG4G68', vaga: 'B-09', mensalidade: 33000, vencimento: proximoDia(15) },
  { id: '2044', nome: 'Diego Melo', cpf: '71026394850', placa: 'SRJ0Z19', vaga: 'B-10', mensalidade: 28000, vencimento: proximoDia(20) },
  { id: '2045', nome: 'Fábio Nunes', cpf: '20937561408', placa: 'PGY8A96', vaga: 'M-06', mensalidade: 15000, vencimento: proximoDia(25) },
  { id: '2046', nome: 'Leandro Freitas', cpf: '64180253977', placa: 'DFG6S31', vaga: 'A-12', mensalidade: 28000, vencimento: diasAtras(12) },
  { id: '2047', nome: 'Marina Costa', cpf: '93572108416', placa: 'NHZ4K57', vaga: 'A-11', mensalidade: 28000, vencimento: proximoDia(10) },
  { id: '2048', nome: 'Paula Martins', cpf: '45809127363', placa: 'MNP7Y33', vaga: 'B-08', mensalidade: 28000, vencimento: diasAtras(2) },
];

// Vagas fixas de mensalistas não são sugeridas para avulsos
const VAGAS_MENSALISTAS = CONTRATOS.map((c) => c.vaga);

// ---------- Faturas da mensalista Ana Souza

const VENCIMENTO_ANA = CONTRATOS[0].vencimento;

function mesesAntes(meses, dia) {
  return new Date(VENCIMENTO_ANA.getFullYear(), VENCIMENTO_ANA.getMonth() - meses, dia);
}

const FATURAS = [
  { referencia: mesesAntes(0, 1), valor: 28000, vencimento: VENCIMENTO_ANA, pagaEm: null },
  { referencia: mesesAntes(1, 1), valor: 28000, vencimento: mesesAntes(1, 10), pagaEm: mesesAntes(1, 8) },
  { referencia: mesesAntes(2, 1), valor: 28000, vencimento: mesesAntes(2, 10), pagaEm: mesesAntes(2, 9) },
  { referencia: mesesAntes(3, 1), valor: 28000, vencimento: mesesAntes(3, 10), pagaEm: mesesAntes(3, 7) },
];

const CONTATO = {
  nome: 'Estacionamento Central',
  telefone: '(11) 3456-7890',
  email: 'atendimento@estacionamentocentral.com.br',
  horario: 'Segunda a sábado, das 7h às 20h',
};
