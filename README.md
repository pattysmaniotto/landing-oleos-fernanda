# 🌿 Landing de Óleos Essenciais — Fernanda Delgado

Landing page de vendas dos óleos essenciais doTERRA, com:
- ✅ Catálogo de produtos
- ✅ Formulário com autocomplete de CEP
- ✅ Pagamento via PIX
- ✅ Botão "Enviar comprovante no WhatsApp"
- ✅ Salva pedidos no Google Sheets
- ✅ Email de alerta pra você a cada pedido novo

---

## 📁 Estrutura dos arquivos

```
LANDING OLEOS/
├── index.html              ← a página em si
├── styles.css              ← visual (cores dourado/creme da Fernanda)
├── script.js               ← interações (carrinho, CEP, PIX, etc)
├── produtos.json           ← LISTA DE ÓLEOS + chave PIX (edite aqui!)
├── app.py                  ← servidor (Flask)
├── requirements.txt        ← bibliotecas Python
├── .env.example            ← modelo das configurações
├── .env                    ← suas configurações REAIS (não commitar!)
├── credentials.json        ← chave do Google Sheets (você coloca)
├── imagens/                ← fotos dos óleos
│   ├── frankincense-15ml.jpg
│   └── olibano-aroma-natural-5ml.webp
└── README.md               ← este arquivo
```

---

## 🛒 COMO ADICIONAR OU MUDAR ÓLEOS

Abra o arquivo **`produtos.json`** e edite a lista. Para cada óleo:

```json
{
  "id": "lavanda-15ml",
  "nome": "Lavanda",
  "nome_pt": "Lavanda",
  "tamanho": "15ml",
  "preco": 235.00,
  "imagem": "imagens/lavanda-15ml.jpg",
  "descricao_curta": "Calma, sono reparador e pele tranquila.",
  "categoria": "bem-estar",
  "destaque": true
}
```

| Campo | O que colocar |
|-------|---------------|
| `id` | Identificador único (sem espaço, sem acento) |
| `nome` | Nome do óleo como aparece no rótulo |
| `nome_pt` | Nome em português (opcional) |
| `tamanho` | "5ml", "15ml", "30ml"... |
| `preco` | Preço em reais (use PONTO, não vírgula: 235.00) |
| `imagem` | Caminho da foto dentro da pasta `imagens/` |
| `descricao_curta` | Frase de 1 linha sobre o uso |
| `categoria` | "bem-estar", "culinario", "energia"... |
| `destaque` | `true` se quiser mostrar primeiro |

**Importante:** depois de adicionar, salve a foto do óleo na pasta `imagens/` com o mesmo nome do campo `imagem`.

---

## 💳 COMO MUDAR A CHAVE PIX

Abra **`produtos.json`** e troque:

```json
"chave_pix": "TROCAR_PELA_CHAVE_PIX_DA_FERNANDA",
"titular_pix": "Fernanda Delgado"
```

Pela chave real e o nome do titular (igual aparece no banco).

---

## 🧪 TESTAR LOCALMENTE (antes de publicar)

### 1. Instalar Python
Baixe em https://www.python.org/downloads/ (versão 3.11 ou superior)

### 2. Abrir o terminal na pasta do projeto
```bash
cd "C:\Users\agenc\Desktop\CLIENTES\FERNANDA DELGADO\LANDING OLEOS"
```

