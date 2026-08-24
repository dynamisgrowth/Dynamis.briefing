/**
 * Dynamis — Backend do Briefing de Contrato (Google Apps Script)
 * ----------------------------------------------------------------
 * O site já gera o PDF sozinho (jsPDF, no navegador de quem preenche).
 * Esse script só recebe esse PDF pronto (em base64) via POST e manda
 * por e-mail automaticamente — sem precisar de ninguém logar em nada.
 *
 * Como instalar: veja o README.md nesta mesma pasta.
 */

// Troque por uma senha/token secreto seu antes de publicar.
// O mesmo valor precisa ser colado em CONFIG.TOKEN no index.html.
const TOKEN = 'TROQUE_ESTE_TOKEN';

// Pra onde cada briefing de contrato preenchido é enviado por e-mail.
const NOTIFY_EMAIL = 'pedroiwoned3@gmail.com';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.token !== TOKEN) {
      return jsonResponse({ ok: false, error: 'não autorizado' });
    }
    if (!body.pdfBase64) {
      return jsonResponse({ ok: false, error: 'PDF ausente' });
    }

    const dados = body.dados || {};
    const nomeCliente = dados.nome_fantasia || dados.razao_social || 'Cliente';
    const fileName = body.fileName || ('Briefing_' + nomeCliente.replace(/\s+/g, '_') + '.pdf');

    const pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(body.pdfBase64),
      'application/pdf',
      fileName
    );

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: 'Novo briefing de contrato — ' + nomeCliente,
      body: resumoTexto(dados),
      attachments: [pdfBlob]
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function resumoTexto(d) {
  return [
    'Novo briefing de contrato preenchido. PDF completo em anexo.',
    '',
    'Razão social: ' + (d.razao_social || '—'),
    'Nome fantasia: ' + (d.nome_fantasia || '—'),
    'CNPJ/CPF: ' + (d.cnpj_cpf || '—'),
    'Responsável legal: ' + (d.responsavel_nome || '—'),
    '',
    'E-mail: ' + (d.email || '—'),
    'WhatsApp: ' + (d.whatsapp || '—'),
    '',
    'Plano: ' + (d.plano || '—'),
    'Valor mensal: ' + (d.valor || '—'),
    'Forma de pagamento: ' + (d.pagamento || '—'),
    'Vencimento: ' + (d.vencimento || '—'),
    'Início do contrato: ' + (d.data_inicio || '—'),
    'Duração: ' + (d.duracao || '—')
  ].join('\n');
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
