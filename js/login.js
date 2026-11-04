// Tela 1 — Login: valida as credenciais e leva cada perfil para a sua tela inicial

const campoUsuario = $('#usuario');
const campoSenha = $('#senha');
const botaoEntrar = $('#botao-entrar');

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#aviso-login').innerHTML = '';
  limparErro(campoUsuario);
  limparErro(campoSenha);

  if (!campoUsuario.value.trim()) {
    mostrarErro(campoUsuario, 'Informe seu CPF, e-mail ou usuário.');
    return campoUsuario.focus();
  }
  if (!campoSenha.value) {
    mostrarErro(campoSenha, 'Informe sua senha.');
    return campoSenha.focus();
  }

  carregando(botaoEntrar, 'Entrando…');
  await esperar(700);

  // Aceita CPF com ou sem pontos
  let digitado = campoUsuario.value.trim().toLowerCase();
  if (/^[\d.\-\s]+$/.test(digitado)) digitado = digitado.replace(/\D/g, '');

  const usuario = USUARIOS.find((u) => u.logins.includes(digitado));
  if (!usuario || campoSenha.value !== 'parkflow') {
    pararCarregando(botaoEntrar);
    // Os dados digitados continuam no formulário
    $('#aviso-login').innerHTML = htmlAviso('problema', 'Usuário ou senha incorretos.', 'Confira os dados e tente de novo.');
    return;
  }

  location.href = usuario.pagina;
});

// Mostrar ou ocultar a senha
$('#mostrar-senha').addEventListener('click', (e) => {
  const mostrando = campoSenha.type === 'text';
  campoSenha.type = mostrando ? 'password' : 'text';
  e.target.textContent = mostrando ? 'Mostrar' : 'Ocultar';
  e.target.setAttribute('aria-pressed', String(!mostrando));
});

// Alternar entre login e recuperação de senha
$('#link-esqueci').addEventListener('click', (e) => {
  e.preventDefault();
  $('#tela-login').hidden = true;
  $('#tela-recuperar').hidden = false;
  $('#recuperar-usuario').focus();
});

$('#voltar-login').addEventListener('click', (e) => {
  e.preventDefault();
  $('#tela-recuperar').hidden = true;
  $('#tela-login').hidden = false;
  campoUsuario.focus();
});

$('#form-recuperar').addEventListener('submit', async (e) => {
  e.preventDefault();
  const campo = $('#recuperar-usuario');
  limparErro(campo);
  if (!campo.value.trim()) {
    mostrarErro(campo, 'Informe seu CPF, e-mail ou usuário.');
    return campo.focus();
  }
  const botao = $('#botao-recuperar');
  carregando(botao, 'Enviando instruções…');
  await esperar(800);
  $('#form-recuperar').hidden = true;
  // A mensagem é a mesma exista ou não a conta, para não revelar quem tem cadastro
  $('#aviso-recuperar').innerHTML = htmlAviso('regular', 'Pedido recebido.',
    'Se houver um acesso com esses dados, as instruções chegam ao e-mail cadastrado em alguns minutos. Confira também a caixa de spam.');
});