### 3. Criar ambiente virtual e instalar dependências
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Configurar o `.env`
- Copie o arquivo `.env.example` e renomeie a cópia para `.env`
- Preencha o `GMAIL_USER` e `GMAIL_APP_PASSWORD` (gere a senha em https://myaccount.google.com/apppasswords)

### 5. Rodar
```bash
python app.py
```

Acesse http://localhost:5000 no navegador.

> 💡 **Dica:** mesmo sem configurar Google Sheets e Gmail, a landing funciona — só não vai salvar/enviar emails. Você testa o visual e o fluxo.

---

## 🚀 PUBLICAR NO RENDER (pra ficar no ar de verdade)

### 1. Subir pro GitHub
- Crie um repositório novo no GitHub
- Suba TUDO desta pasta, **EXCETO** o `.env` e o `credentials.json` (esses ficam só no Render)

### 2. Criar Web Service no Render
1. Acesse https://render.com e faça login
2. Clique em **"New +"** → **"Web Service"**
3. Conecte o repositório do GitHub
4. Configure:
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Instance Type:** Free

### 3. Adicionar variáveis de ambiente
No painel do Render, vá em **Environment** e adicione:
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `EMAIL_DESTINO`
- `GOOGLE_SHEET_ID`
- `PYTHON_VERSION` → `3.11.0`

### 4. Adicionar `gunicorn` no requirements
Edite o `requirements.txt` e adicione:
```
gunicorn==21.2.0
```

### 5. Fazer deploy
Render detecta automaticamente e publica. A URL fica tipo: `https://landing-oleos-fernanda.onrender.com`

---

## 📊 CONFIGURAR GOOGLE SHEETS (pra salvar os pedidos)

### 1. Criar a planilha
1. Acesse https://sheets.google.com
2. Crie uma planilha nova: "Pedidos — Óleos Fernanda"
3. Copie o **ID** da URL (o código grande entre `/d/` e `/edit`):
   ```
   https://docs.google.com/spreadsheets/d/ESSE_CODIGO_AQUI/edit
   ```

### 2. Criar Service Account (a "chave" que o sistema usa)
1. Acesse https://console.cloud.google.com
2. Crie um projeto novo (ou use um existente)
3. Ative a API: **Google Sheets API** e **Google Drive API**
4. Vá em **IAM & Admin** → **Service Accounts** → **Create Service Account**
5. Dê um nome (ex: "Landing Oleos")
6. Em **Keys** → **Add Key** → **Create new key** → **JSON**
7. Baixe o arquivo e renomeie para `credentials.json`
8. Coloque o arquivo na pasta do projeto

### 3. Compartilhar a planilha com o Service Account
1. Abra o `credentials.json` e copie o email (campo `client_email`)
   ```
   Exemplo: landing-oleos@seu-projeto.iam.gserviceaccount.com
   ```
2. Na planilha do Google Sheets, clique em **"Compartilhar"**
3. Cole esse email e dê permissão de **Editor**

### 4. Configurar no `.env` (ou no Render)
```
GOOGLE_SHEET_ID=ESSE_CODIGO_AQUI
GOOGLE_CREDENTIALS_PATH=credentials.json
```

A primeira linha do Google Sheets será criada automaticamente quando chegar o primeiro pedido.

---

## 📧 CONFIGURAR GMAIL (pra receber alertas)

### 1. Ativar verificação em duas etapas
https://myaccount.google.com/security

### 2. Gerar senha de app
1. Acesse https://myaccount.google.com/apppasswords
2. Em "Nome do app" digite: `Landing Oleos Fernanda`
3. Clique em **"Criar"**
4. Copie a senha de 16 letras (tipo: `abcd efgh ijkl mnop`)

### 3. Colocar no `.env`
```
GMAIL_USER=seuemail@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
EMAIL_DESTINO=seuemail@gmail.com
```

Pronto! A cada pedido novo você recebe um email lindo no Gmail com todos os dados.

---

## 📱 COMO USAR A PESSOA COMPRA?

1. Acessa a landing (link do Instagram, bio, etc)
2. Escolhe os óleos no catálogo
3. Preenche o formulário (CEP autopreenche!)
4. Clica em "Finalizar pedido"
5. Vê a tela com a chave PIX
6. Paga no app do banco
7. Clica em "Enviar comprovante no WhatsApp"
8. WhatsApp abre com a mensagem pronta, é só mandar

**Enquanto isso:**
- Você recebe o email de alerta
- O pedido aparece no Google Sheets
- A Fernanda pode acompanhar a planilha

---

## 🆘 PROBLEMAS COMUNS

### "Não tô conseguindo gerar a senha de app do Gmail"
→ Precisa ativar a verificação em duas etapas primeiro. É rapidinho.

### "O email não tá chegando"
→ Verifica a pasta de spam. Confere se a senha de app tá certa (sem espaços extras).

### "O pedido não tá salvando na planilha"
→ Compartilhou a planilha com o email do service account? Colocou o ID certo no `.env`?

### "A página tá lenta / não carrega"
→ Render free hiberna depois de 15min sem uso. Primeira requisição demora ~30s. Solução: plano pago (Starter $7/mês) ou script de "ping".

### "Mudei o preço mas não aparece"
→ Limpa o cache do navegador (Ctrl+Shift+R) ou testa em aba anônima.

---

## 📞 Suporte

Dúvidas ou problemas? Fala com o Claude Code que ele te ajuda! 🌻
