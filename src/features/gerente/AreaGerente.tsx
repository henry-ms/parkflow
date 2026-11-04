import { Navigate, Route, Routes } from 'react-router-dom';
import { Estrutura, type ItemNavegacao } from '../../components/Estrutura';
import PaginaTarifas from '../compartilhado/PaginaTarifas';
import PaginaMensalistas from './PaginaMensalistas';

const ITENS: ItemNavegacao[] = [
  { para: '/gerente/mensalistas', rotulo: 'Mensalistas' },
  { para: '/gerente/tarifas', rotulo: 'Tarifas' },
];

export default function AreaGerente() {
  return (
    <Routes>
      <Route element={<Estrutura itens={ITENS} />}>
        <Route path="mensalistas" element={<PaginaMensalistas />} />
        <Route path="tarifas" element={<PaginaTarifas />} />
        <Route path="*" element={<Navigate to="/gerente/mensalistas" replace />} />
      </Route>
    </Routes>
  );
}
