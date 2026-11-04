import { useEffect, useState } from 'react';
import { Aviso } from '../../components/Aviso';
import { Botao } from '../../components/Botao';
import { Esqueleto } from '../../components/Carregando';
import { Dialogo } from '../../components/Dialogo';
import { rotuloSetor } from '../../domain/catalogo';
import type { SetorId, Vaga } from '../../domain/tipos';
import { listarVagas } from '../../services/api';
import css from './Entrada.module.css';

interface Props {
  aberto: boolean;
  setor: SetorId;
  atual: string | null;
  aoFechar: () => void;
  aoEscolher: (codigo: string) => void;
}

/** Mapa das vagas do setor. Vagas ocupadas aparecem, mas não podem ser escolhidas. */
export function DialogoAlterarVaga({ aberto, setor, atual, aoFechar, aoEscolher }: Props) {
  const [vagas, setVagas] = useState<Vaga[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(atual);

  useEffect(() => {
    if (!aberto) return;
    setEscolhida(atual);
    setVagas(null);
    setErro(null);
    listarVagas(setor).then(setVagas, (e: Error) => setErro(e.message));
  }, [aberto, setor, atual]);

  const livres = vagas?.filter((v) => !v.ocupada).length ?? 0;

  return (
    <Dialogo
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Alterar vaga"
      largura="lg"
      descricao={
        vagas ? `${rotuloSetor(setor)}: ${livres} de ${vagas.length} vagas livres. Vagas ocupadas não podem ser escolhidas.` : rotuloSetor(setor)
      }
      rodape={
        <>
          <Botao onClick={aoFechar}>Manter a vaga atual</Botao>
          <Botao variante="primario" disabled={!escolhida} onClick={() => escolhida && aoEscolher(escolhida)}>
            {escolhida ? `Usar a vaga ${escolhida}` : 'Escolha uma vaga'}
          </Botao>
        </>
      }
    >
      {erro && <Aviso tom="problema" titulo="Não foi possível carregar as vagas.">{erro}</Aviso>}
      {!vagas && !erro && <Esqueleto altura="12rem" />}
      {vagas && (
        <fieldset className={css.mapaVagas}>
          <legend className="visualmente-oculto">Vagas do {rotuloSetor(setor)}</legend>
          {vagas.map((v) => (
            <label key={v.codigo} className={`${css.vagaOpcao} ${v.ocupada ? css.vagaOcupada : ''}`}>
              <input
                type="radio"
                name="vaga"
                value={v.codigo}
                checked={escolhida === v.codigo}
                disabled={v.ocupada}
                onChange={() => setEscolhida(v.codigo)}
              />
              <span className={css.vagaCodigo}>{v.codigo}</span>
              <span className={css.vagaEstado}>{v.ocupada ? 'Ocupada' : 'Livre'}</span>
            </label>
          ))}
        </fieldset>
      )}
    </Dialogo>
  );
}
