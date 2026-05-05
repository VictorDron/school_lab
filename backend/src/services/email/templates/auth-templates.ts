import { sendEmail } from '../email-sender.service.js';

export async function sendInviteEmail(params: {
  to: string;
  inviterName: string;
  inviteLink: string;
  schoolName: string;
}) {
  const { to, inviterName, inviteLink, schoolName } = params;

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
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Você foi convidado!</h2>
          <p><strong>${inviterName}</strong> convidou você para fazer parte do sistema ${schoolName}.</p>
          <p>Clique no botão abaixo para criar sua conta:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" class="button">Criar Minha Conta</a>
          </p>
          <p style="font-size: 14px; color: #666;">Este link expira em 7 dias.</p>
        </div>
        <div class="footer">
          <p>School Lab - Sistema de Gestão Escolar</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `Convite para ${schoolName} - School Lab`,
    html,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  resetLink: string;
  userName: string;
}) {
  const { to, resetLink, userName } = params;

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
          <div class="logo">School Lab</div>
        </div>
        <div class="content">
          <h2>Redefinição de Senha</h2>
          <p>Olá, <strong>${userName}</strong>,</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button">Redefinir Senha</a>
          </p>
          <p style="font-size: 14px; color: #666;">Se você não solicitou isso, ignore este email.</p>
          <p style="font-size: 14px; color: #666;">Este link expira em 1 hora.</p>
        </div>
        <div class="footer">
          <p>School Lab - Sistema de Gestão Escolar</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: 'Redefinição de Senha - School Lab',
    html,
  });
}

export async function sendPasswordResetCredentialsEmail(params: {
  to: string;
  userName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  resetByAdmin: string;
}) {
  const { to, userName, email, temporaryPassword, loginUrl, resetByAdmin } = params;

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
        .credentials { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0589aa; }
        .credential-label { font-weight: 600; color: #666; font-size: 14px; margin-bottom: 4px; }
        .credential-value { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
        .button { display: inline-block; background: #0589aa; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 School Lab</div>
        </div>
        <div class="content">
          <h2>Sua Senha Foi Redefinida</h2>
          <p>Olá, <strong>${userName}</strong>,</p>
          <p>O administrador <strong>${resetByAdmin}</strong> redefiniu sua senha de acesso ao sistema. Abaixo estão suas novas credenciais:</p>

          <div class="credentials">
            <div class="credential-label">📧 Email de acesso:</div>
            <div class="credential-value">${email}</div>
            <div class="credential-label">🔑 Nova senha temporária:</div>
            <div class="credential-value">${temporaryPassword}</div>
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Por questões de segurança, você será solicitado a alterar esta senha no próximo login.
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">Acessar o Sistema</a>
          </p>

          <p style="font-size: 14px; color: #666;">
            Se você não solicitou esta redefinição ou tem dúvidas, entre em contato com o administrador do sistema imediatamente.
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
    subject: 'Sua Senha Foi Redefinida - School Lab',
    html,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  userName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
  schoolName: string;
}) {
  const { to, userName, email, temporaryPassword, loginUrl, schoolName } = params;

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
        .credentials { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0589aa; }
        .credential-label { font-weight: 600; color: #666; font-size: 14px; margin-bottom: 4px; }
        .credential-value { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
        .button { display: inline-block; background: #0589aa; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔐 School Lab</div>
        </div>
        <div class="content">
          <h2>Bem-vindo ao School Lab!</h2>
          <p>Olá, <strong>${userName}</strong>,</p>
          <p>Sua conta foi criada no sistema <strong>${schoolName}</strong>. Abaixo estão suas credenciais de acesso:</p>

          <div class="credentials">
            <div class="credential-label">📧 Email de acesso:</div>
            <div class="credential-value">${email}</div>
            <div class="credential-label">🔑 Senha temporária:</div>
            <div class="credential-value">${temporaryPassword}</div>
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong> Por questões de segurança, você será solicitado a alterar esta senha no primeiro login.
          </div>

          <p style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" class="button">Acessar o Sistema</a>
          </p>

          <p style="font-size: 14px; color: #666;">
            Se você não solicitou esta conta ou tem dúvidas, entre em contato com o administrador do sistema.
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
    subject: `Bem-vindo ao ${schoolName} - School Lab`,
    html,
  });
}
