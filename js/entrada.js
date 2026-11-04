// Tela 3 — Registrar entrada: valida a placa, sugere uma vaga livre e emite o ticket

const campoPlaca = $('#placa');
const campoTipo = $('#tipo');
const campoSetor = $('#setor');
let vagaEscolhida = null; // null = usar a vaga sugerida
let ultimaEntrada = null;
let proximoTicket = 441;

// ---------- Vagas

function vagasDoSetor(setorId) {
  const setor = SETORES.find((s) => s.id === setorId);
  const codigos = [];
  for (let i = 1; i <= setor.vagas; i++) codigos.push(setorId + '-' + String(i).padStart(2, '0'));
  return codigos;
}

function vagasLivres(setorId) {
  const ocupadas = PATIO.map((v) => v.vaga);
  return vagasDoSetor(setorId).filter((c) => !ocupadas.includes(c) && !VAGAS_MENSALISTAS.includes(c));
}

// Setor depende do tipo: moto só vai para o setor de motos
function preencherSetores() {
  const permitidos = SETORES.filter((s) => s.tipos.includes(campoTipo.value));
  campoSetor.innerHTML = permitidos.map((s) => {
    const livres = vagasLivres(s.id).length;
    return '<option value="' + s.id + '">' + s.id + ', ' + s.nome.toLowerCase() +
      (livres === 0 ? ' (lotado)' : ' (' + livres + ' livres)') + '</option>';
  }).join('');
  vagaEscolhida = null;
  mostrarVaga();
}

function vagaAtual() {
  return vagaEscolhida || vagasLivres(campoSetor.value)[0] || null;
}

function mostrarVaga() {
  const setor = SETORES.find((s) => s.id === campoSetor.value);
  const vaga = vagaAtual();
  const caixa = $('#vaga-codigo');

  $('#titulo-vaga').textContent = vagaEscolhida ? 'Vaga escolhida' : 'Vaga sugerida';
  $('#vaga-setor').textContent = 'Setor ' + setor.id + ', ' + setor.nome.toLowerCase();

  if (vaga) {
    caixa.textContent = vaga;
    caixa.classList.remove('sem-vaga');
    $('#vaga-nota').textContent = vagaEscolhida ? 'Escolhida pelo operador.' : 'Primeira vaga livre a partir da cancela.';
    $('#botao-alterar').hidden = false;
  } else {
    caixa.textContent = 'Sem vaga livre';
    caixa.classList.add('sem-vaga');
    $('#vaga-nota').textContent = 'Este setor está lotado. Escolha outro setor no formulário.';
    $('#botao-alterar').hidden = true;
  }
  $('#caixa-escolher').hidden = true;
}

campoTipo.addEventListener('change', preencherSetores);
campoSetor.addEventListener('change', () => {
  vagaEscolhida = null;
  limparErro(campoSetor);
  mostrarVaga();
});

// "Alterar vaga" mostra só as vagas livres, então não dá para escolher uma ocupada
$('#botao-alterar').addEventListener('click', () => {
  const lista = $('#escolher-vaga');
  lista.innerHTML = vagasLivres(campoSetor.value)
    .map((c) => '<option' + (c === vagaAtual() ? ' selected' : '') + '>' + c + '</option>')
    .join('');
  $('#caixa-escolher').hidden = false;
  lista.focus();
});

$('#escolher-vaga').addEventListener('change', (e) => {
  vagaEscolhida = e.target.value;
  mostrarVaga();
});

// ---------- Placa

campoPlaca.addEventListener('input', () => {
  campoPlaca.value = normalizarPlaca(campoPlaca.value);
  $('#aviso-duplicada').innerHTML = '';
  // Depois de um erro, revalida a cada tecla para mostrar quando ficou certo
  if (campoPlaca.getAttribute('aria-invalid')) conferirPlaca();
});

campoPlaca.addEventListener('blur', () => {
  if (campoPlaca.value) conferirPlaca();
});

