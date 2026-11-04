import type { ReactNode, SVGProps } from 'react';

/** Ícones em SVG inline: sem dependência externa e sem requisição extra. Decorativos por padrão. */
type Props = Omit<SVGProps<SVGSVGElement>, 'children'> & { tamanho?: number };

function criar(nome: string, desenho: ReactNode) {
  const Icone = ({ tamanho = 18, ...props }: Props) => (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {desenho}
    </svg>
  );
  Icone.displayName = nome;
  return Icone;
}

export const IconeConfirmado = criar('IconeConfirmado', <path d="M20 6 9 17l-5-5" />);
export const IconeProblema = criar(
  'IconeProblema',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </>,
);
export const IconeRelogio = criar(
  'IconeRelogio',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </>,
);
export const IconeEntrada = criar('IconeEntrada', <path d="M12 4v12m0 0-5-5m5 5 5-5M5 20h14" />);
export const IconeSaida = criar('IconeSaida', <path d="M12 20V8m0 0-5 5m5-5 5 5M5 4h14" />);
export const IconeVoltar = criar('IconeVoltar', <path d="m15 18-6-6 6-6" />);
export const IconeBusca = criar(
  'IconeBusca',
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
);
export const IconeImpressora = criar(
  'IconeImpressora',
  <>
    <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <path d="M7 14h10v7H7z" />
  </>,
);
export const IconeAtualizar = criar('IconeAtualizar', <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />);
export const IconeOlho = criar(
  'IconeOlho',
  <>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const IconeOlhoFechado = criar(
  'IconeOlhoFechado',
  <path d="M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" />,
);
export const IconeSair = criar('IconeSair', <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />);
export const IconeFechar = criar('IconeFechar', <path d="M18 6 6 18M6 6l12 12" />);
export const IconeInfo = criar(
  'IconeInfo',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.5h.01" />
  </>,
);
export const IconeCopiar = criar(
  'IconeCopiar',
  <>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </>,
);
export const IconeOrdenar = criar('IconeOrdenar', <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />);
export const IconeOrdemAsc = criar('IconeOrdemAsc', <path d="m7 14 5-5 5 5" />);
export const IconeOrdemDesc = criar('IconeOrdemDesc', <path d="m7 10 5 5 5-5" />);
export const IconeMais = criar('IconeMais', <path d="M12 5v14M5 12h14" />);
export const IconeSemConexao = criar(
  'IconeSemConexao',
  <path d="M2 8.8a15 15 0 0 1 4.2-2.6M10.7 5.1A15 15 0 0 1 22 8.8M5 12.6a10 10 0 0 1 5.2-2.5M16.8 10.7a10 10 0 0 1 2.2 1.9M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18" />,
);
