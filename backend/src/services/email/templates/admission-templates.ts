import { sendEmail, formatExpiryLabel } from '../email-sender.service.js';

export async function sendAdmissionConfirmationEmail(params: {
  to: string;
  parentName: string;
  studentName: string;
  leadCode: string;
}) {
  const { to, parentName, studentName, leadCode } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
        .highlight { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
        .code { font-family: 'Courier New', monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Inscrição Recebida!</h2>
          <p>Olá, <strong>${parentName}</strong>,</p>
          <p>Recebemos a inscrição de <strong>${studentName}</strong> com sucesso!</p>

          <div class="highlight">
            <p style="margin: 0;"><strong>Protocolo:</strong> <span class="code">${leadCode}</span></p>
          </div>

          <p>Nossa equipe de admissões analisará a inscrição e entrará em contato em breve para os próximos passos do processo.</p>

          <p>Guarde o número do protocolo acima para referência futura.</p>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Se você tiver dúvidas, entre em contato com nossa equipe de admissões.
          </p>
        </div>
        <div class="footer">
          <p>School Lab - Sistema de Gestão Escolar</p>
          <p style="font-size: 12px; margin-top: 10px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Inscrição Recebida - ${leadCode} - School Lab`,
    html,
  });
}

export async function sendApplicationLinkEmail(params: {
  to: string | string[];
  contactName: string;
  familyName: string;
  link: string;
  expiresInHours: number;
}) {
  const { to, contactName, familyName, link, expiresInHours } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background: #0589aa; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Formulário de Inscrição</h2>
          <p>Olá, <strong>${contactName}</strong>,</p>
          <p>Você recebeu um link para preencher o formulário de inscrição da família <strong>${familyName}</strong>.</p>
          <p>Clique no botão abaixo para acessar o formulário:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" class="button">Preencher Formulário de Inscrição</a>
          </p>
          <div class="warning">
            <strong>⚠️ Atenção:</strong> Este link expira em <strong>${formatExpiryLabel(expiresInHours)}</strong>. Preencha o formulário antes do prazo.
          </div>
          <p style="font-size: 14px; color: #666;">
            Se você não solicitou este formulário ou tem dúvidas, entre em contato com a equipe de admissões.
          </p>
        </div>
        <div class="footer">
          <p>School Lab - Sistema de Gestão Escolar</p>
          <p style="font-size: 12px; margin-top: 10px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Formulário de Inscrição - ${familyName} - School Lab`,
    html,
  });
}

export async function sendFormApprovedEmail(params: {
  to: string | string[];
  contactName: string;
  familyName: string;
}) {
  const { to, contactName, familyName } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
        .highlight { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Inscrição Aprovada!</h2>
          <p>Olá, <strong>${contactName}</strong>,</p>
          <p>Parabéns! Seu formulário de inscrição foi aprovado.</p>

          <div class="highlight">
            <p style="margin: 0;"><strong>Família:</strong> ${familyName}</p>
          </div>

          <p>A próxima etapa é agendar uma visita à escola. Nossa equipe de admissões entrará em contato em breve para agendar.</p>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Se você tiver dúvidas, entre em contato com nossa equipe de admissões.
          </p>
        </div>
        <div class="footer">
          <p>School Lab - Sistema de Gestão Escolar</p>
          <p style="font-size: 12px; margin-top: 10px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Inscrição Aprovada - Família ${familyName} - School Lab`,
    html,
  });
}

export async function sendVisitScheduledEmail(params: {
  to: string | string[];
  contactName: string;
  familyName: string;
  visitDate: string;
  location: string;
}) {
  const { to, contactName, familyName, visitDate, location } = params;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
        .highlight { background: white; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0589aa; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Visita Agendada!</h2>
          <p>Olá, <strong>${contactName}</strong>,</p>
          <p>Sua visita à escola foi agendada!</p>

          <div class="highlight">
            <p style="margin: 0;"><strong>Família:</strong> ${familyName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Data:</strong> ${visitDate}</p>
            <p style="margin: 8px 0 0 0;"><strong>Local:</strong> ${location}</p>
          </div>

          <p>Aguardamos você!</p>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Se você tiver dúvidas ou precisar reagendar, entre em contato com nossa equipe de admissões.
          </p>
        </div>
        <div class="footer">
          <p>School Lab - Sistema de Gestão Escolar</p>
          <p style="font-size: 12px; margin-top: 10px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Visita Agendada - Família ${familyName} - School Lab`,
    html,
  });
}

export async function sendRejectionEmail(params: {
  to: string | string[];
  contactName: string;
  familyName: string;
  reason?: string;
}) {
  const { to, contactName, familyName, reason } = params;

  const reasonBlock = reason
    ? `<div style="background: white; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0;"><strong>Observacao:</strong> ${reason}</p>
      </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Atualizacao sobre sua inscricao</h2>
          <p>Ola, <strong>${contactName}</strong>,</p>
          <p>Agradecemos o interesse da familia <strong>${familyName}</strong> em nossa escola.</p>
          <p>Apos analise cuidadosa, informamos que infelizmente nao foi possivel aprovar a inscricao neste momento.</p>
          ${reasonBlock}
          <p>Caso tenha duvidas ou deseje mais informacoes, entre em contato com nossa equipe de admissoes.</p>
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Agradecemos a compreensao e desejamos sucesso.
          </p>
        </div>
        <div class="footer">
          <p>School Lab - Sistema de Gestao Escolar</p>
          <p style="font-size: 12px; margin-top: 10px;">Este e um email automatico, por favor nao responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Atualizacao sobre sua inscricao - ${familyName}`,
    html,
  });
}
