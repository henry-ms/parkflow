import { useCallback, useEffect, useRef, useState } from 'react';

interface Estado<T> {
  dados: T | undefined;
  erro: Error | undefined;
  carregando: boolean;
}

/**
 * Carrega dados ao montar e expõe `recarregar`. Mantém os dados anteriores
 * durante a recarga, para a tela não "piscar" a cada atualização.
 */
export function useAssincrono<T>(carregar: () => Promise<T>, dependencias: unknown[] = []) {
  const [estado, setEstado] = useState<Estado<T>>({ dados: undefined, erro: undefined, carregando: true });
  const chamadaAtual = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(carregar, dependencias);

  const recarregar = useCallback(async () => {
    const id = ++chamadaAtual.current;
    setEstado((e) => ({ ...e, carregando: true, erro: undefined }));
    try {
      const dados = await executar();
      if (id === chamadaAtual.current) setEstado({ dados, erro: undefined, carregando: false });
    } catch (erro) {
      if (id === chamadaAtual.current) setEstado((e) => ({ ...e, erro: erro as Error, carregando: false }));
    }
  }, [executar]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { ...estado, recarregar, definirDados: (dados: T) => setEstado((e) => ({ ...e, dados })) };
}
