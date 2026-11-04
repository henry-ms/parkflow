import type { Perfil } from '../domain/tipos';

/**
 * Cada perfil vira um pacote separado: o mensalista nunca baixa o código do
 * caixa, e vice-versa. Reforça a separação por perfil e reduz o JS inicial.
 */
export const carregadoresArea = {
  operador: () => import('../features/operador/AreaOperador'),
  gerente: () => import('../features/gerente/AreaGerente'),
  mensalista: () => import('../features/mensalista/AreaMensalista'),
} satisfies Record<Perfil, () => Promise<unknown>>;

/** Chamado logo após o login, em paralelo à navegação. */
export const preCarregarArea = (perfil: Perfil) => void carregadoresArea[perfil]().catch(() => undefined);
