import { rotuloTipo } from '../../domain/catalogo';
import { formatarMoeda } from '../../domain/formato';
import type { CalculoTarifa } from '../../domain/tarifa';
import type { TipoVeiculo } from '../../domain/tipos';
import css from './Saida.module.css';

/** Cada parcela do valor, em linguagem de balcão, para o operador explicar ao cliente. */
export function DetalheCalculo({ tipo, calculo }: { tipo: TipoVeiculo; calculo: CalculoTarifa }) {
  return (
    <section className={css.calculo} aria-labelledby="titulo-calculo">
      <h3 id="titulo-calculo">Como o valor foi calculado</h3>
      <p className={css.regra}>
        Tarifa de {rotuloTipo(tipo).toLowerCase()}: {calculo.resumoRegra}.
      </p>
      <table className={css.tabelaCalculo}>
        <caption className="visualmente-oculto">Parcelas da cobrança</caption>
        <tbody>
          {calculo.linhas.map((l) => (
            <tr key={l.descricao}>
              <th scope="row">
                {l.descricao}
                {l.detalhe && <span className={css.detalheLinha}>{l.detalhe}</span>}
              </th>
              <td>{l.valor < 0 ? `− ${formatarMoeda(-l.valor)}` : formatarMoeda(l.valor)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{formatarMoeda(calculo.total)}</td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
