// Tela 2 — Visão do turno: indicadores e últimas movimentações

function vagasLivresDoSetor(setor) {
  const avulsas = setor.vagas - VAGAS_MENSALISTAS.filter((v) => v.startsWith(setor.id)).length;
  const ocupadas = PATIO.filter((v) => !v.mensalista && v.vaga.startsWith(setor.id)).length;
  return { total: avulsas, livres: avulsas - ocupadas };
}

function mostrarIndicadores() {
  const diaSemana = INICIO_TURNO.toLocaleDateString('pt-BR', { weekday: 'long' });
  $('#data-turno').textContent =
    diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1) + ', ' + data(INICIO_TURNO) + '. Turno iniciado às ' + hora(INICIO_TURNO) + '.';

  let livres = 0;
  let total = 0;
  $('#setores').innerHTML = SETORES.map((s) => {
    const v = vagasLivresDoSetor(s);
    livres += v.livres;
    total += v.total;
    return '<li><span>Setor ' + s.id + ', ' + s.nome.toLowerCase() + '</span>' +
      '<strong>' + (v.livres === 0 ? '<span class="texto-problema">Lotado</span>' : v.livres + ' livres') + '</strong>' +
      '<span class="barrinha" aria-hidden="true"><span style="width:' + (v.livres / v.total) * 100 + '%"></span></span></li>';
  }).join('');
  $('#vagas-livres').textContent = livres;
  $('#vagas-total').textContent = 'de ' + total + ' vagas para avulsos';

  const mensalistas = PATIO.filter((v) => v.mensalista).length;
  $('#no-patio').textContent = PATIO.length;
  $('#no-patio-detalhe').textContent = (PATIO.length - mensalistas) + ' avulsos e ' + mensalistas + ' mensalistas';

  $('#recebido').textContent = moeda(RECEBIDO_TURNO.valor);
  $('#recebido-detalhe').textContent = 'em ' + RECEBIDO_TURNO.saidas + ' saídas cobradas';

  $('#movimentacoes').innerHTML = MOVIMENTACOES.map((m) =>
    '<tr><td>' + hora(m.horario) + '</td><td>' + htmlPlaca(m.placa, true) + '</td><td>' + htmlEvento(m.evento) + '</td>' +
    '<td>' + m.vaga + '</td><td class="numero">' +
    (m.valor ? moeda(m.valor) : '<span class="apagado" aria-hidden="true">–</span><span class="oculto">sem cobrança</span>') +
    '</td></tr>'
  ).join('');

  $('#atualizado').innerHTML = 'Atualizado às ' + new Date().toLocaleTimeString('pt-BR') +
    '<span class="pequeno">Atualiza sozinho a cada 30 segundos</span>';
}

async function atualizar() {
  const botao = $('#botao-atualizar');
  carregando(botao, 'Atualizando…');
  await esperar(600);
  mostrarIndicadores();
  pararCarregando(botao);
}

mostrarIndicadores();
$('#botao-atualizar').addEventListener('click', atualizar);
setInterval(atualizar, 30000);
