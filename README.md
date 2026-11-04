# ParkFlow

Protótipo navegável do ParkFlow, sistema de gestão de estacionamento, com as correções da avaliação heurística (Nielsen) aplicadas.

Feito só com **HTML, CSS e JavaScript puro**: sem framework, sem instalação e sem build.

## Como abrir

Dê dois cliques em `index.html` para abrir no navegador.

Acessos de demonstração (senha `parkflow` para todos):

| Perfil | Usuário | Abre em |
|---|---|---|
| Operador / Caixa | `operador01` | Visão do turno |
| Gerente | `gerente01` | Mensalistas |
| Mensalista | `123.456.789-09` | Minhas faturas |

Placas para testar:

| Placa | O que mostra |
|---|---|
| `ABC1D23` | Na entrada: placa duplicada. Na saída: cálculo padrão (2h 48min) |
| `QRS2E45` | Na saída, com cartão: pagamento recusado |
| `KLM4G56` | Saída dentro da tolerância, sem cobrança |
| `DEF5H67` | Permanência acima de 24 h (diária) |
| `BRU2C34` | Mensalista com mensalidade vencida |

## Arquivos

```
index.html          Tela 1: Login (e recuperação de senha)
inicio.html         Tela 2: Visão do turno (operador)
entrada.html        Tela 3: Registrar entrada (operador)
saida.html          Tela 4: Registrar saída e pagamento (operador)
mensalistas.html    Tela 5: Gerenciar mensalistas (gerente)
faturas.html        Tela 6: Minhas faturas (mensalista)

css/estilo.css      Todo o visual
js/dados.js         Dados de exemplo (fictícios)
js/regras.js        Validação da placa, cálculo da tarifa, situação e formatação
js/comum.js         Funções usadas em todas as telas (menu, erros, avisos)
js/<tela>.js        Comportamento de cada tela
```

Os dados ficam só na memória da página. Ao trocar de tela ou recarregar, eles voltam ao início. Num protótipo isso basta: cada tela mostra o próprio fluxo completo.

## Correções da avaliação heurística

| Heurística | Como foi aplicada |
|---|---|
| 1. Visibilidade do status | "Atualizado às hh:mm:ss" e atualização a cada 30 s na Visão do turno; "Caixa aberto desde 06:00"; estados "Entrando…", "Imprimindo ticket…", "Ticket impresso" + "Reimprimir", "Aguardando confirmação do pagamento…" |
| 2. Mundo real | Cálculo da tarifa explicado parcela por parcela; "Valor cobrado" e prazo ("faltam 6 dias") para o mensalista; login por "CPF, e-mail ou usuário" |
| 3. Controle e liberdade | "Voltar" nos fluxos; "Sair" no menu do usuário; cancelar entrada registrada por engano; ticket perdido |
| 4. Consistência | Vocabulário único (Em dia, A vencer, Vencida, Paga); verde = regular, vermelho = só problema, neutro = entrada e saída; datas em dd/mm/aaaa hh:mm |
| 5. Prevenção de erros | Validação da placa; bloqueio de entrada duplicada; só vagas livres podem ser escolhidas; moto só no setor de motos; troco calculado e valor insuficiente bloqueado; conferência antes de confirmar pagamento e salvar contrato |
| 6. Reconhecimento | Lista dos veículos no pátio na saída, filtrada enquanto se digita; forma de pagamento e tipo de veículo em listas; coluna "Mensalidade" |
| 7. Eficiência | Atalhos F2 (entrada) e F4 (saída); busca aceita leitor de código de barras; filtros e ordenação na tabela; indicadores clicáveis |
| 8. Minimalismo | Placa como campo principal; modelo/cor opcional; uma ação principal por tela |
| 9. Diagnóstico de erros | Mensagens que dizem o que houve e o que fazer; erro com borda e texto, nunca só cor; dados digitados preservados |
| 10. Ajuda | Recuperação de senha; dicas nos campos; legenda das situações; contato e perguntas frequentes para o mensalista |

## Limites do protótipo

- Não há servidor: login, pagamento e impressão são simulados com uma pequena espera.
- Ficaram fora do escopo: gerenciar tarifas, relatórios, fechamento de caixa e histórico de acessos.
- Todos os nomes, CPFs e placas são fictícios. A lista de mensalistas mostra só parte do CPF (LGPD).
