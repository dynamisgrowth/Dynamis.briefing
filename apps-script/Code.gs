/**
 * Dynamis — Backend do Briefing (Google Apps Script)
 * ----------------------------------------------------
 * Fluxo de cada "Salvar briefing" no site:
 *  1. Cria um Google Doc novo, formatado em pé (pergunta em negrito,
 *     apoio em itálico, resposta embaixo) — igual uma folha preenchida.
 *  2. Gera o PDF desse Doc e manda pro seu e-mail.
 *  3. Grava uma linha "índice" na planilha (cliente, data, responsável,
 *     link do Doc) — é o que alimenta a tela "Briefings salvos" no site.
 *
 * Como instalar: veja o README.md nesta mesma pasta.
 */

const SHEET_NAME = 'Briefings';
const DRIVE_FOLDER_NAME = 'Dynamis — Briefings';

// Troque por uma senha/token secreto seu antes de publicar.
// O mesmo valor precisa ser colado em CONFIG.TOKEN no index.html.
const TOKEN = 'TROQUE_ESTE_TOKEN';

// Pra onde o PDF de cada briefing salvo é enviado por e-mail.
const NOTIFY_EMAIL = 'pedroiwoned@gmail.com';

/**
 * Perguntas do briefing — espelha exatamente o array SECTIONS do index.html.
 * Se adicionar/editar uma pergunta lá, replique aqui também.
 */
