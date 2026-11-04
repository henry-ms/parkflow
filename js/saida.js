// Tela 4 — Registrar saída: localiza o veículo, explica o valor e confirma o pagamento

const campoBusca = $('#busca');
let veiculo = null; // veículo selecionado
let saidaEm = null; // horário fixado no momento da consulta: o valor não muda enquanto o cliente paga

// ---------- Etapa 1: busca e lista do pátio

function mostrarLista() {
  const termo = normalizarPlaca(campoBusca.value);
  const lista = PATIO.filter((v) => !termo || v.placa.includes(termo) || v.ticket.includes(termo));

  $('#contagem').textContent = lista.length === 0
    ? 'Nenhum veículo no pátio corresponde ao que foi digitado.'
    : lista.length + (lista.length === 1 ? ' veículo' : ' veículos') + (termo ? ' com "' + termo + '"' : ' no pátio') + '. Toque para registrar a saída.';

  $('#lista-patio').innerHTML = lista.map((v) =>
    '<li><button type="button" class="item-patio" data-placa="' + v.placa + '">' +
    htmlPlaca(v.placa, true) + '<strong>Vaga ' + v.vaga + '</strong>' +
    '<span class="pequeno">' + (v.mensalista ? 'Mensalista' : 'Ticket ' + v.ticket) +
    ', entrou às ' + hora(v.entrada) + ' (há ' + duracao(minutosEntre(v.entrada, new Date())) + ')</span>' +
    '</button></li>'
  ).join('');
}

campoBusca.addEventListener('input', () => {
  $('#aviso-busca').innerHTML = '';
  limparErro(campoBusca);
  mostrarLista();
});

$('#lista-patio').addEventListener('click', (e) => {
  const item = e.target.closest('.item-patio');
  if (item) selecionar(PATIO.find((v) => v.placa === item.dataset.placa));
});

$('#form-busca').addEventListener('submit', (e) => {
  e.preventDefault();
  buscar(campoBusca.value);
});

function buscar(texto) {
  const termo = normalizarPlaca(texto);
  if (!termo) {
    mostrarErro(campoBusca, 'Digite a placa ou o número do ticket.');
    return campoBusca.focus();
  }
  const encontrado = PATIO.find((v) => v.placa === termo || v.ticket === termo.padStart(4, '0'));
  if (!encontrado) {
    const qual = /^\d+$/.test(termo) ? 'o ticket nº ' + termo : 'a placa ' + formatarPlaca(termo);
    $('#aviso-busca').innerHTML = htmlAviso('problema', 'Nenhum veículo no pátio com ' + qual + '.',
      'Confira os caracteres com a placa do veículo ou o número impresso no ticket. Se o cliente perdeu o ticket, busque pela placa. ' +
      'Se o veículo não tem entrada registrada, registre a entrada antes.',
      '<a href="entrada.html" class="botao botao-pequeno">Registrar uma entrada</a>');
    return;
  }
  selecionar(encontrado);
}

// ---------- Etapa 2: cobrança

function selecionar(v) {
  veiculo = v;
  saidaEm = new Date();
  $('#ticket-perdido').checked = false;
  $('#etapa-busca').hidden = true;
  $('#etapa-cobranca').hidden = false;

  $('#estadia-placa').innerHTML = htmlPlaca(v.placa) + htmlSelo('neutro', 'No pátio');
  $('#estadia-dados').innerHTML = htmlDados([
    { termo: 'Ticket nº', valor: v.ticket },
    { termo: 'Vaga', valor: v.vaga },
    { termo: 'Veículo', valor: TARIFAS[v.tipo].nome + (v.modelo ? ', ' + escapar(v.modelo) : '') },
    { termo: 'Entrada', valor: dataHora(v.entrada) },
    { termo: 'Saída', valor: dataHora(saidaEm) },
    { termo: 'Permanência', valor: duracao(minutosEntre(v.entrada, saidaEm)), total: true },
  ]);

  // Mensalista não paga avulso
  $('#calculo').hidden = !!v.mensalista;
  $('#caixa-perdido').hidden = !!v.mensalista;
  mostrarCobranca();
}

function calculoAtual() {
  return calcularTarifa(veiculo.tipo, veiculo.entrada, saidaEm, $('#ticket-perdido').checked);
}