// Retorna true se a placa pode entrar
function conferirPlaca() {
  const erro = validarPlaca(campoPlaca.value);
  if (erro) {
    mostrarErro(campoPlaca, erro);
    return false;
  }
  limparErro(campoPlaca);

  const presente = PATIO.find((v) => v.placa === campoPlaca.value);
  if (presente) {
    $('#aviso-duplicada').innerHTML = htmlAviso('problema',
      formatarPlaca(presente.placa) + ' já está no pátio.',
      'Está na vaga ' + presente.vaga + ' desde ' + hora(presente.entrada) +
      '. Uma nova entrada só pode ser registrada depois da saída. Se a placa foi digitada errado, corrija o campo acima.',
      '<a href="saida.html?placa=' + presente.placa + '" class="botao botao-pequeno">Registrar a saída deste veículo</a>');
    return false;
  }
  return true;
}

// ---------- Confirmar

$('#form-entrada').addEventListener('submit', async (e) => {
  e.preventDefault();
  const placaOk = conferirPlaca();
  const vaga = vagaAtual();
  if (!vaga) mostrarErro(campoSetor, 'Este setor está lotado. Escolha outro setor.');
  if (!placaOk || !vaga) return campoPlaca.focus();

  const botao = $('#botao-confirmar');
  carregando(botao, 'Registrando entrada…');
  await esperar(600);
  pararCarregando(botao);

  ultimaEntrada = {
    placa: campoPlaca.value,
    tipo: campoTipo.value,
    modelo: $('#modelo').value.trim(),
    vaga: vaga,
    ticket: String(proximoTicket++).padStart(4, '0'),
    entrada: new Date(),
  };
  PATIO.push(ultimaEntrada);
  mostrarResultado();
});

function mostrarResultado() {
  const e = ultimaEntrada;
  $('#form-entrada').hidden = true;
  $('#resultado').hidden = false;
  $('#resultado-placa').innerHTML = htmlPlaca(e.placa);
  $('#resultado-dados').innerHTML = htmlDados([
    { termo: 'Ticket nº', valor: e.ticket },
    { termo: 'Vaga', valor: e.vaga },
    { termo: 'Entrada', valor: dataHora(e.entrada) },
    { termo: 'Veículo', valor: TARIFAS[e.tipo].nome + (e.modelo ? ', ' + escapar(e.modelo) : '') },
  ]);
  imprimirTicket();
}

async function imprimirTicket() {
  const caixa = $('#impressao');
  caixa.innerHTML = '<span><span class="girando" aria-hidden="true"></span> Imprimindo ticket…</span>';
  await esperar(1200);
  caixa.innerHTML = '<span class="ok">Ticket impresso. Entregue ao motorista.</span>' +
    '<button type="button" class="botao botao-pequeno" id="reimprimir">Reimprimir ticket</button>';
  $('#reimprimir').addEventListener('click', imprimirTicket);
  $('#botao-nova').focus();
}

// ---------- Nova entrada / cancelar entrada

function novaEntrada() {
  $('#form-entrada').reset();
  $('#resultado').hidden = true;
  $('#form-entrada').hidden = false;
  preencherSetores();
  campoPlaca.focus();
}

$('#botao-nova').addEventListener('click', novaEntrada);

const dialogoCancelar = $('#dialogo-cancelar');

$('#botao-cancelar-entrada').addEventListener('click', () => {
  $('#cancelar-titulo').textContent = 'Cancelar a entrada de ' + formatarPlaca(ultimaEntrada.placa) + '?';
  $('#cancelar-texto').textContent = 'O ticket nº ' + ultimaEntrada.ticket + ' deixa de valer e a vaga ' +
    ultimaEntrada.vaga + ' volta a ficar livre. Use quando a entrada foi registrada por engano.';
  dialogoCancelar.showModal();
});

$('#manter-entrada').addEventListener('click', () => dialogoCancelar.close());

$('#confirmar-cancelamento').addEventListener('click', () => {
  PATIO.splice(PATIO.indexOf(ultimaEntrada), 1);
  dialogoCancelar.close();
  novaEntrada();
});

preencherSetores();
