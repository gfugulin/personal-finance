# Pluggy Sync Runbook — Personal Finance

**Projeto:** Personal Finance Mobile  
**Ambiente atual:** Next.js + Vercel + Supabase + Pluggy  
**Objetivo deste documento:** ser a fonte técnica de verdade para conectar, sincronizar, depurar e manter dados financeiros da Pluggy corretamente, com foco no Nubank/Open Finance.

---

## 1. Diagnóstico executivo do erro atual

No console atual existem dois tipos de mensagens:

### 1.1. Avisos `Permissions policy violation: unload`

Esses avisos vêm de scripts carregados pelo Pluggy Connect/iframe e pelo navegador. Eles não são, por si só, evidência de falha de sincronização.

**Não usar esses warnings como causa raiz do problema.**

### 1.2. Erro relevante

```text
POST /api/connections/sync
500 Internal Server Error
```

Esse é o ponto que precisa ser depurado.

O navegador está conseguindo executar a interface e chegar ao endpoint do seu próprio backend. O `500` significa que a função do seu aplicativo falhou durante o processo de atualização/sincronização ou ao persistir o resultado.

A primeira ação de diagnóstico deve ser abrir os logs da Function na Vercel para **essa chamada exata** e registrar:

- status upstream retornado pela Pluggy;
- `itemId` envolvido;
- status atual do Item;
- erro do Supabase, caso exista;
- stack trace server-side;
- etapa em que a função falhou.

Nunca retorne somente `500 Internal Server Error` sem um `requestId` e uma mensagem interna segura nos logs.

---

# 2. Modelo mental correto da Pluggy

A integração deve ser entendida em cinco camadas:

```text
USUÁRIO
   │
   ▼
PLUGGY CONNECT
   │ cria/atualiza
   ▼
ITEM
   │ possui
   ├── ACCOUNTS
   │      └── TRANSACTIONS
   │
   └── INVESTMENTS
          └── INVESTMENT TRANSACTIONS
```

## 2.1. Application

É o cadastro da aplicação no dashboard da Pluggy.

Fornece:

- Client ID
- Client Secret

Essas credenciais ficam somente no servidor.

## 2.2. API Key

Seu servidor autentica:

```http
POST https://api.pluggy.ai/auth
Content-Type: application/json

{
  "clientId": "...",
  "clientSecret": "..."
}
```

Resposta:

```json
{
  "apiKey": "..."
}
```

A API Key atualmente expira em aproximadamente **2 horas**.

**Não gerar uma nova API Key em toda chamada**. Reutilize-a server-side até perto da expiração.

## 2.3. Connect Token

Seu backend usa a API Key para criar um token temporário para o Pluggy Connect.

```json
{
  "options": {
    "clientUserId": "<supabase-user-id>",
    "oauthRedirectUri": "https://SEU-APP/conectar/retorno",
    "avoidDuplicates": true
  }
}
```

O Connect Token atualmente expira em cerca de **30 minutos**.

Ele pode ser enviado ao frontend. O Client Secret e a API Key, não.

## 2.4. Item

`Item` é a conexão de um usuário com uma instituição financeira.

Exemplo:

```text
Usuário Gustavo
  └── Item Nubank abc-123
```

O `itemId` precisa ser salvo localmente.

A tabela `financial_connections` deve ser a referência que liga:

```text
Supabase user
↔ financial_connection
↔ Pluggy itemId
```

## 2.5. Produtos

Depois que o Item termina a coleta, os dados são lidos através de produtos:

- Accounts
- Transactions
- Credit Cards (como accounts do tipo CREDIT)
- Investments
- Investment Transactions

Para Nubank via Open Finance, a documentação atual da Pluggy lista cobertura para contas, transações, cartões, investimentos e transações de investimento.

---

# 3. Fluxo end-to-end recomendado