function mostrarCobranca() {
  if (veiculo.mensalista) return mostrarMensalista();

  const calculo = calculoAtual();
  $('#titulo-pagamento').textContent = 'Total a pagar';
  $('#regra-tarifa').textContent = 'Tarifa de ' + TARIFAS[veiculo.tipo].nome.toLowerCase() + ': ' + descreverTarifa(veiculo.tipo) + '.';
  $('#calculo-linhas').innerHTML = calculo.linhas.map((l) =>
    '<tr><th>' + l.descricao + (l.detalhe ? '<span class="pequeno">' + l.detalhe + '</span>' : '') + '</th>' +
    '<td>' + (l.valor < 0 ? '− ' + moeda(-l.valor) : moeda(l.valor)) + '</td></tr>'
  ).join('');
  $('#calculo-total').textContent = moeda(calculo.total);

  if (calculo.total === 0) {
    $('#pagamento').innerHTML =
      '<p class="valor-grande">' + moeda(0) + '</p>' +
      '<p class="dica">Sem cobrança: a permanência ficou dentro da tolerância.</p>' +
      '<button type="button" class="botao botao-primario botao-grande botao-largo" id="botao-pagar">Registrar saída</button>';
  } else {
    $('#pagamento').innerHTML =
      '<p class="valor-grande" id="total">' + moeda(calculo.total) + '</p>' +
      '<div id="aviso-pagamento"></div>' +
      '<div class="campo"><label for="forma">Forma de pagamento</label>' +
      '<select id="forma"><option value="" disabled selected>Selecione</option>' +
      '<option value="dinheiro">Dinheiro</option><option value="debito">Cartão de débito</option>' +
      '<option value="credito">Cartão de crédito</option><option value="pix">Pix</option></select></div>' +
      '<div id="caixa-dinheiro" class="empilhado" hidden>' +
      '<div class="campo"><label for="recebido">Valor recebido (R$)</label><input id="recebido" inputmode="decimal" placeholder="0,00"></div>' +
      '<p class="troco"><span>Troco</span><strong id="troco">–</strong></p></div>' +
      '<button type="button" class="botao botao-primario botao-grande botao-largo" id="botao-pagar">Confirmar pagamento</button>';

    $('#forma').addEventListener('change', (e) => {
      limparErro(e.target);
      $('#aviso-pagamento').innerHTML = '';
      $('#caixa-dinheiro').hidden = e.target.value !== 'dinheiro';
    });
    $('#recebido').addEventListener('input', atualizarTroco);
  }
  $('#botao-pagar').addEventListener('click', conferir);
}

function mostrarMensalista() {
  const contrato = CONTRATOS.find((c) => c.placa === veiculo.placa);
  const situacao = situacaoContrato(contrato);
  $('#titulo-pagamento').textContent = 'Saída de mensalista';
  $('#pagamento').innerHTML =
    '<p><strong>' + contrato.nome + '</strong>, contrato nº ' + contrato.id + '</p>' +
    htmlSituacao(situacao) +
    (situacao === 'vencida'
      ? htmlAviso('problema', 'Mensalidade vencida em ' + data(contrato.vencimento) + '.', 'A saída não é bloqueada. Avise o cliente para regularizar com a gerência.')
      : '<p class="dica">Contrato em dia. Não há cobrança avulsa.</p>') +
    '<button type="button" class="botao botao-primario botao-grande botao-largo" id="botao-pagar">Registrar saída</button>';
  $('#botao-pagar').addEventListener('click', conferir);
}

$('#ticket-perdido').addEventListener('change', mostrarCobranca);

function atualizarTroco() {
  const campo = $('#recebido');
  campo.value = campo.value.replace(/[^\d,]/g, '');
  limparErro(campo);
  const recebido = lerMoeda(campo.value);
  const total = calculoAtual().total;
  $('#troco').textContent = recebido !== null && recebido >= total ? moeda(recebido - total) : '–';
}

// Valida e abre a conferência
function conferir() {
  const total = veiculo.mensalista ? 0 : calculoAtual().total;
  const itens = [
    { termo: 'Placa', valor: formatarPlaca(veiculo.placa) },
    { termo: 'Vaga a liberar', valor: veiculo.vaga },
    { termo: 'Permanência', valor: duracao(minutosEntre(veiculo.entrada, saidaEm)) },
  ];

  if (total > 0) {
    const forma = $('#forma');
    if (!forma.value) {
      mostrarErro(forma, 'Escolha a forma de pagamento.');
      return forma.focus();
    }
    itens.push({ termo: 'Forma de pagamento', valor: forma.options[forma.selectedIndex].text });

    if (forma.value === 'dinheiro') {
      const campo = $('#recebido');
      const recebido = lerMoeda(campo.value);
      if (recebido === null) {
        mostrarErro(campo, 'Informe quanto o cliente entregou.');
        return campo.focus();
      }
      if (recebido < total) {
        mostrarErro(campo, 'O valor recebido é menor que o total. Faltam ' + moeda(total - recebido) + '.');
        return campo.focus();
      }
      itens.push({ termo: 'Valor recebido', valor: moeda(recebido) }, { termo: 'Troco', valor: moeda(recebido - total) });
    }
  }

  itens.push({ termo: 'Total', valor: moeda(total), total: true });
  $('#conferir-texto').textContent = 'Depois de confirmar, a vaga ' + veiculo.vaga + ' é liberada e a saída não pode ser desfeita pelo caixa.';
  $('#conferir-dados').innerHTML = htmlDados(itens);
  $('#dialogo-conferir').showModal();
}

