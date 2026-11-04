// Tela 6 — Minhas faturas (mensalista): fatura em aberto com 2ª via e faturas pagas com recibo

const contrato = CONTRATOS[0]; // Ana Souza
const aberta = FATURAS.find((f) => !f.pagaEm);
const pagas = FATURAS.filter((f) => f.pagaEm);

$('#contrato').innerHTML = htmlDados([
  { termo: 'Contrato nº', valor: contrato.id },
  { termo: 'Placa', valor: htmlPlaca(contrato.placa, true) },
  { termo: 'Vaga fixa', valor: contrato.vaga },
  { termo: 'Vencimento', valor: 'Todo dia ' + contrato.vencimento.getDate() },
]);

// ---------- Fatura em aberto

const vencida = diasEntre(aberta.vencimento, new Date()) > 0;
$('#titulo-aberta').textContent = 'Fatura de ' + mesAno(aberta.referencia);
$('#selo-aberta').innerHTML = htmlSituacao(vencida ? 'vencida' : 'a-vencer');
$('#valor-aberta').textContent = moeda(aberta.valor);
$('#prazo-aberta').textContent = 'Vencimento em ' + data(aberta.vencimento) + ', ' + descreverPrazo(aberta.vencimento) + '.';
if (vencida) $('#prazo-aberta').className = 'texto-problema';

$('#botao-2via').addEventListener('click', async (e) => {
  carregando(e.target, 'Gerando 2ª via…');
  await esperar(1400);
  e.target.hidden = true;
  // Código fictício, só para o protótipo
  $('#codigo').textContent = '34191.79001 01043.510047 91020.150008 1 ' + String(aberta.valor).padStart(14, '0');
  $('#segunda-via').hidden = false;
  $('#botao-copiar').focus();
});

$('#botao-copiar').addEventListener('click', async (e) => {
  try {
    await navigator.clipboard.writeText($('#codigo').textContent.replace(/\D/g, ''));
    e.target.textContent = '✓ Código copiado';
  } catch {
    e.target.textContent = 'Selecione o código e copie';
  }
});

// ---------- Faturas pagas

$('#pagas').innerHTML = pagas.map((f, i) =>
  '<li><b>' + mesAno(f.referencia) + '</b><span>' + moeda(f.valor) + '</span>' +
  '<span>' + htmlSituacao('paga') + ' <span class="apagado">em ' + data(f.pagaEm) + '</span></span>' +
  '<button type="button" class="botao botao-pequeno" data-indice="' + i + '">Ver recibo</button></li>'
).join('');

$('#pagas').addEventListener('click', (e) => {
  const botao = e.target.closest('button');
  if (!botao) return;
  const f = pagas[botao.dataset.indice];
  $('#recibo-dados').innerHTML = htmlDados([
    { termo: 'Referente a', valor: mesAno(f.referencia) },
    { termo: 'Contrato nº', valor: contrato.id },
    { termo: 'Vencimento', valor: data(f.vencimento) },
    { termo: 'Pago em', valor: data(f.pagaEm) },
    { termo: 'Valor pago', valor: moeda(f.valor), total: true },
  ]);
  $('#dialogo-recibo').showModal();
});

$('#fechar-recibo').addEventListener('click', () => $('#dialogo-recibo').close());

// ---------- Contato

$('#contato').innerHTML = 'Fale com o ' + CONTATO.nome + ':<br>' +
  '<a href="tel:1134567890">' + CONTATO.telefone + '</a><br>' +
  '<a href="mailto:' + CONTATO.email + '">' + CONTATO.email + '</a><br>' + CONTATO.horario + '.';