```text
1. Usuário autenticado no app
        ↓
2. Backend cria Connect Token
        ↓
3. Pluggy Connect abre
        ↓
4. Usuário seleciona instituição
        ↓
5. Open Finance / autenticação
        ↓
6. Item é criado
        ↓
7. Item fica UPDATING
        ↓
8. Item termina UPDATED
        ↓
9. item/created ou item/updated
        ↓
10. Backend sincroniza dados
        ↓
11. Accounts
        ↓
12. Transactions
        ↓
13. Investments
        ↓
14. Supabase
        ↓
15. Classificação financeira/fiscal
        ↓
16. Dashboard lê apenas Supabase
```

**O frontend não deve consultar Nubank a cada abertura do aplicativo.**

A Pluggy é a fonte upstream. O Supabase é o read model da aplicação.

---

# 4. Autenticação e Connect Token

## 4.1. Requisitos

O endpoint de Connect Token deve:

1. validar sessão Supabase;
2. validar AAL2/MFA;
3. identificar `auth.uid()`;
4. criar Connect Token server-side;
5. usar `clientUserId = auth.uid()`;
6. retornar somente `accessToken`.

Exemplo de resposta para o browser:

```json
{
  "accessToken": "TOKEN_TEMPORARIO"
}
```

## 4.2. `clientUserId`

Use sempre:

```text
clientUserId = Supabase auth.uid()
```

Isso permite mapear eventos de Item ao usuário.

**Importante:** `clientUserId` é enviado em eventos `item/*`, mas não em eventos `transactions/*`.

Em webhooks de transações, o usuário deve ser descoberto via:

```text
itemId
→ financial_connections
→ user_id
```

## 4.3. OAuth redirect

Para Open Finance/mobile:

```text
https://personal-finance-beta-silk.vercel.app/conectar/retorno
```

O fluxo precisa tolerar:

```text
App
→ banco
→ autorização
→ browser retorna
→ app verifica Item
```

---

# 5. Ciclo de vida do Item

Status principais:

| Status | Significado | Ação do app |
|---|---|---|
| `UPDATING` | sincronização em andamento | mostrar "Sincronizando" |
| `UPDATED` | sincronização terminou | buscar/persistir dados |
| `OUTDATED` | execução terminou com erro recuperável | mostrar atenção e detalhes |
| `LOGIN_ERROR` | credenciais/autorização falhou | solicitar reconexão |
| `WAITING_USER_INPUT` | precisa de MFA/input | abrir fluxo de atualização |
| `WAITING_USER_ACTION` | usuário precisa agir no banco | mostrar instrução |

O app também deve observar:

- `executionStatus`
- `executionReport`
- `lastUpdatedAt`
- erro retornado no Item

Um Item `UPDATED` pode ter:

```text
executionStatus = SUCCESS
```

ou:

```text
executionStatus = PARTIAL_SUCCESS
```

Por isso, não basta olhar apenas `status === UPDATED`.

---

# 6. Sincronização inicial

Na primeira conexão, a Pluggy pode disponibilizar aproximadamente **até 365 dias de histórico**, conforme instituição/produto.

Após Item `UPDATED`:

## 6.1. Buscar contas

```http
GET /accounts?itemId={itemId}
```

Persistir por:

```text
UNIQUE(connection_id, external_account_id)
```

Nunca inserir cegamente.

## 6.2. Para cada conta, buscar transações

```http
GET /transactions?accountId={accountId}&pageSize=500&page=1
```

Continue até:

```text
page >= totalPages
```

### Erro a evitar

Não limitar arbitrariamente:

```text
page <= 5
```

Se houver mais de 500 transações, o histórico fica incompleto.

Use paginação real até `totalPages`.

## 6.3. Buscar investimentos

```http
GET /investments?itemId={itemId}
```

Também é paginado.

Armazene separadamente:

- valor atual;
- valor originalmente investido;
- quantidade;
- valor unitário;
- data de referência.

Não confunda patrimônio atual com aportes.

## 6.4. Investment Transactions

Quando suportado, buscar pelo endpoint paginado específico.

Não usar o campo antigo/deprecated `investment.transactions` como fonte principal.

---

# 7. Sincronização incremental correta

Este é o ponto mais importante para manter o aplicativo atualizado.

Não refaça o histórico inteiro a cada webhook.

Configure:

- `transactions/created`
- `transactions/updated`
- `transactions/deleted`
- `item/updated`
- `item/error`
- `item/waiting_user_input`
- `item/waiting_user_action`