$('#corrigir').addEventListener('click', () => $('#dialogo-conferir').close());

$('#confirmar').addEventListener('click', async () => {
  $('#dialogo-conferir').close();
  const total = veiculo.mensalista ? 0 : calculoAtual().total;
  const forma = total > 0 ? $('#forma').value : null;
  const recebido = forma === 'dinheiro' ? lerMoeda($('#recebido').value) : null;

  // Cartão e Pix dependem de confirmação externa: o operador vê que está esperando
  const mensagens = {
    debito: 'Peça ao cliente para aproximar ou inserir o cartão na maquininha.',
    credito: 'Peça ao cliente para aproximar ou inserir o cartão na maquininha.',
    pix: 'Mostre o QR Code da maquininha ao cliente. A confirmação chega sozinha.',
  };
  const externo = forma && forma !== 'dinheiro';
  $('#pagamento').innerHTML =
    '<div role="status"><p><span class="girando" aria-hidden="true"></span> <strong>' +
    (externo ? 'Aguardando confirmação do pagamento…' : 'Registrando saída…') + '</strong></p>' +
    (externo ? '<p class="dica">' + mensagens[forma] + '</p>' : '') +
    '<p class="valor-grande">' + moeda(total) + '</p></div>';
  await esperar(externo ? 2400 : 700);

  // Veículo de demonstração: o cartão é recusado
  if (veiculo.placa === 'QRS2E45' && (forma === 'credito' || forma === 'debito')) {
    mostrarCobranca();
    $('#forma').value = forma;
    $('#aviso-pagamento').innerHTML = htmlAviso('problema', 'Pagamento recusado pela operadora do cartão.',
      'Nada foi cobrado. Peça outra forma de pagamento ou tente o cartão de novo.');
    return;
  }

  PATIO.splice(PATIO.indexOf(veiculo), 1);
  mostrarConcluida(total, forma, recebido);
});

// ---------- Etapa 3: concluída

function mostrarConcluida(total, forma, recebido) {
  $('#etapa-cobranca').hidden = true;
  $('#etapa-concluida').hidden = false;
  $('#concluida-titulo').textContent = total > 0 ? 'Pagamento confirmado' : 'Saída registrada';
  $('#concluida-vaga').textContent = 'Vaga ' + veiculo.vaga + ' liberada.';
  $('#concluida-placa').innerHTML = htmlPlaca(veiculo.placa);
  $('#concluida-troco').innerHTML = recebido > total
    ? '<p class="faixa-status" style="font-size: 1.2rem">Entregue o troco: <strong>' + moeda(recebido - total) + '</strong></p>'
    : '';
  const nomesFormas = { dinheiro: 'Dinheiro', debito: 'Cartão de débito', credito: 'Cartão de crédito', pix: 'Pix' };
  $('#concluida-dados').innerHTML = htmlDados([
    { termo: 'Saída', valor: dataHora(saidaEm) },
    { termo: 'Forma', valor: veiculo.mensalista ? 'Mensalista' : forma ? nomesFormas[forma] : 'Sem cobrança' },
    { termo: 'Total', valor: moeda(total), total: true },
  ]);
  $('#nova-saida').focus();
}

function voltarParaBusca() {
  $('#etapa-cobranca').hidden = true;
  $('#etapa-concluida').hidden = true;
  $('#etapa-busca').hidden = false;
  campoBusca.value = '';
  mostrarLista();
  campoBusca.focus();
}

$('#voltar-busca').addEventListener('click', voltarParaBusca);
$('#nova-saida').addEventListener('click', voltarParaBusca);

// ---------- Início

mostrarLista();

// Vindo do aviso de placa duplicada na entrada (saida.html?placa=ABC1D23)
const placaNaUrl = new URLSearchParams(location.search).get('placa');
if (placaNaUrl) buscar(placaNaUrl);
