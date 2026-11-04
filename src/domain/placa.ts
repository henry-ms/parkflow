const MERCOSUL = /^[A-Z]{3}\d[A-Z]\d{2}$/;
const ANTIGA = /^[A-Z]{3}\d{4}$/;

export const TAMANHO_PLACA = 7;

/** Remove hífen, espaços e símbolos; mantém no máximo 7 caracteres. */
export function normalizarPlaca(valor: string): string {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, TAMANHO_PLACA);
}

export type ResultadoPlaca =
  | { valida: true; placa: string }
  | { valida: false; mensagem: string };

export function validarPlaca(valor: string): ResultadoPlaca {
  const placa = normalizarPlaca(valor);
  if (placa.length === 0) {
    return { valida: false, mensagem: 'Informe a placa do veículo.' };
  }
  if (placa.length < TAMANHO_PLACA) {
    const faltam = TAMANHO_PLACA - placa.length;
    return {
      valida: false,
      mensagem: `A placa tem 7 caracteres. ${faltam === 1 ? 'Falta 1' : `Faltam ${faltam}`}.`,
    };
  }
  if (!MERCOSUL.test(placa) && !ANTIGA.test(placa)) {
    return {
      valida: false,
      mensagem: 'Formato não reconhecido. Use 3 letras seguidas de 4 caracteres, como ABC1D23 ou ABC-1234.',
    };
  }
  return { valida: true, placa };
}

/** Placas no padrão antigo são exibidas com hífen; Mercosul, sem. */
export function formatarPlaca(placa: string): string {
  return ANTIGA.test(placa) ? `${placa.slice(0, 3)}-${placa.slice(3)}` : placa;
}