## 7.1. `transactions/created`

A Pluggy envia:

```json
{
  "event": "transactions/created",
  "itemId": "...",
  "accountId": "...",
  "eventId": "...",
  "transactionsCount": 332,
  "createdTransactionsLink": "https://api.pluggy.ai/transactions?accountId=...&createdAtFrom=..."
}
```

**Use `createdTransactionsLink`.**

Fluxo:

```text
webhook
→ validar secret
→ deduplicar eventId
→ GET createdTransactionsLink
→ paginar se necessário
→ UPSERT transações
→ classificar
```

Não é necessário refazer todas as contas do Item.

## 7.2. `transactions/updated`

Payload contém `transactionIds`.

Fluxo:

```text
webhook
→ transactionIds
→ GET /transactions?accountId=X&ids=id1,id2...
→ UPSERT registros existentes
→ recalcular classificações dependentes
```

Mudanças recentes da Pluggy indicam que eventos grandes de `transactions/updated` são quebrados em lotes que cabem na consulta suportada.

## 7.3. `transactions/deleted`

Payload contém:

- `itemId`
- `accountId`
- `transactionIds`

Não faça hard delete imediatamente.

Recomendado:

```text
status = DELETED
deleted_at = now()
```

Excluir essas linhas dos cálculos.

---

# 8. Atualização manual e automática

## 8.1. Atualização automática

Em aplicações Production, a Pluggy atualiza Items automaticamente. A frequência depende do plano/configuração.

O aplicativo deve depender dos webhooks para saber que o processo terminou.

## 8.2. Atualização manual

Opções:

### Connect Widget update mode

Crie Connect Token com:

```text
itemId = item existente
```

É o fluxo recomendado quando pode ser necessária interação do usuário.

### API

```http
PATCH /items/{itemId}
```

Isso dispara nova sincronização.

**Não confundir:**

```text
PATCH /items
```

com:

```text
"baixar os dados agora"
```

O PATCH apenas inicia o processo.

Depois:

```text
UPDATING
→ ...
→ UPDATED
→ item/updated webhook
→ sincronizar dados para Supabase
```

### Rate/frequency

A documentação informa restrições de frequência para atualizações diretas via API em determinados client IDs novos.

Portanto seu endpoint `/api/connections/sync` deve preservar o status real retornado pela Pluggy:

- 400
- 409
- 429/limite, quando aplicável
- 500 upstream

Não transforme todo erro da Pluggy em `500` genérico.

---

# 9. Janela de reconciliação do Open Finance

Na atualização de conectores regulados/Open Finance, a Pluggy faz uma janela de reconciliação de aproximadamente:

```text
hoje + 6 dias anteriores
= 7 dias corridos
```

Isso existe porque transações podem mudar após a primeira coleta.

Consequência arquitetural:

**transactions/updated e transactions/deleted são obrigatórios.**

Não trate uma transação importada como imutável.

---

# 10. Webhooks — confiabilidade

## 10.1. Regra de entrega

O endpoint deve responder `2xx` em até aproximadamente **10 segundos**.

A Pluggy realiza tentativas de reenvio em falhas elegíveis.

Erros 4xx específicos não são reenviados.

## 10.2. Segurança

Configure o webhook via API com header customizado:

```json
{
  "url": "https://personal-finance-beta-silk.vercel.app/api/webhooks/pluggy",
  "event": "all",
  "headers": {
    "X-Finance-Webhook-Secret": "<secret>"
  }
}
```

O dashboard não mostra/configura esses headers sensíveis; a documentação indica configuração via API.

## 10.3. Idempotência

Tabela:

```text
processed_webhook_events
```

Chave:

```text
event_id PRIMARY KEY
```

Fluxo:

```text
recebe eventId
→ já existe?
   sim → 200 duplicate
   não → registrar
```

## 10.4. Não perder evento por erro interno

Evite:

```text
catch qualquer erro
→ retornar 200
```

sem garantir que exista uma rotina durável de reprocessamento.

Existem duas estratégias aceitáveis:

### A. processamento rápido síncrono

Se falhar por erro temporário:

