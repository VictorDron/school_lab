import { sendEmail } from '../email-sender.service.js';

export async function sendNotificationEmail(params: {
  to: string;
  userName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  const { to, userName, title, message, actionUrl, actionText } = params;

  const actionButton = actionUrl
    ? `<p style="text-align: center; margin: 30px 0;">
         <a href="${actionUrl}" class="button">${actionText || 'Ver Detalhes'}</a>
       </p>`
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
        .button { display: inline-block; background: #0589aa; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">RISYS</div>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>Olá, <strong>${userName}</strong>,</p>
          <p>${message}</p>
          ${actionButton}
        </div>
        <div class="footer">
          <p>RISYS - Sistema de Gestão Escolar</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `${title} - RISYS`,
    html,
  });
}

export async function sendGateApprovalEmail(params: {
  to: string;
  userName: string;
  departmentLabel: string;
  gateStepLabel: string;
  familyName: string;
  leadCode: string;
  leadUrl: string;
}) {
  const { to, userName, departmentLabel, gateStepLabel, familyName, leadCode, leadUrl } = params;

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
        .info-box { background: white; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #F59E0B; }
        .info-box p { margin: 8px 0; font-size: 14px; }
        .button { display: inline-block; background: #0589aa; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">RISYS</div>
        </div>
        <div class="content">
          <h2>Aprovação Pendente</h2>
          <p>Olá, <strong>${userName}</strong>,</p>
          <p>Uma nova aprovação foi atribuída a você e requer sua análise:</p>
          <div class="info-box">
            <p><strong>Departamento:</strong> ${departmentLabel}</p>
            <p><strong>Família:</strong> ${familyName}</p>
            <p><strong>Código:</strong> ${leadCode}</p>
            <p><strong>Etapa:</strong> ${gateStepLabel}</p>
          </div>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${leadUrl}" class="button">Resolver Aprovação</a>
          </p>
          <p style="font-size: 14px; color: #666;">
            Este email foi enviado porque você tem as notificações por email habilitadas no sistema RISYS.
          </p>
        </div>
        <div class="footer">
          <p>RISYS - Sistema de Gestão Escolar</p>
          <p style="font-size: 12px; margin-top: 10px;">Este é um email automático, por favor não responda.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Aprovação Pendente: ${departmentLabel} - ${familyName} - RISYS`,
    html,
  });
}
