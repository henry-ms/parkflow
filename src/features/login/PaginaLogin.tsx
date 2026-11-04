import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAutenticacao } from '../../auth/Autenticacao';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Campo, Entrada } from '../../components/Campo';
import { Marca } from '../../components/Estrutura';
import { IconeOlho, IconeOlhoFechado } from '../../components/Icones';
import { useTituloDocumento } from '../../components/Pagina';
import { ErroApi, HOME_DO_PERFIL } from '../../services/api';
import { preCarregarArea } from '../../app/areas';
import css from './Login.module.css';

type Erros = { identificador?: string; senha?: string; geral?: string };

export default function PaginaLogin() {
  useTituloDocumento('Entrar');
  const { sessao, entrar } = useAutenticacao();
  const navegar = useNavigate();
  const local = useLocation() as { state?: { destino?: string; saiu?: boolean } };

  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [entrando, setEntrando] = useState(false);
  const refIdentificador = useRef<HTMLInputElement>(null);
  const refSenha = useRef<HTMLInputElement>(null);
  const refAviso = useRef<HTMLDivElement>(null);

  if (sessao && !entrando) return <Navigate to={HOME_DO_PERFIL[sessao.perfil]} replace />;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    const novos: Erros = {};
    if (!identificador.trim()) novos.identificador = 'Informe seu CPF, e-mail ou usuário.';
    if (!senha) novos.senha = 'Informe sua senha.';
    setErros(novos);
    if (novos.identificador) return refIdentificador.current?.focus();
    if (novos.senha) return refSenha.current?.focus();

    setEntrando(true);
    try {
      const nova = await entrar(identificador, senha);
      preCarregarArea(nova.perfil);
      // Volta à tela pedida antes do login, desde que seja da área do próprio perfil.
      const destino = local.state?.destino;
      navegar(destino?.startsWith(`/${nova.perfil}`) ? destino : HOME_DO_PERFIL[nova.perfil], { replace: true });
    } catch (erro) {
      setEntrando(false);
      // Os dados digitados permanecem; só a mensagem muda.
      setErros({
        geral:
          erro instanceof ErroApi && erro.codigo === 'credenciais'
            ? 'Usuário ou senha incorretos. Confira os dados e tente de novo.'
            : 'Não foi possível conectar ao ParkFlow. Verifique a internet e tente de novo.',
      });
      requestAnimationFrame(() => refAviso.current?.focus());
    }
  }

  return (
    <div className={css.pagina}>
      <main className={css.conteudo}>
        <Marca />
        <div className={css.cabecalho}>
          <h1>Entrar no ParkFlow</h1>
          <p>Use o acesso que o estacionamento forneceu. O sistema abre direto nas telas do seu perfil.</p>
        </div>

        {local.state?.saiu && !erros.geral && (
          <Aviso tom="neutro" titulo="Você saiu do ParkFlow." anunciar={false}>
            Para continuar, entre de novo.
          </Aviso>
        )}
        {erros.geral && <Aviso ref={refAviso} tom="problema" titulo={erros.geral} />}

        <form className={css.formulario} onSubmit={enviar} noValidate>
          <Campo rotulo="CPF, e-mail ou usuário" erro={erros.identificador} obrigatorio>
            {(p) => (
              <Entrada
                {...p}
                ref={refIdentificador}
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={entrando}
              />
            )}
          </Campo>

          <Campo
            rotulo="Senha"
            erro={erros.senha}
            obrigatorio
            dica={capsLock ? <strong className={css.caps}>Caps Lock está ativado.</strong> : undefined}
          >
            {(p) => (
              <div className={css.senha}>
                <Entrada
                  {...p}
                  ref={refSenha}
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                  autoComplete="current-password"
                  disabled={entrando}
                />
                <button
                  type="button"
                  className={css.alternarSenha}
                  onClick={() => setMostrarSenha((m) => !m)}
                  aria-pressed={mostrarSenha}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  disabled={entrando}
                >
                  {mostrarSenha ? <IconeOlhoFechado /> : <IconeOlho />}
                </button>
              </div>
            )}
          </Campo>

          <Botao type="submit" variante="primario" tamanho="lg" larguraTotal carregando={entrando} textoCarregando="Entrando…">
            Entrar
          </Botao>
        </form>

        <Link to="/recuperar-senha" className={css.esqueci}>
          Esqueci minha senha
        </Link>

        {import.meta.env.DEV && <AcessosDemonstracao />}
      </main>
    </div>
  );
}

/** Visível só em desenvolvimento; não entra no build de produção. */
function AcessosDemonstracao() {
  return (
    <details className={css.demo}>
      <summary>Acessos de demonstração</summary>
      <dl>
        <div>
          <dt>Operador</dt>
          <dd>operador01</dd>
        </div>
        <div>
          <dt>Gerente</dt>
          <dd>gerente01</dd>
        </div>
        <div>
          <dt>Mensalista</dt>
          <dd>123.456.789-09</dd>
        </div>
        <div>
          <dt>Senha</dt>
          <dd>parkflow</dd>
        </div>
      </dl>
    </details>
  );
}
