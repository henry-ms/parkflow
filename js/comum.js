// =========================================================
// Funções usadas em todas as telas
// =========================================================

// Atalho para pegar elementos
function $(seletor) {
  return document.querySelector(seletor);
}

// Simula a espera de um servidor (ex.: confirmar pagamento)
function esperar(ms) {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

// Evita que texto digitado pelo usuário vire HTML
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ---------- Pedaços de HTML reaproveitados

function htmlPlaca(placa, pequena) {
  return '<span class="placa' + (pequena ? ' placa-p' : '') + '">' +
    '<span class="placa-faixa" aria-hidden="true">BRASIL</span>' +
    '<span class="placa-texto">' + formatarPlaca(placa) + '</span></span>';
}

// Status sempre com texto (e símbolo via CSS), nunca só cor
function htmlSelo(tom, texto) {
  return '<span class="selo selo-' + tom + '">' + texto + '</span>';
}

function htmlSituacao(situacao) {
  return htmlSelo(SITUACOES[situacao].tom, SITUACOES[situacao].texto);
}

// Entrada e saída são rotina: sempre neutras
function htmlEvento(evento) {
  return htmlSelo('neutro', evento === 'entrada' ? '↓ Entrada' : '↑ Saída');
}

function htmlAviso(tom, titulo, texto, acoes) {
  return '<div class="aviso aviso-' + tom + '" role="' + (tom === 'problema' ? 'alert' : 'status') + '">' +
    '<strong>' + titulo + '</strong>' +
    (texto ? '<p>' + texto + '</p>' : '') +
    (acoes ? '<div class="acoes">' + acoes + '</div>' : '') +
    '</div>';
}

function htmlDados(itens) {
  return itens.map((i) =>
    '<div' + (i.total ? ' class="total"' : '') + '><dt>' + i.termo + '</dt><dd>' + i.valor + '</dd></div>'
  ).join('');
}

// ---------- Erros de campo: borda + texto abaixo do campo

function mostrarErro(campo, mensagem) {
  const caixa = campo.closest('.campo');
  limparErro(campo);
  caixa.classList.add('campo-erro');
  const p = document.createElement('p');
  p.className = 'erro-texto';
  p.id = campo.id + '-erro';
  p.textContent = mensagem;
  caixa.appendChild(p);
  campo.setAttribute('aria-invalid', 'true');
  campo.setAttribute('aria-describedby', p.id);
}

function limparErro(campo) {
  const caixa = campo.closest('.campo');
  caixa.classList.remove('campo-erro');
  const antigo = caixa.querySelector('.erro-texto');
  if (antigo) antigo.remove();
  campo.removeAttribute('aria-invalid');
  campo.removeAttribute('aria-describedby');
}

// ---------- Botão em estado de carregamento ("Entrando…", "Registrando…")

function carregando(botao, texto) {
  botao.dataset.textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.innerHTML = '<span class="girando" aria-hidden="true"></span> ' + texto;
}

function pararCarregando(botao) {
  botao.disabled = false;
  botao.textContent = botao.dataset.textoOriginal;
}

// ---------- Barra superior: menu do usuário e atalhos

function iniciarBarra() {
  const botao = $('.usuario-botao');
  const menu = $('.usuario-menu');
  if (botao) {
    botao.addEventListener('click', () => {
      const aberto = botao.getAttribute('aria-expanded') === 'true';
      botao.setAttribute('aria-expanded', String(!aberto));
      menu.hidden = aberto;
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.usuario')) {
        botao.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }
    });
  }

  // Atalhos do operador: F2 = entrada, F4 = saída
  if (document.body.dataset.perfil === 'operador') {
    document.addEventListener('keydown', (e) => {
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'F2') {
        e.preventDefault();
        location.href = 'entrada.html';
      }
      if (e.key === 'F4') {
        e.preventDefault();
        location.href = 'saida.html';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', iniciarBarra);
