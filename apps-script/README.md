# Como ligar o banco de dados do Briefing

O site é uma página estática (GitHub Pages), então quem guarda os dados de
verdade é uma Google Planilha, com um pequeno script (Google Apps Script)
fazendo de "porteiro" entre o site e a planilha. É grátis e usa sua conta
Google já existente — não precisa criar conta em nada novo.

## Passo a passo (uns 5 minutos)

1. **Crie a planilha.**
   Vá em [sheets.new](https://sheets.new) e crie uma planilha vazia. Dê o
   nome que quiser, ex: `Dynamis — Briefings (banco)`.

2. **Abra o editor de scripts.**
   Menu **Extensões → Apps Script**.

3. **Cole o código.**
   Apague o conteúdo do arquivo `Código.gs` que abrir e cole todo o
   conteúdo do arquivo [`Code.gs`](./Code.gs) desta pasta.

4. **Defina seu token secreto.**
   Nesse código colado, troque a linha:
   ```js
   const TOKEN = 'TROQUE_ESTE_TOKEN';
   ```
   por uma senha só sua, tipo `const TOKEN = 'dynamis-2026-x7f9';`.
   Isso evita que qualquer pessoa que ache a URL consiga ler ou gravar
   briefings — é uma proteção simples, não é uma senha de login de verdade.

5. **Publique como Web App.**
   Clique em **Implantar → Nova implantação**.
   - Tipo: **App da Web**
   - Executar como: **Eu (sua conta)**
   - Quem pode acessar: **Qualquer pessoa**
   (isso é necessário para o site conseguir chamar o script sem exigir
   login do Google de quem estiver preenchendo o briefing)
   Clique em **Implantar** e autorize o script quando o Google pedir
   (ele vai avisar que é um script não verificado — é normal, é seu
   próprio script; clique em "Acessar" → "Ir para o projeto (não seguro)"
   → "Permitir").

6. **Copie a URL do Web App.**
   Vai terminar em `/exec`. Algo como:
   `https://script.google.com/macros/s/AKfycb.../exec`

7. **Cole no site.**
   Abra `index.html`, ache este trecho perto do topo do `<script>`:
   ```js
   const CONFIG = {
     API_URL: "",
     TOKEN: ""
   };
   ```
   E preencha com a URL do passo 6 e o token do passo 4:
   ```js
   const CONFIG = {
     API_URL: "https://script.google.com/macros/s/AKfycb.../exec",
     TOKEN: "dynamis-2026-x7f9"
   };
   ```

8. **Publique o site** (commit + push, ou peça pra eu fazer).

Pronto — o botão **Salvar briefing** grava uma linha nova na planilha, e a
tela **Briefings salvos** lista tudo que já foi salvo, direto da planilha.

## Como fica a planilha

Cada briefing salvo vira **uma linha**, e cada pergunta vira **uma coluna
própria** — igual uma planilha de respostas do Google Forms. O cabeçalho de
cada coluna de pergunta já vem com a pergunta inteira, prefixada pelo código
dela (ex: `1.2 — Qual é o momento atual da empresa...`). As 5 primeiras
colunas (ID, Criado em, Cliente, Data, Responsável) ficam congeladas, então
dá pra rolar pra direita sem perder a referência de qual linha é qual
cliente.

**Uma regra pra não quebrar nada:** pode reordenar as colunas, redimensionar,
formatar, filtrar, à vontade — só não *renomeie* o texto de um cabeçalho nem
apague a linha 1. O script usa o código no início do cabeçalho (`1.2 —`) pra
saber em qual pergunta gravar/ler cada coluna; se o texto mudar, ele para de
reconhecer aquela coluna.

## Se precisar atualizar o script depois

Sempre que editar o `Code.gs`, volte em **Implantar → Gerenciar
implantações → (ícone de lápis) → Nova versão → Implantar**. Só salvar o
arquivo no editor do Apps Script não atualiza o Web App publicado.

## Ver os dados direto

A qualquer momento você pode abrir a própria planilha e ver/filtrar/exportar
os briefings normalmente — ela é o banco de dados.
