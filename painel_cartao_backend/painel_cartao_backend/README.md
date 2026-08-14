# Painel de pendências de NF (cartão corporativo) — backend compartilhado

API simples que conecta o painel HTML a uma Google Sheet, para que todo mundo
que abrir o painel veja as mesmas pendências, sempre atualizadas — sem
depender do navegador de cada um.

## Como funciona

1. O painel HTML (`painel_cartao_corporativo.html`) fala com esta API.
2. A API lê e grava direto numa aba do Google Sheets.
3. Toda pessoa que configurar o painel com o mesmo endereço do servidor vê os
   mesmos dados, atualizados automaticamente a cada poucos segundos.

---

## Passo 1 — Estrutura da Google Sheet

Crie (ou use) uma planilha com uma aba chamada **Pendencias** com estas
colunas na linha 1:

| ID | Colaborador | Telefone | Cartao | Departamento | Fornecedor | Valor | DataCompra | PrazoDias | Observacao | Recebida | DataRecebimento |
|----|-------------|----------|--------|---------------|------------|-------|------------|-----------|------------|----------|------------------|

- **DataCompra**: formato `AAAA-MM-DD`.
- **Recebida**: `TRUE` ou `FALSE`.
- **ID**, **DataRecebimento**: deixe vazio ao criar a linha manualmente — o
  próprio painel preenche quando você cadastra por lá.

---

## Passo 2 — Conta de serviço do Google (acesso à planilha)

1. Acesse [console.cloud.google.com](https://console.cloud.google.com), crie
   um projeto (ou use um existente).
2. Ative a **Google Sheets API**.
3. Vá em **Credenciais → Criar credenciais → Conta de serviço**.
4. Crie a conta de serviço, depois gere uma **chave JSON** (fica disponível
   pra download uma vez só).
5. Abra sua Google Sheet e **compartilhe** ela com o e-mail da conta de
   serviço (algo como `nome@projeto.iam.gserviceaccount.com`), dando
   permissão de **Editor**.
6. Cole o conteúdo inteiro do JSON baixado (em uma linha só) na variável
   `GOOGLE_SERVICE_ACCOUNT_JSON` do `.env`.

---

## Passo 3 — Configurar e rodar localmente (opcional, pra testar)

```bash
cp .env.example .env
# preencha GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_JSON e PANEL_TOKEN

npm install
npm start
```

Teste rápido:

```bash
curl https://localhost:3000/api/pendencias -H "x-panel-token: SEU_PANEL_TOKEN"
```

---

## Passo 4 — Deploy no Railway

1. Suba esta pasta num repositório no GitHub.
2. No Railway, **New Project → Deploy from GitHub repo**.
3. Em **Variables**, cole `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB`,
   `GOOGLE_SERVICE_ACCOUNT_JSON` e `PANEL_TOKEN` (não suba o `.env` pro
   repositório — ele já deve estar no `.gitignore`).
4. O Railway detecta o `package.json` e roda `npm start` automaticamente.
5. Você recebe uma URL pública, tipo `https://seu-app.up.railway.app`.

---

## Passo 5 — Conectar o painel HTML

1. Abra o `painel_cartao_corporativo.html` (local ou hospedado onde quiser).
2. Clique no ícone **⚙** no topo.
3. Preencha:
   - **Endereço do servidor**: a URL do Railway.
   - **Chave de acesso**: o mesmo valor de `PANEL_TOKEN`.
4. Salvar. Pronto — o painel já lê e grava na planilha compartilhada.

Repita o passo 5 em cada computador/navegador que for usar o painel — é uma
configuração local de cada dispositivo, não precisa mexer no servidor de novo.

---

## Rotas da API

Todas exigem o header `x-panel-token`.

| Rota | Método | O que faz |
|---|---|---|
| `/api/pendencias` | GET | Lista todas as pendências |
| `/api/pendencias` | POST | Cria uma nova pendência |
| `/api/pendencias/:id/receber` | POST | Marca como NF recebida |
| `/api/pendencias/:id` | DELETE | Remove o registro |
