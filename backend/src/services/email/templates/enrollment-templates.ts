import { sendEmail, formatExpiryLabel } from '../email-sender.service.js';

export async function sendEnrollmentConfirmationEmail(params: {
  to: string;
  studentName: string;
  leadCode: string;
}) {
  const { to, studentName, leadCode } = params;

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
          <h2>Formulário de Matrícula Recebido!</h2>
          <p>Obrigado por completar o formulário de matrícula de <strong>${studentName}</strong>.</p>

          <div class="highlight">
            <p style="margin: 0;"><strong>Protocolo:</strong> <span class="code">${leadCode}</span></p>
          </div>

          <p>Recebemos todas as informações necessárias para prosseguir com o processo de matrícula.</p>

          <p>Nossa equipe de admissões analisará a documentação e entrará em contato em breve para confirmar a matrícula.</p>

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
    subject: `Matrícula Recebida - ${leadCode} - School Lab`,
    html,
  });
}

export async function sendEnrollmentLinkEmail(params: {
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
        .button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .docs-box { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .docs-box h3 { margin: 0 0 12px 0; font-size: 15px; color: #1a202c; }
        .docs-box ul { margin: 0; padding-left: 20px; }
        .docs-box li { margin-bottom: 4px; font-size: 14px; color: #4a5568; }
        .docs-category { font-weight: 600; color: #2d3748; margin-top: 10px; margin-bottom: 4px; font-size: 14px; }
        .docs-category:first-child { margin-top: 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Formulário de Matrícula</h2>
          <p>Olá, <strong>${contactName}</strong>,</p>
          <p>Você recebeu um link para preencher o formulário de matrícula da família <strong>${familyName}</strong>.</p>
          <p>Clique no botão abaixo para acessar o formulário:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${link}" class="button">Preencher Formulário de Matrícula</a>
          </p>
          <div class="docs-box">
            <h3>📋 Documentos obrigatórios</h3>
            <p style="font-size: 13px; color: #718096; margin: 0 0 12px 0;">Tenha em mãos os seguintes documentos digitalizados (foto ou PDF) para anexar durante o preenchimento:</p>
            <p class="docs-category">Aluno(a):</p>
            <ul>
              <li>RG do Aluno</li>
              <li>CPF do Aluno</li>
              <li>Certidão de Nascimento</li>
              <li>Caderneta de Vacinação</li>
              <li>Foto 3x4</li>
            </ul>
            <p class="docs-category">Mãe:</p>
            <ul>
              <li>RG da Mãe</li>
              <li>CPF da Mãe</li>
              <li>Comprovante de Residência</li>
            </ul>
            <p class="docs-category">Pai:</p>
            <ul>
              <li>RG do Pai</li>
              <li>CPF do Pai</li>
              <li>Comprovante de Residência</li>
            </ul>
            <p class="docs-category">Escola anterior:</p>
            <ul>
              <li>Declaração de Escolaridade</li>
              <li>Declaração de Quitação Financeira</li>
            </ul>
          </div>
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
    subject: `Formulário de Matrícula - ${familyName} - School Lab`,
    html,
  });
}

export async function sendEnrollmentWelcomeEmail(params: {
  to: string | string[];
  parentName: string;
  familyName: string;
  studentNames: string;
}) {
  const { to, parentName, familyName, studentNames } = params;

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
        .highlight { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Bem-vindo(a) à nossa escola!</h2>
          <p>Olá, <strong>${parentName}</strong>,</p>
          <p>Temos o prazer de confirmar que a matrícula de <strong>${studentNames}</strong> foi concluída com sucesso!</p>

          <div class="highlight">
            <p style="margin: 0;"><strong>Família:</strong> ${familyName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Aluno(s):</strong> ${studentNames}</p>
          </div>

          <p>A partir de agora, vocês fazem parte da nossa comunidade escolar. Em breve, nossa equipe entrará em contato com informações sobre os próximos passos, incluindo:</p>
          <ul>
            <li>Orientações para o primeiro dia de aula</li>
            <li>Materiais e uniformes</li>
            <li>Calendário escolar</li>
          </ul>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Se você tiver dúvidas, entre em contato com nossa equipe.
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
    subject: `Matrícula Confirmada - Família ${familyName} - School Lab`,
    html,
  });
}
