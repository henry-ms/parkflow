import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Botao } from '../components/Botao';
import { Carregando } from '../components/Carregando';
import { Aviso } from '../components/Aviso';
import css from './Estados.module.css';

export function CarregandoArea() {
  return (
    <div className={css.centro} role="status">
      <Carregando tamanho={24} />
      <p>Carregando…</p>
    </div>
  );
}

/** Se o pacote da área não baixar (rede instável), explica e oferece recarregar. */
export class FalhaAoCarregar extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false };

  static getDerivedStateFromError() {
    return { falhou: true };
  }

  render() {
    if (!this.state.falhou) return this.props.children;
    return (
      <div className={css.centro}>
        <Aviso
          tom="problema"
          titulo="Esta tela não carregou."
          acoes={
            <Botao variante="primario" onClick={() => window.location.reload()}>
              Recarregar a página
            </Botao>
          }
        >
          A conexão pode ter caído durante o carregamento. Seus dados já registrados não foram afetados.
        </Aviso>
      </div>
    );
  }
}

export function NaoEncontrada() {
  return (
    <div className={css.centro}>
      <h1>Página não encontrada</h1>
      <p>O endereço pode ter sido digitado errado ou a página mudou de lugar.</p>
      <Link to="/">Ir para o início</Link>
    </div>
  );
}
