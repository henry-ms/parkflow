// =========================================================
// Regras do negócio e formatação (usadas por todas as telas)
// Valores em dinheiro ficam em centavos para evitar erro de arredondamento.
// =========================================================

// ---------- Placa

// Remove hífen e espaços, deixa maiúscula e limita a 7 caracteres
function normalizarPlaca(texto) {
  return texto.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

// Retorna null se a placa estiver certa, ou a mensagem de erro
function validarPlaca(texto) {
  const placa = normalizarPlaca(texto);
  if (placa.length === 0) return 'Informe a placa do veículo.';
  if (placa.length < 7) {
    const faltam = 7 - placa.length;
    return 'A placa tem 7 caracteres. ' + (faltam === 1 ? 'Falta 1.' : 'Faltam ' + faltam + '.');
  }
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/; // ABC1D23
  const antiga = /^[A-Z]{3}[0-9]{4}$/; // ABC1234
  if (!mercosul.test(placa) && !antiga.test(placa)) {
    return 'Formato não reconhecido. Use 3 letras e 4 caracteres, como ABC1D23 ou ABC-1234.';
  }
  return null;
}

// Placa antiga é exibida com hífen; Mercosul, sem
function formatarPlaca(placa) {
  return /^[A-Z]{3}[0-9]{4}$/.test(placa) ? placa.slice(0, 3) + '-' + placa.slice(3) : placa;
}

// ---------- Tarifa

const TOLERANCIA_MIN = 10;
const TAXA_TICKET_PERDIDO = 2000;

const TARIFAS = {
  carro: { nome: 'Carro', primeiraHora: 800, fracao: 300, diaria: 4500 },
  moto: { nome: 'Moto', primeiraHora: 500, fracao: 200, diaria: 2500 },
  utilitario: { nome: 'Utilitário', primeiraHora: 1000, fracao: 400, diaria: 5500 },
};

function descreverTarifa(tipo) {
  const t = TARIFAS[tipo];
  return moeda(t.primeiraHora) + ' a 1ª hora + ' + moeda(t.fracao) +
    ' a cada 30 min ou fração, até ' + moeda(t.diaria) + ' por dia';
}

// Devolve cada parcela do cálculo, para o operador mostrar ao cliente de onde veio o total
function calcularTarifa(tipo, entrada, saida, ticketPerdido) {
  const t = TARIFAS[tipo];
  const minutos = minutosEntre(entrada, saida);
  const linhas = [];

  if (minutos <= TOLERANCIA_MIN) {
    linhas.push({ descricao: 'Tolerância de ' + TOLERANCIA_MIN + ' min', detalhe: 'Permanência curta, sem cobrança', valor: 0 });
  } else {
    const dias = Math.floor(minutos / 1440);
    const resto = minutos % 1440;

    if (dias > 0) {
      linhas.push({
        descricao: dias === 1 ? '1 diária completa' : dias + ' diárias completas',
        detalhe: dias + ' × ' + moeda(t.diaria),
        valor: dias * t.diaria,
      });
    }

    if (resto > TOLERANCIA_MIN || dias === 0) {
      const excedente = Math.max(0, resto - 60);
      const fracoes = Math.ceil(excedente / 30);
      const bruto = t.primeiraHora + fracoes * t.fracao;

      linhas.push({ descricao: (dias > 0 ? 'Último dia: ' : '') + '1ª hora', valor: t.primeiraHora });
      if (fracoes > 0) {
        linhas.push({
          descricao: fracoes + (fracoes === 1 ? ' fração' : ' frações') + ' de 30 min',
          detalhe: 'Excedente de ' + duracao(excedente) + ', fração iniciada conta inteira: ' + fracoes + ' × ' + moeda(t.fracao),
          valor: fracoes * t.fracao,
        });
      }
      if (bruto > t.diaria) {
        linhas.push({ descricao: 'Limite da diária', detalhe: 'O dia não passa de ' + moeda(t.diaria), valor: t.diaria - bruto });
      }
    }
  }

  if (ticketPerdido) {
    linhas.push({ descricao: 'Ticket perdido', detalhe: 'Taxa fixa', valor: TAXA_TICKET_PERDIDO });
  }

  const total = linhas.reduce((soma, l) => soma + l.valor, 0);
  return { minutos, linhas, total };
}

// ---------- Situação (vocabulário único: Em dia, A vencer, Vencida, Paga)
// Cor: verde = regular, vermelho = problema, neutro = rotina

const SITUACOES = {
  'em-dia': { texto: 'Em dia', tom: 'regular' },
  'a-vencer': { texto: 'A vencer', tom: 'neutro' },
  vencida: { texto: 'Vencida', tom: 'problema' },
  paga: { texto: 'Paga', tom: 'regular' },
};

function situacaoContrato(contrato) {
  return diasEntre(contrato.vencimento, new Date()) > 0 ? 'vencida' : 'em-dia';
}

// "faltam 6 dias", "vence hoje", "vencida há 3 dias"
function descreverPrazo(vencimento) {
  const dias = diasEntre(new Date(), vencimento);
  if (dias === 0) return 'vence hoje';
  if (dias === 1) return 'vence amanhã';
  if (dias > 1) return 'faltam ' + dias + ' dias';
  return -dias === 1 ? 'vencida há 1 dia' : 'vencida há ' + -dias + ' dias';
}

// ---------- Formatação (datas sempre dd/mm/aaaa hh:mm)

function moeda(centavos) {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function data(d) {
  return d.toLocaleDateString('pt-BR');
}

function hora(d) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function dataHora(d) {
  return data(d) + ' ' + hora(d);
}

function duracao(minutos) {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h >= 24) return Math.floor(h / 24) + 'd ' + (h % 24) + 'h ' + m + 'min';
  if (h > 0) return m > 0 ? h + 'h ' + m + 'min' : h + 'h';
  return m + 'min';
}

function minutosEntre(inicio, fim) {
  return Math.max(0, Math.floor((fim - inicio) / 60000));
}

// Diferença em dias de calendário, ignorando o horário
function diasEntre(inicio, fim) {
  const a = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const b = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  return Math.round((b - a) / 86400000);
}

// "Novembro de 2026"
function mesAno(d) {
  const texto = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Lê "50" ou "20,50" digitado pelo operador e devolve centavos
function lerMoeda(texto) {
  const limpo = texto.replace(/[^\d,]/g, '');
  if (!limpo) return null;
  const partes = limpo.split(',');
  return Number(partes[0] || 0) * 100 + Number((partes[1] || '').padEnd(2, '0').slice(0, 2));
}

// Lista de mensalistas mostra só os dígitos do meio do CPF (LGPD)
function mascararCpf(cpf) {
  const d = cpf.replace(/\D/g, '');
  return '***.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-**';
}