```text
retornar 5xx
```

para permitir retry.

### B. persistência + background

```text
persist event
→ responder 2xx
→ processar com mecanismo durável
```

Para um MVP em Vercel, use uma abordagem simples, mas não reconheça definitivamente um evento que será perdido.

---

# 11. Semântica de valores — armadilha crítica

## 11.1. Conta bancária

Em conta BANK:

```text
entrada → amount positivo
saída   → amount negativo
```

## 11.2. Cartão de crédito

A documentação da Pluggy usa semântica diferente:

```text
compra/despesa no cartão → amount POSITIVO
pagamento/crédito        → amount NEGATIVO
```

**Isso é extremamente importante.**

### Problema observado no código atual

A implementação atual possui lógica equivalente a:

```ts
if (accountType === 'CREDIT') {
  if (amount < 0) return 'EXPENSE'
  if (amount > 0) return 'CARD_PAYMENT'
}
```

Essa lógica está invertida em relação à documentação oficial da Pluggy.

O correto deve considerar:

```text
CREDIT + amount > 0
→ normalmente EXPENSE

CREDIT + amount < 0
→ pagamento, estorno ou crédito
→ classificar usando descrição/metadados
```

Não classifique automaticamente todo valor negativo de cartão como `CARD_PAYMENT`, pois pode existir estorno/crédito.

Use:

1. account type;
2. sinal;
3. descrição;
4. metadados/provider category;
5. regras;
6. REVIEW se incerto.

---

# 12. Semântica de saldo de cartão

Para conta CREDIT, `balance` representa o valor em aberto/limite utilizado conforme o conector/Open Finance.

Não interpretar como dinheiro disponível.

Persistir também quando disponíveis:

- `creditLimit`
- `availableCreditLimit`
- `balanceDueDate`
- `balanceCloseDate`

No projeto atual existem colunas de vencimento/fechamento, mas a rotina de sync deve garantir que elas sejam preenchidas a partir de `creditData`.

---

# 13. Categorias e classificação

A categoria da Pluggy é útil como sugestão, mas não é sua regra financeira final.

Pipeline recomendado:

```text
Transação Pluggy
    ↓
Normalizar conta/sinal
    ↓
Detectar CARD_PAYMENT
    ↓
Detectar TRANSFER
    ↓
Detectar INVESTMENT
    ↓
Regra pessoal
    ↓
Categoria Pluggy
    ↓
UNKNOWN / REVIEW
```

Fiscal:

```text
financeiro
+
contexto
+
regra pessoal
    ↓
tax treatment
```

Nunca:

```text
amount > 0
→ TAXABLE_INCOME
```

---

# 14. Investimentos

A posição de investimento pode conter:

- `value`: valor unitário atual;
- `quantity`;
- `amount`: valor bruto;
- `balance`: valor líquido atual;
- `amountOriginal`: valor originalmente investido;
- `amountProfit`;
- `date`: data de referência.

Recomendação:

```text
current_value = balance, quando semanticamente disponível
fallback = amount
```

```text
contributed_value = amountOriginal
```

Nunca calcular:

```text
aportes = variação do current_value
```

porque valorização/desvalorização não é aporte.

---

# 15. Auditoria do projeto atual

Com base no snapshot atual do repositório, estes pontos merecem revisão prioritária.

## 15.1. Sinal do cartão de crédito

**Prioridade: crítica**

A lógica de `inferFinancialNature` está invertendo o sinal documentado para conta CREDIT.

Corrigir antes de confiar em gastos e fatura.

## 15.2. Paginação inicial

**Prioridade: alta**

A rotina atual limita transações a cinco páginas de 100.

Isso pode truncar histórico.

Usar `pageSize=500` e percorrer `totalPages`.

## 15.3. `transactions/created`

**Prioridade: alta**

A implementação atual tende a chamar `syncItemData(itemId)`.

Melhor:

```text
createdTransactionsLink
→ buscar somente novas transações
```

## 15.4. `transactions/updated`

**Prioridade: alta**

Usar `transactionIds` do webhook em vez de ressincronizar o Item inteiro.

## 15.5. `item/updated`

Esse evento deve ser interpretado como:

