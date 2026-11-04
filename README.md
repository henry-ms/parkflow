# ParkFlow

Interface do sistema de gestão de estacionamento ParkFlow, construída a partir do protótipo de baixa fidelidade e com as correções da avaliação heurística (Nielsen) aplicadas.

React 19 + TypeScript + Vite, sem biblioteca de componentes. Os dados são simulados em memória, com latência real, para que carregamento, espera e erro possam ser vistos funcionando.

## Como rodar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # regras de domínio (placa, tarifa, datas, CPF)
npm run build      # checagem de tipos + build de produção
```

Acessos de demonstração (senha `parkflow` para todos). Em modo de desenvolvimento eles também aparecem na tela de login:

| Perfil | Usuário |
|---|---|
| Operador / Caixa | `operador01` |
| Gerente | `gerente01` |
| Mensalista | `123.456.789-09` (ou `ana.souza@email.com`) |

Veículos de demonstração no pátio:

| Placa | O que demonstra |
|---|---|
| `ABC1D23` | Entrada duplicada e cálculo padrão (2h 48min → R$ 20,00) |
| `QRS2E45` | Cartão recusado pela operadora (crédito ou débito) |
| `KLM4G56` | Saída dentro da tolerância, sem cobrança |
| `DEF5H67` | Permanência acima de 24 h (diária) |

## Estrutura

```
src/
  domain/        regras puras e testadas: placa, tarifa, situação, formatação
  services/      api.ts (contrato usado pelas telas) e banco.ts (dados simulados)
  auth/          sessão e perfil
  components/    primitivos: Botao, Campo, Placa, Selo, Aviso, Dialogo, Estrutura…
  hooks/         carregamento assíncrono, relógio, atalhos, conexão
  app/           rotas, guarda de perfil e divisão de código por perfil
  features/
    login/       Login e recuperação de senha
    operador/    Visão do turno, Registrar entrada, Registrar saída
    gerente/     Gerenciar mensalistas e novo contrato
    mensalista/  Minhas faturas
    compartilhado/ Tarifas (somente leitura)
```

As telas só conhecem `services/api.ts`. Para ligar a um back-end real, troque a implementação desse arquivo; as telas não mudam.

## Correções da avaliação heurística

| Heurística | Onde está |
|---|---|
| 1. Visibilidade do status | "Atualizado às hh:mm:ss" com atualização automática a cada 30 s ([AtualizadoEm](src/components/AtualizadoEm.tsx)); "Caixa aberto desde 06:00" na barra; estados "Entrando…", "Imprimindo ticket…", "Ticket impresso" + "Reimprimir", "Aguardando confirmação do pagamento…" |
| 2. Mundo real | Cálculo da tarifa explicado parcela por parcela ([DetalheCalculo](src/features/operador/DetalheCalculo.tsx)); "Valor cobrado" e prazo ("faltam 6 dias", "vencida há 3 dias") para o mensalista; login por "CPF, e-mail ou usuário" |
| 3. Controle e liberdade | "Voltar" em todos os fluxos; "Sair" no menu da conta; corrigir placa e cancelar entrada enquanto o veículo está no pátio; ticket perdido na saída |
| 4. Consistência | Vocabulário único de situação (Em dia, A vencer, Vencida, Paga) e regra única de cor em [situacao.ts](src/domain/situacao.ts); datas sempre dd/mm/aaaa hh:mm; dados de exemplo sem repetição de placa/vaga entre avulso e mensalista |
| 5. Prevenção de erros | Validação de placa (Mercosul e antiga); bloqueio de entrada duplicada; vagas ocupadas não podem ser escolhidas; moto só no setor de motos; troco calculado e valor insuficiente bloqueado; conferência antes de pagamento, liberação de vaga e novo contrato |
| 6. Reconhecimento | Lista de veículos no pátio filtrada enquanto se digita; forma de pagamento e tipo de veículo em listas; coluna "Mensalidade" |
| 7. Eficiência | Atalhos F2 (entrada) e F4 (saída); campo de busca aceita leitor de código de barras do ticket; atalhos de valor (exato, R$ 50, R$ 100); filtros rápidos e ordenação por coluna; indicadores clicáveis |
| 8. Minimalismo | Placa como campo principal; modelo/cor opcional; indicadores numa faixa única; uma ação principal por tela |
| 9. Diagnóstico de erros | Mensagens que dizem o que aconteceu e o que fazer (placa não encontrada, duplicada, setor lotado, cartão recusado, impressora, sem conexão); padrão visual borda + ícone + texto, sem depender só de cor; dados digitados preservados |
| 10. Ajuda | Recuperação de senha; dicas nos campos; legenda das situações; tabela de tarifas para consulta; contato e perguntas frequentes para o mensalista |

## Acessibilidade e desempenho

- Toda sinalização de status tem texto e ícone além da cor. Vagas ocupadas são hachuradas e escritas "Ocupada".
- O foco aparece como a faixa amarela com borda escura. Na troca de página, o foco vai para o conteúdo e há link "Pular para o conteúdo".
- Os diálogos usam `<dialog>` nativo, com o foco preso dentro e devolvido ao fechar.
- Cada perfil é um pacote JavaScript separado, carregado só depois do login e já pré-carregado durante o "Entrando…". O mensalista nunca baixa o código do caixa.
- As fontes são servidas pelo próprio app, apenas nos pesos usados e sem chamadas a terceiros.
- Valores em centavos (inteiros) evitam erro de arredondamento.

## LGPD

- A listagem de mensalistas mostra só os dígitos centrais do CPF (`***.456.789-**`).
- A sessão guarda apenas identificação e perfil, nada de senha.
- Todos os nomes, CPFs e placas do protótipo são fictícios.

## Fora do escopo deste protótipo

Gerenciar tarifas (RF05), relatórios (RF06), fechamento de caixa, pátio/mapa de vagas e histórico de acessos do mensalista. As tarifas aparecem só para consulta.
