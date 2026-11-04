import { useMemo } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Estrutura, type ItemNavegacao } from '../../components/Estrutura';
import { formatarHora } from '../../domain/formato';
import { useAssincrono } from '../../hooks/useAssincrono';
import { useAtalhos } from '../../hooks/utilitarios';
import { obterCaixa } from '../../services/api';
import PaginaTarifas from '../compartilhado/PaginaTarifas';
import PaginaEntrada from './PaginaEntrada';
import PaginaInicio from './PaginaInicio';
import PaginaSaida from './PaginaSaida';
import css from './Operador.module.css';

const ITENS: ItemNavegacao[] = [
  { para: '/operador', rotulo: 'Início' },
  { para: '/operador/entrada', rotulo: 'Entrada', atalho: 'F2' },
  { para: '/operador/saida', rotulo: 'Saída', atalho: 'F4' },
  { para: '/operador/tarifas', rotulo: 'Tarifas' },
];

function StatusCaixa() {
  const { dados } = useAssincrono(obterCaixa);
  if (!dados) return null;
  return (
    <span className={css.statusCaixa}>
      <span className={dados.aberto ? css.pontoAberto : css.pontoFechado} aria-hidden="true" />
      {dados.aberto ? `Caixa aberto desde ${formatarHora(dados.desde)}` : 'Caixa fechado'}
    </span>
  );
}

const ATALHOS = (
  <>
    <p>Atalhos do teclado</p>
    <p>
      <kbd>F2</kbd> Registrar entrada
    </p>
    <p>
      <kbd>F4</kbd> Registrar saída
    </p>
  </>
);

export default function AreaOperador() {
  const navegar = useNavigate();
  const atalhos = useMemo(
    () => ({ F2: () => navegar('/operador/entrada'), F4: () => navegar('/operador/saida') }),
    [navegar],
  );
  useAtalhos(atalhos);

  return (
    <Routes>
      <Route element={<Estrutura itens={ITENS} status={<StatusCaixa />} atalhos={ATALHOS} />}>
        <Route index element={<PaginaInicio />} />
        <Route path="entrada" element={<PaginaEntrada />} />
        <Route path="saida" element={<PaginaSaida />} />
        <Route path="tarifas" element={<PaginaTarifas />} />
        <Route path="*" element={<Navigate to="/operador" replace />} />
      </Route>
    </Routes>
  );
}