```text
coleta da instituição terminou
```

e pode acionar reconciliação de:

- accounts;
- investments;
- dados que não possuem webhook granular.

Não precisa sempre reprocessar um ano inteiro de transações.

## 15.6. Webhook 200 em erro

Se o código retorna `200` após falha de processamento sem fila de reprocessamento, o evento pode ser perdido.

Criar política clara de retry.

## 15.7. Observabilidade insuficiente

Cada sync deve gerar logs estruturados:

```text
requestId
itemId
connectionId
eventId
eventType
stage
durationMs
upstreamStatus
accountCount
transactionCreatedCount
transactionUpdatedCount
transactionDeletedCount
investmentCount
```

Não logar payload financeiro sensível.

---

# 16. Diagnóstico do `POST /api/connections/sync 500`

## Passo 1 — abrir Vercel Function Logs

Filtrar:

```text
/api/connections/sync
```

Registrar erro exato.

## Passo 2 — conferir entrada

Esperado:

```json
{
  "connectionId": "... "
}
```

Backend deve buscar:

```text
connectionId
→ user_id
→ external_item_id
```

Nunca aceitar `itemId` arbitrário do frontend sem verificar propriedade.

## Passo 3 — conferir estado do Item antes de atualizar

```http
GET /items/{itemId}
```

Registrar:

```text
status
executionStatus
lastUpdatedAt
error
```

## Passo 4 — acionar update

```http
PATCH /items/{itemId}
```

Se a Pluggy retornar erro, repassar semântica correta.

Exemplo:

```text
Pluggy 409
→ seu endpoint não deveria virar 500 genérico
```

## Passo 5 — não executar full sync imediatamente

Depois de `PATCH`:

```text
status pode ser UPDATING
```

Não assuma que dados já estão prontos.

Espere:

```text
item/updated
```

ou consulte o status de forma controlada.

## Passo 6 — quando UPDATED, persistir

Então:

```text
accounts
investments
transações incrementais
```

## Passo 7 — conferir Supabase

Erros comuns:

- `SUPABASE_SECRET_KEY` ausente no ambiente Production;
- tabela/migration não aplicada;
- enum incompatível;
- foreign key de `user_id`;
- RLS/client incorreto;
- valor `undefined` em campo não aceito;
- upsert com `onConflict` diferente do índice real.

---

# 17. Contrato recomendado para `/api/connections/sync`

Request:

```json
{
  "connectionId": "uuid"
}
```

Resposta quando update foi iniciado:

```http
202 Accepted
```

```json
{
  "status": "SYNC_REQUESTED",
  "connectionId": "...",
  "itemStatus": "UPDATING"
}
```

Se já está atualizando:

```http
409 Conflict
```

```json
{
  "code": "ITEM_ALREADY_UPDATING"
}
```

Se Pluggy limitar frequência:

```http
429 Too Many Requests
```

ou o status apropriado recebido, traduzido em código interno.

Nunca mascarar tudo como:

```text
500
```

---

# 18. Arquitetura de sync recomendada para este aplicativo

```text
[Botão Atualizar]
       │
       ▼
POST /api/connections/sync
       │
       ├── auth + AAL2
       ├── resolve connection
       ├── PATCH Pluggy Item
       │
       └── 202 SYNC_REQUESTED
                │
                ▼
           PLUGGY SYNC
                │
       ┌────────┴─────────┐
       ▼                  ▼
transactions/*       item/updated
       │                  │
       ▼                  ▼
transações locais     accounts/investments
       │                  │
       └────────┬─────────┘
                ▼
             SUPABASE
                │
                ▼
        classificação/reports
                │
                ▼
              APP
```

---

# 19. Testes obrigatórios

## Autenticação

- API Key cache;
- Connect Token válido;
- `clientUserId` correto;
- usuário A não atualiza Item de usuário B.

## Inicial

- mais de 500 transações;
- múltiplas páginas;
- BANK + CREDIT;
- investimentos vazios;
- investimentos preenchidos.

## Webhooks

- duplicate `eventId`;
- created com `createdTransactionsLink`;
- updated com múltiplos IDs;
- deleted;
- item/updated sem transação nova;
- falha temporária do Supabase.