const SECTIONS = [
  { id: 1, title: 'Sobre o negócio', internal: false, questions: [
    { key: 's1q1', formal: 'Como funciona o seu negócio hoje? De que forma vocês ganham dinheiro?', informal: 'Aqui o forte é mais o salão ou o delivery?' },
    { key: 's1q2', formal: 'Qual é o momento atual da empresa — crescendo, estabilizando, lançando algo novo, ou com dificuldades?', informal: 'O movimento tá bom, ou tá mais parado que o normal ultimamente?' },
    { key: 's1q3', formal: 'Quais são as prioridades de vocês para os próximos meses?', informal: 'Tem alguma coisa que vocês querem resolver ou lançar até o fim do ano?' }
  ]},
  { id: 2, title: 'Sobre o produto ou serviço', internal: false, questions: [
    { key: 's2q1', formal: 'O que exatamente vocês vendem?', informal: 'Qual é o prato/procedimento que mais sai daqui?' },
    { key: 's2q2', formal: 'O que faz um cliente escolher vocês em vez do concorrente?', informal: 'Por que alguém vem comer aqui e não no restaurante da esquina?' },
    { key: 's2q3', formal: 'Por que alguém pagaria pelo que vocês oferecem?', informal: 'O que faz o paciente confiar em marcar consulta com você?' }
  ]},
  { id: 3, title: 'Sobre público e concorrência', internal: false, questions: [
    { key: 's3q1', formal: 'Quem é o cliente ideal de vocês? Dia a dia, o que busca, onde consome conteúdo?', informal: 'Quem costuma vir aqui? Família, casal, gente sozinha no almoço?' },
    { key: 's3q2', formal: 'Quem vocês consideram concorrentes diretos hoje?', informal: 'Tem algum restaurante/clínica aqui perto que vocês ficam de olho?' },
    { key: 's3q3', formal: 'Vocês acompanham o que os concorrentes fazem nas redes? Sabem o que funciona pra eles?', informal: 'Vocês costumam ver o Instagram de outros lugares parecidos com o de vocês?' }
  ]},
  { id: 4, title: 'Sobre o que será entregue', internal: false, questions: [
    { key: 's4q1', formal: 'O que vocês esperam alcançar: mais gente conhecendo, mais gente lembrando, ou mais gente comprando?', informal: 'Vocês querem mais gente conhecendo o restaurante, ou já conhece e falta vir com mais frequência?' },
    { key: 's4q2', formal: 'Quem exatamente vocês querem impactar com isso?', informal: 'É pra atrair gente nova no bairro, ou fazer quem já veio uma vez voltar?' },
    { key: 's4q3', formal: 'Que ação vocês esperam que a pessoa tome depois de ver o conteúdo?', informal: 'Vocês querem que a pessoa peça pelo delivery, ligue pra reservar, ou venha direto?' },
    { key: 's4q4', formal: 'Em quais redes/canais vocês já estão presentes, e quais fazem sentido pra esse objetivo?', informal: 'Vocês usam mais o Instagram, o WhatsApp, ou o Google mesmo pra aparecer?' }
  ]},
  { id: 5, title: 'Sobre o que já foi tentado', internal: false, questions: [
    { key: 's5q1', formal: 'Vocês já testaram alguma estratégia antes? O que funcionou e o que não?', informal: 'Já fizeram alguma promoção ou anúncio antes? Deu resultado?' },
    { key: 's5q2', formal: 'Vocês têm acesso aos números/relatórios das redes de vocês hoje?', informal: 'Vocês sabem quantas pessoas o Instagram de vocês alcança por mês?' }
  ]},
  { id: 6, title: 'Sobre acompanhamento', internal: false, questions: [
    { key: 's6q1', formal: 'Com que frequência vocês gostariam de revisar os resultados junto com a gente?', informal: 'Prefere que a gente mande um resumo toda semana, ou só no fim do mês?' },
    { key: 's6q2', formal: 'Existe alguma meta numérica que vocês já têm em mente?', informal: "Tem algum número em mente, tipo 'quero vender X pratos a mais por mês'?" }
  ]},
  { id: 7, title: 'Pauta interna da equipe', internal: true, questions: [
    { key: 's7q1', formal: 'O cliente pediu X, mas qual é o objetivo real por trás desse pedido?' },
    { key: 's7q2', formal: 'Quais etapas da jornada do público essa entrega precisa atender?' },
    { key: 's7q3', formal: 'Quais formatos estão performando melhor para essa audiência agora?' },
    { key: 's7q4', formal: 'Qual conteúdo/ação vai gerar o resultado que o cliente espera de verdade?' }
  ]}
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.token !== TOKEN) {
      return jsonResponse({ ok: false, error: 'não autorizado' });
    }
    if (!data.cliente) {
      return jsonResponse({ ok: false, error: 'informe o cliente' });
    }

    const id = Utilities.getUuid();
    const now = new Date();
    const doc = buildDoc(data, now);
    const docUrl = doc.getUrl();

    emailPdf(doc, data.cliente);
    appendIndexRow(id, now, data, docUrl);

    return jsonResponse({ ok: true, id: id, docUrl: docUrl });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  try {
    const token = e.parameter.token;
    if (token !== TOKEN) {
      return jsonResponse({ ok: false, error: 'não autorizado' });
    }

    const sheet = getIndexSheet();
    const rows = sheet.getDataRange().getValues();
    const [, ...data] = rows; // ignora o cabeçalho

    const briefings = data
      .filter(row => row[0])
      .map(row => ({
        id: row[0],
        criadoEm: row[1],
        cliente: row[2],
        data: row[3],
        responsavel: row[4],
        docUrl: row[5]
      }));

    return jsonResponse({ ok: true, briefings: briefings });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

/** Monta o Google Doc formatado em pé, um por briefing. */
function buildDoc(data, now) {
  const title = 'Briefing Estratégico — ' + data.cliente;
  const doc = DocumentApp.create(title);
  const body = doc.getBody();

  const titlePar = body.getParagraphs()[0];
  titlePar.setText(title).setHeading(DocumentApp.ParagraphHeading.TITLE);

  const meta = body.appendParagraph(
    'Cliente: ' + data.cliente + '    |    Data: ' + (data.data || '—') + '    |    Responsável Dynamis: ' + (data.responsavel || '—')
  );
  meta.editAsText().setBold(true).setForegroundColor('#3A4150');
  body.appendParagraph('');

  const respostas = data.respostas || {};

  SECTIONS.forEach(section => {
    if (section.internal) {
      const tag = body.appendParagraph('USO INTERNO DYNAMIS — NÃO MOSTRAR AO CLIENTE');
      tag.editAsText().setBold(true).setForegroundColor('#FFFFFF');
      tag.setBackgroundColor('#12151C');
    }
    const heading = body.appendParagraph(section.id + ' · ' + section.title);
    heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    heading.editAsText().setForegroundColor(section.internal ? '#12151C' : '#0B5FFF');

    section.questions.forEach(q => {
      const qPar = body.appendParagraph(q.formal);
      qPar.editAsText().setBold(true);

      if (q.informal) {
        const iPar = body.appendParagraph('"' + q.informal + '"');
        iPar.editAsText().setItalic(true).setForegroundColor('#6B7280');
      }

      const answer = respostas[q.key];
      const aPar = body.appendParagraph(answer || '— não preenchido —');
      aPar.setIndentStart(24);
      if (!answer) aPar.editAsText().setItalic(true).setForegroundColor('#B0B5BF');

      body.appendParagraph('');
    });
  });

  const obsHeading = body.appendParagraph('Observações gerais');
  obsHeading.editAsText().setBold(true);
  const obsPar = body.appendParagraph(data.observacoes || '— não preenchido —');
  obsPar.setIndentStart(24);
  if (!data.observacoes) obsPar.editAsText().setItalic(true).setForegroundColor('#B0B5BF');
  body.appendParagraph('');

  const proxHeading = body.appendParagraph('Próximos passos');
  proxHeading.editAsText().setBold(true);
  const proxPar = body.appendParagraph(data.proximosPassos || '— não preenchido —');
  proxPar.setIndentStart(24);
  if (!data.proximosPassos) proxPar.editAsText().setItalic(true).setForegroundColor('#B0B5BF');

  body.appendParagraph('');
  const footer = body.appendParagraph('Dynamis · Salvo em ' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy \'às\' HH:mm'));
  footer.editAsText().setForegroundColor('#6B7280').setFontSize(9);

  doc.saveAndClose();

  // move da raiz do Drive pra pasta "Dynamis — Briefings"
  const file = DriveApp.getFileById(doc.getId());
  const folder = getOrCreateFolder();
  folder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return doc;
}

function emailPdf(doc, cliente) {
  const pdfBlob = DriveApp.getFileById(doc.getId())
    .getAs('application/pdf')
    .setName('Briefing — ' + cliente + '.pdf');

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Novo briefing salvo — ' + cliente,
    body: 'Segue em anexo o PDF do briefing de ' + cliente + '.\n\nAbrir o documento no Google Docs:\n' + doc.getUrl(),
    attachments: [pdfBlob]
  });
}

function appendIndexRow(id, now, data, docUrl) {
  const sheet = getIndexSheet();
  sheet.appendRow([id, now.toISOString(), data.cliente || '', data.data || '', data.responsavel || '', docUrl]);
}

function getIndexSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Criado em', 'Cliente', 'Data', 'Responsável', 'Link do documento']);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold');
  }
  return sheet;
}

function getOrCreateFolder() {
  const it = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
