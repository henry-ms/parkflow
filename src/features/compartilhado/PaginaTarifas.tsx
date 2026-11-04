import { useAutenticacao } from '../../auth/Autenticacao';
import { CabecalhoPagina, Painel } from '../../components/Pagina';
import { TIPOS_VEICULO } from '../../domain/catalogo';
import { formatarMoeda } from '../../domain/formato';
import { TARIFAS, TAXA_TICKET_PERDIDO, TOLERANCIA_MINUTOS } from '../../domain/tarifa';
import css from './Tarifas.module.css';

/** Consulta somente leitura: o operador explica a cobrança sem depender do gerente. */
export default function PaginaTarifas() {
  const { sessao } = useAutenticacao();
  return (
    <>
      <CabecalhoPagina
        titulo="Tarifas"
        descricao={
          sessao?.perfil === 'gerente'
            ? 'Tabela em vigor. A edição de tarifas ainda não faz parte deste protótipo.'
            : 'Tabela em vigor para veículos avulsos. Somente consulta; alterações são feitas pela gerência.'
        }
      />
      <Painel>
        <div className={css.rolagem} role="region" aria-label="Tabela de tarifas" tabIndex={0}>
          <table className={css.tabela}>
            <thead>
              <tr>
                <th scope="col">Tipo de veículo</th>
                <th scope="col">1ª hora</th>
                <th scope="col">Cada 30 min ou fração</th>
                <th scope="col">Limite por dia</th>
              </tr>
            </thead>
            <tbody>
              {TIPOS_VEICULO.map((t) => {
                const tarifa = TARIFAS[t.valor];
                return (
                  <tr key={t.valor}>
                    <th scope="row">{t.rotulo}</th>
                    <td>{formatarMoeda(tarifa.primeiraHora)}</td>
                    <td>{formatarMoeda(tarifa.valorFracao)}</td>
                    <td>{formatarMoeda(tarifa.diariaMaxima)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className={css.regras}>
          <li>Permanência de até {TOLERANCIA_MINUTOS} minutos não é cobrada.</li>
          <li>Depois da 1ª hora, cada fração de 30 minutos iniciada é cobrada inteira.</li>
          <li>Permanências acima de 24 horas somam uma diária por dia completo.</li>
          <li>Ticket perdido acrescenta {formatarMoeda(TAXA_TICKET_PERDIDO)} ao total.</li>
        </ul>
      </Painel>
    </>
  );
}
