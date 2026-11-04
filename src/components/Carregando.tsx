import css from './Carregando.module.css';

/** Indicador giratório decorativo; o texto ao lado é quem informa o estado. */
export function Carregando({ tamanho = 18 }: { tamanho?: number }) {
  return <span className={css.carregando} style={{ width: tamanho, height: tamanho }} aria-hidden="true" />;
}

/** Esqueleto de conteúdo enquanto os dados chegam. */
export function Esqueleto({ altura = '1rem', largura = '100%' }: { altura?: string; largura?: string }) {
  return <span className={css.esqueleto} style={{ height: altura, width: largura }} aria-hidden="true" />;
}
