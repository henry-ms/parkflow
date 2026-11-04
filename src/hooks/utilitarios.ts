import { useEffect, useState, useSyncExternalStore } from 'react';

/** Hora atual, atualizada no intervalo pedido (padrão: a cada 30 s). */
export function useRelogio(intervaloMs = 30_000) {
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), intervaloMs);
    return () => clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

function assinarConexao(aviso: () => void) {
  window.addEventListener('online', aviso);
  window.addEventListener('offline', aviso);
  return () => {
    window.removeEventListener('online', aviso);
    window.removeEventListener('offline', aviso);
  };
}

export function useConectado() {
  return useSyncExternalStore(assinarConexao, () => navigator.onLine, () => true);
}

/**
 * Atalhos de teclado globais (ex.: F2, F4). Ignorados enquanto um diálogo
 * modal estiver aberto, para não tirar o operador de uma conferência.
 */
export function useAtalhos(mapa: Record<string, () => void>) {
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (document.querySelector('dialog[open]')) return;
      const acao = mapa[e.key];
      if (acao) {
        e.preventDefault();
        acao();
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [mapa]);
}

/** Atualiza a cada intervalo e também quando a aba volta a ficar visível. */
export function useAtualizacaoPeriodica(atualizar: () => void, intervaloMs: number) {
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') atualizar();
    }, intervaloMs);
    const aoVoltar = () => document.visibilityState === 'visible' && atualizar();
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [atualizar, intervaloMs]);
}
