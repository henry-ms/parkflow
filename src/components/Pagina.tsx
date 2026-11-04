import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { IconeVoltar } from './Icones';
import css from './Pagina.module.css';

export function useTituloDocumento(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} | ParkFlow`;
  }, [titulo]);
}

interface PropsCabecalho {
  titulo: string;
  descricao?: ReactNode;
  /** Link de retorno; presente em todos os fluxos que não são a home do perfil. */
  voltar?: { para: string; rotulo: string };
  acoes?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, voltar, acoes }: PropsCabecalho) {
  useTituloDocumento(titulo);
  return (
    <div className={css.cabecalho}>
      {voltar && (
        <Link to={voltar.para} className={css.voltar}>
          <IconeVoltar />
          {voltar.rotulo}
        </Link>
      )}
      <div className={css.linha}>
        <div className={css.textos}>
          <h1>{titulo}</h1>
          {descricao && <div className={css.descricao}>{descricao}</div>}
        </div>
        {acoes && <div className={css.acoes}>{acoes}</div>}
      </div>
    </div>
  );
}

/** Superfície branca sobre o concreto. `destaque` marca o painel da ação principal. */
export function Painel({
  children,
  titulo,
  idTitulo,
  destaque,
  className,
  como: Tag = 'section',
}: {
  children: ReactNode;
  titulo?: string;
  idTitulo?: string;
  destaque?: boolean;
  className?: string;
  como?: 'section' | 'aside' | 'div';
}) {
  return (
    <Tag
      className={[css.painel, destaque && css.destaque, className].filter(Boolean).join(' ')}
      aria-labelledby={titulo ? idTitulo : undefined}
    >
      {titulo && (
        <h2 id={idTitulo} className={css.tituloPainel}>
          {titulo}
        </h2>
      )}
      {children}
    </Tag>
  );
}
