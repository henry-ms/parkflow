import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Campo, Entrada } from '../../components/Campo';
import { Marca } from '../../components/Estrutura';
import { IconeVoltar } from '../../components/Icones';
import { useTituloDocumento } from '../../components/Pagina';
import { solicitarRecuperacaoSenha } from '../../services/api';
import css from './Login.module.css';

export default function PaginaRecuperarSenha() {
  useTituloDocumento('Recuperar senha');
  const [identificador, setIdentificador] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [estado, setEstado] = useState<'editando' | 'enviando' | 'enviado'>('editando');
  const ref = useRef<HTMLInputElement>(null);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!identificador.trim()) {
      setErro('Informe seu CPF, e-mail ou usuário.');
      return ref.current?.focus();
    }
    setErro(null);
    setEstado('enviando');
    try {
      await solicitarRecuperacaoSenha(identificador);
      setEstado('enviado');
    } catch {
      setEstado('editando');
      setErro('Não foi possível enviar agora. Verifique a internet e tente de novo.');
    }
  }

  return (
    <div className={css.pagina}>
      <main className={css.conteudo}>
        <Marca />
        <Link to="/login" className={css.voltar}>
          <IconeVoltar />
          Voltar para o login
        </Link>
        <div className={css.cabecalho}>
          <h1>Recuperar senha</h1>
          <p>Enviamos um link para criar uma nova senha no e-mail cadastrado. O link vale por 30 minutos.</p>
        </div>

        {estado === 'enviado' ? (
          <Aviso tom="regular" titulo="Pedido recebido.">
            Se houver um acesso com esses dados, as instruções chegam ao e-mail cadastrado em alguns minutos. Confira também a caixa de spam.
            Operadores e gerentes sem e-mail cadastrado devem pedir a troca de senha ao administrador do estacionamento.
          </Aviso>
        ) : (
          <form className={css.formulario} onSubmit={enviar} noValidate>
            <Campo rotulo="CPF, e-mail ou usuário" erro={erro} obrigatorio>
              {(p) => (
                <Entrada
                  {...p}
                  ref={ref}
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  autoComplete="username"
                  disabled={estado === 'enviando'}
                />
              )}
            </Campo>
            <Botao type="submit" variante="primario" tamanho="lg" larguraTotal carregando={estado === 'enviando'} textoCarregando="Enviando instruções…">
              Enviar instruções
            </Botao>
          </form>
        )}
      </main>
    </div>
  );
}
