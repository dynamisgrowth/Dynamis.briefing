# Como ligar o envio automático de e-mail

O site já gera o PDF sozinho, no navegador de quem preenche (jsPDF). Falta só
o "carteiro": um script gratuito do Google que recebe esse PDF e manda pro
seu e-mail automaticamente, sem ninguém precisar logar em Gmail nem clicar
em enviar.

## Passo a passo (uns 3 minutos — mais rápido que o outro projeto, não precisa de planilha)

1. Vá em [script.new](https://script.new) (cria um projeto de Apps Script
   vazio, direto na sua conta Google).

2. Apague o conteúdo do arquivo `Código.gs` e cole todo o conteúdo do
   arquivo [`Code.gs`](./Code.gs) desta pasta.

3. Troque o token secreto — ache esta linha:
   ```js
   const TOKEN = 'TROQUE_ESTE_TOKEN';
   ```
   e coloque uma senha só sua, ex: `const TOKEN = 'dynamis-contrato-x8k2';`.
   Pode ser um token diferente do outro projeto (Briefing Estratégico) — são
   backends separados.

4. Confirme o e-mail de destino (já vem certo, mas confira):
   ```js
   const NOTIFY_EMAIL = 'pedroiwoned3@gmail.com';
   ```

5. **Implantar → Nova implantação**
   - Tipo: **App da Web**
   - Executar como: **Eu (sua conta)**
   - Quem pode acessar: **Qualquer pessoa**
   Clique em **Implantar** e autorize o script quando o Google avisar que é
   um app não verificado (é o seu próprio script — clique em "Acessar" →
   "Ir para o projeto (não seguro)" → "Permitir").

6. Copie a URL do Web App (termina em `/exec`).

7. Abra `index.html`, ache:
   ```js
   const CONFIG = {
     API_URL: "",
     TOKEN: ""
   };
   ```
   e preencha com a URL do passo 6 e o token do passo 3.

8. Publique o site (commit + push, ou peça pra eu fazer).

Pronto — toda vez que alguém preencher e enviar o formulário, o PDF cai
automaticamente no seu e-mail (`pedroiwoned3@gmail.com`), em anexo, sem
ninguém precisar fazer nada além de clicar em "Enviar".

## Se quiser mudar o e-mail de destino depois

Edite `NOTIFY_EMAIL` no `Code.gs`, salve, e vá em **Implantar → Gerenciar
implantações → (ícone de lápis) → Nova versão → Implantar**. Só salvar no
editor não atualiza o Web App já publicado.