## Semântica

- BANK entrada positiva;
- BANK saída negativa;
- CREDIT compra positiva;
- CREDIT pagamento negativo;
- estorno de cartão;
- pagamento da fatura não duplicar gasto.

## Resiliência

- Item UPDATING;
- OUTDATED;
- LOGIN_ERROR;
- PARTIAL_SUCCESS;
- conector OFFLINE/UNSTABLE;
- timeout da Pluggy.

---

# 20. Checklist antes de Nubank real

- [ ] Sandbox cria Item.
- [ ] Item chega em UPDATED.
- [ ] Accounts persistidas.
- [ ] Mais de uma página de transactions testada.
- [ ] `transactions/created` incremental funciona.
- [ ] `transactions/updated` incremental funciona.
- [ ] `transactions/deleted` funciona.
- [ ] `eventId` idempotente.
- [ ] Webhook possui secret customizado.
- [ ] Falha 5xx não é silenciosamente convertida em sucesso.
- [ ] CREDIT amount positivo é tratado como compra.
- [ ] Pagamento de fatura não duplica despesa.
- [ ] Investments persistem com data de referência.
- [ ] `/api/connections/sync` retorna 202 ao iniciar, não espera toda sincronização.
- [ ] Vercel logs possuem `requestId`, `itemId` e etapa.
- [ ] Nenhum secret aparece no browser.
- [ ] Nenhum dado financeiro sensível aparece nos logs.

---

# 21. Ordem recomendada de correção agora

1. Capturar stack do `500` de `/api/connections/sync`.
2. Corrigir contrato do endpoint para apenas iniciar atualização.
3. Corrigir semântica de cartão de crédito.
4. Corrigir paginação inicial completa.
5. Implementar incremental `transactions/created` usando `createdTransactionsLink`.
6. Implementar `transactions/updated` usando `transactionIds`.
7. Validar deleted.
8. Ajustar política de retry do webhook.
9. Adicionar logs estruturados.
10. Rodar Sandbox com cenários normal + erro.
11. Só então testar Nubank real.

---

# 22. Fontes oficiais Pluggy

Documentação consultada:

- Autenticação:
  https://docs.pluggy.ai/pt/reference/authentication

- Connect Token:
  https://docs.pluggy.ai/pt/reference/auth/connect-token-create

- Ciclo de vida do Item:
  https://v2.docs.pluggy.ai/pt/docs/connections/item-lifecycle

- Atualizar Item / sincronização:
  https://docs.pluggy.ai/pt/docs/integration-checklist/data-sync
  https://docs.pluggy.ai/pt/reference/items/items-update

- Atualizar via Connect Widget:
  https://docs.pluggy.ai/pt/docs/connect-widget/updating-item

- Webhooks:
  https://docs.pluggy.ai/pt/reference/webhooks
  https://docs.pluggy.ai/pt/docs/developer-tools/webhooks-ref

- Transações:
  https://docs.pluggy.ai/pt/docs/products/transactions
  https://docs.pluggy.ai/pt/reference/transaction/transactions-list

- Contas / cartão:
  https://docs.pluggy.ai/pt/docs/products/accounts

- Investimentos:
  https://docs.pluggy.ai/pt/docs/products/investments
  https://docs.pluggy.ai/pt/reference/investment/investments-list

- Sandbox:
  https://docs.pluggy.ai/pt/docs/guides/sandbox

- Open Finance:
  https://docs.pluggy.ai/pt/docs/open-finance/overview
  https://docs.pluggy.ai/docs/open-finance-institutions-coverage

---

## Nota final

A sincronização deve ser **event-driven e incremental**.

O erro conceitual mais comum é tratar `PATCH /items/{id}` como se ele já retornasse todo o novo extrato pronto. Ele apenas inicia a coleta.

O modelo robusto é:

```text
disparar atualização
→ aguardar ciclo do Item
→ receber webhooks
→ buscar somente mudanças
→ fazer upsert local
→ recalcular o necessário
```

Esse é o comportamento que o projeto deve implementar antes de ser considerado pronto para uso financeiro real.
