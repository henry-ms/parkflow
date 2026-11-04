// Tela 5 — Gerenciar mensalistas: lista, busca, filtro, ordenação e novo contrato

let ordem = { coluna: 'vencimento', crescente: true }; // vencidas aparecem primeiro

function mostrarContratos() {
  const texto = $('#filtro-texto').value.trim().toLowerCase();
  const situacao = document.querySelector('input[name="situacao"]:checked').value;

  const lista = CONTRATOS
    .filter((c) => situacao === 'todos' || situacaoContrato(c) === situacao)
    .filter((c) => !texto || c.nome.toLowerCase().includes(texto) ||
      c.placa.includes(normalizarPlaca(texto) || '#') || c.vaga.toLowerCase().includes(texto))
    .sort((a, b) => {
      const va = a[ordem.coluna];
      const vb = b[ordem.coluna];
      const r = typeof va === 'string' ? va.localeCompare(vb, 'pt-BR') : va - vb;
      return ordem.crescente ? r : -r;
    });

  $('#contratos').innerHTML = lista.map((c) => {
    const s = situacaoContrato(c);
    return '<tr' + (s === 'vencida' ? ' class="linha-vencida"' : '') + '>' +
      '<td><b>' + escapar(c.nome) + '</b><span class="pequeno"><span class="oculto">CPF </span>' + mascararCpf(c.cpf) + '</span></td>' +
      '<td>' + htmlPlaca(c.placa, true) + '</td>' +
      '<td>' + c.vaga + '</td>' +
      '<td class="numero">' + moeda(c.mensalidade) + '</td>' +
      '<td>' + data(c.vencimento) + (s === 'vencida' ? '<span class="pequeno texto-problema">' + descreverPrazo(c.vencimento) + '</span>' : '') + '</td>' +
      '<td>' + htmlSituacao(s) + '</td></tr>';
  }).join('');
  $('#vazio').hidden = lista.length > 0;

  const vencidas = CONTRATOS.filter((c) => situacaoContrato(c) === 'vencida').length;
  $('#resumo').textContent = CONTRATOS.length + ' contratos ativos. ' +
    (vencidas ? vencidas + ' com mensalidade vencida.' : 'Nenhuma mensalidade vencida.');
}

$('#filtro-texto').addEventListener('input', mostrarContratos);
document.querySelectorAll('input[name="situacao"]').forEach((r) => r.addEventListener('change', mostrarContratos));

// Clicar no cabeçalho ordena; clicar de novo inverte
document.querySelectorAll('.ordenar').forEach((botao) => {
  botao.addEventListener('click', () => {
    const coluna = botao.dataset.coluna;
    ordem = { coluna, crescente: ordem.coluna === coluna ? !ordem.crescente : true };
    mostrarContratos();
  });
});

// ---------- Novo contrato

const dialogo = $('#dialogo-contrato');
let novo = null;

$('#botao-novo').addEventListener('click', () => {
  $('#form-contrato').reset();
  document.querySelectorAll('#form-contrato input, #form-contrato select').forEach(limparErro);
  // Só vagas livres: sem carro no pátio e sem outro mensalista
  const ocupadas = PATIO.map((v) => v.vaga).concat(CONTRATOS.map((c) => c.vaga));
  const livres = [];
  SETORES.forEach((s) => {
    for (let i = 1; i <= s.vagas; i++) {
      const codigo = s.id + '-' + String(i).padStart(2, '0');
      if (!ocupadas.includes(codigo)) livres.push(codigo);
    }
  });
  $('#c-vaga').innerHTML = '<option value="" disabled selected>Selecione</option>' +
    livres.map((c) => '<option>' + c + '</option>').join('');
  $('#form-contrato').hidden = false;
  $('#conferir-contrato').hidden = true;
  dialogo.showModal();
});

$('#c-cancelar').addEventListener('click', () => dialogo.close());

$('#c-cpf').addEventListener('input', (e) => {
  const d = e.target.value.replace(/\D/g, '').slice(0, 11);
  e.target.value = d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');
});

$('#c-placa').addEventListener('input', (e) => {
  e.target.value = normalizarPlaca(e.target.value);
});

$('#form-contrato').addEventListener('submit', (e) => {
  e.preventDefault();
  const campos = {
    nome: $('#c-nome'), cpf: $('#c-cpf'), placa: $('#c-placa'), vaga: $('#c-vaga'), valor: $('#c-valor'),
  };
  Object.values(campos).forEach(limparErro);

  const erros = [];
  if (campos.nome.value.trim().split(/\s+/).length < 2) erros.push([campos.nome, 'Informe nome e sobrenome.']);
  if (campos.cpf.value.replace(/\D/g, '').length !== 11) erros.push([campos.cpf, 'O CPF tem 11 dígitos.']);
  const erroPlaca = validarPlaca(campos.placa.value);
  if (erroPlaca) erros.push([campos.placa, erroPlaca]);
  else if (CONTRATOS.some((c) => c.placa === campos.placa.value)) erros.push([campos.placa, 'Já existe um contrato para essa placa.']);
  if (!campos.vaga.value) erros.push([campos.vaga, 'Escolha a vaga fixa.']);
  if (!lerMoeda(campos.valor.value)) erros.push([campos.valor, 'Informe o valor da mensalidade.']);

  erros.forEach(([campo, msg]) => mostrarErro(campo, msg));
  if (erros.length) return erros[0][0].focus();

  const dia = Number($('#c-dia').value);
  novo = {
    id: String(2041 + CONTRATOS.length),
    nome: campos.nome.value.trim(),
    cpf: campos.cpf.value.replace(/\D/g, ''),
    placa: campos.placa.value,
    vaga: campos.vaga.value,
    mensalidade: lerMoeda(campos.valor.value),
    vencimento: proximoDia(dia),
  };

  $('#c-resumo').innerHTML = htmlDados([
    { termo: 'Mensalista', valor: escapar(novo.nome) },
    { termo: 'CPF', valor: campos.cpf.value },
    { termo: 'Placa', valor: formatarPlaca(novo.placa) },
    { termo: 'Vaga fixa', valor: novo.vaga },
    { termo: 'Vencimento', valor: 'Todo dia ' + dia + ' (primeiro em ' + data(novo.vencimento) + ')' },
    { termo: 'Mensalidade', valor: moeda(novo.mensalidade), total: true },
  ]);
  $('#form-contrato').hidden = true;
  $('#conferir-contrato').hidden = false;
  $('#c-salvar').focus();
});

$('#c-editar').addEventListener('click', () => {
  $('#conferir-contrato').hidden = true;
  $('#form-contrato').hidden = false;
});

$('#c-salvar').addEventListener('click', async (e) => {
  carregando(e.target, 'Salvando contrato…');
  await esperar(800);
  pararCarregando(e.target);
  CONTRATOS.push(novo);
  VAGAS_MENSALISTAS.push(novo.vaga);
  dialogo.close();
  $('#aviso-salvo').innerHTML = htmlAviso('regular', 'Contrato de ' + escapar(novo.nome) + ' salvo.',
    'Primeiro vencimento em ' + data(novo.vencimento) + '.');
  mostrarContratos();
});

mostrarContratos();
