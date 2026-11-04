import { Navigate, Route, Routes } from 'react-router-dom';
import { Estrutura, type ItemNavegacao } from '../../components/Estrutura';
import PaginaFaturas from './PaginaFaturas';

const ITENS: ItemNavegacao[] = [{ para: '/mensalista/faturas', rotulo: 'Minhas faturas' }];

export default function AreaMensalista() {
  return (
    <Routes>
      <Route element={<Estrutura itens={ITENS} />}>
        <Route path="faturas" element={<PaginaFaturas />} />
        <Route path="*" element={<Navigate to="/mensalista/faturas" replace />} />
      </Route>
    </Routes>
  );
}
