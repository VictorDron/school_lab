import { sendEmail } from '../email-sender.service.js';
import logger from '../../../utils/logger.js';

export async function sendReEnrollmentInviteEmail(params: {
  to: string;
  familyName: string;
  studentName: string;
  formLink: string;
  suggestedGrade: string | null;
  deadline: Date;
  schoolName?: string;
}) {
  const { to, familyName, studentName, formLink, suggestedGrade, deadline, schoolName = 'Rio International School' } = params;

  if (!to) {
    logger.warn('[Email] RE_ENROLLMENT_INVITE skipped — no email address');
    return;
  }

  const formattedDeadline = deadline.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const gradeText = suggestedGrade ? `<p><strong>Série sugerida:</strong> ${suggestedGrade}</p>` : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; }
  .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
  .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
  .button { display: inline-block; background: #0589aa; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  .info-box { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; }
</style>
</head><body>
<div class="container">
  <div class="header"><div class="logo">RISYS</div></div>
  <div class="content">
    <h2>Rematrícula ${schoolName}</h2>
    <p>Olá, <strong>${familyName}</strong>,</p>
    <p>É hora de confirmar a rematrícula de <strong>${studentName}</strong> para o próximo ano letivo.</p>
    <div class="info-box">
      ${gradeText}
      <p><strong>Prazo:</strong> ${formattedDeadline}</p>
    </div>
    <p>Clique no botão abaixo para revisar e confirmar os dados:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${formLink}" class="button">Confirmar Rematrícula</a>
    </p>
    <p style="font-size: 14px; color: #666;">Este link é exclusivo para sua família. Não compartilhe.</p>
  </div>
  <div class="footer"><p>RISYS — Sistema de Gestão Escolar</p></div>
</div>
</body></html>`;

  return sendEmail({ to, subject: `Rematrícula — ${studentName} — ${schoolName}`, html });
}

export async function sendReEnrollmentFormConfirmationEmail(params: {
  to: string;
  familyName: string;
  studentName: string;
  schoolName?: string;
}) {
  const { to, familyName, studentName, schoolName = 'Rio International School' } = params;

  if (!to) {
    logger.warn('[Email] RE_ENROLLMENT_FORM_CONFIRMATION skipped — no email address');
    return;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; }
  .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
  .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  .info-box { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; }
</style>
</head><body>
<div class="container">
  <div class="header"><div class="logo">RISYS</div></div>
  <div class="content">
    <h2>Confirmação de Rematrícula — ${schoolName}</h2>
    <p>Olá, <strong>${familyName}</strong>,</p>
    <p>Recebemos a confirmação de dados de <strong>${studentName}</strong>. O próximo passo é a assinatura do contrato de renovação.</p>
    <div class="info-box">
      <p>Você receberá um e-mail com o link para assinatura digital assim que o contrato estiver pronto.</p>
    </div>
    <p>Caso tenha dúvidas, entre em contato com a secretaria da escola.</p>
  </div>
  <div class="footer"><p>RISYS — Sistema de Gestão Escolar</p></div>
</div>
</body></html>`;

  return sendEmail({ to, subject: `Confirmação de Rematrícula — ${studentName} — ${schoolName}`, html });
}

export async function sendReEnrollmentContractSentEmail(params: {
  to: string;
  familyName: string;
  studentName: string;
  schoolName?: string;
}) {
  const { to, familyName, studentName, schoolName = 'Rio International School' } = params;

  if (!to) {
    logger.warn('[Email] RE_ENROLLMENT_CONTRACT_SENT skipped — no email address');
    return;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; }
  .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
  .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  .info-box { background: #e8f4f8; padding: 15px; border-radius: 6px; margin: 15px 0; }
</style>
</head><body>
<div class="container">
  <div class="header"><div class="logo">RISYS</div></div>
  <div class="content">
    <h2>Contrato de Renovação Enviado — ${schoolName}</h2>
    <p>Olá, <strong>${familyName}</strong>,</p>
    <p>O contrato de renovação de <strong>${studentName}</strong> foi enviado para assinatura digital.</p>
    <div class="info-box">
      <p>Verifique sua caixa de e-mail para assinar pelo <strong>ClickSign</strong>. O link de assinatura será enviado diretamente pelo serviço de assinatura digital.</p>
    </div>
    <p>Após a assinatura de todos os responsáveis, a rematrícula será concluída automaticamente.</p>
  </div>
  <div class="footer"><p>RISYS — Sistema de Gestão Escolar</p></div>
</div>
</body></html>`;

  return sendEmail({ to, subject: `Contrato de Renovação Enviado — ${studentName} — ${schoolName}`, html });
}

export async function sendReEnrollmentWelcomeEmail(params: {
  to: string;
  familyName: string;
  studentName: string;
  newGrade: string | null;
  targetYear: number;
  schoolName?: string;
}) {
  const { to, familyName, studentName, newGrade, targetYear, schoolName = 'Rio International School' } = params;

  if (!to) {
    logger.warn('[Email] RE_ENROLLMENT_WELCOME skipped — no email address');
    return;
  }

  const gradeSection = newGrade
    ? `<p><strong>Série:</strong> ${newGrade}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; }
  .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
  .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  .info-box { background: #d4edda; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #28a745; }
</style>
</head><body>
<div class="container">
  <div class="header"><div class="logo">RISYS</div></div>
  <div class="content">
    <h2>Rematrícula Confirmada — ${schoolName}</h2>
    <p>Olá, <strong>${familyName}</strong>,</p>
    <p>A rematrícula de <strong>${studentName}</strong> para o ano letivo <strong>${targetYear}</strong> foi concluída com sucesso!</p>
    <div class="info-box">
      <p><strong>Ano letivo:</strong> ${targetYear}</p>
      ${gradeSection}
    </div>
    <p>Ficamos felizes em ter <strong>${studentName}</strong> conosco por mais um ano. Nos vemos em breve!</p>
  </div>
  <div class="footer"><p>RISYS — Sistema de Gestão Escolar</p></div>
</div>
</body></html>`;

  return sendEmail({ to, subject: `Rematrícula Confirmada — ${studentName} — Ano Letivo ${targetYear} — ${schoolName}`, html });
}

export async function sendPreReEnrollmentEmail(params: {
  to: string;
  familyName: string;
  studentName: string;
  grade: string;
  fullMonthlyValue: string;
  discountedMonthlyValue: string;
  responseLink: string;
  deadline: string;
  customBody: string;
  // Legacy fields (kept for backward compat)
  currentMonthlyValue?: string;
  newMonthlyValue?: string;
  adjustmentPercent?: string;
}) {
  const {
    to, familyName, studentName, grade,
    fullMonthlyValue, discountedMonthlyValue,
    responseLink, deadline, customBody,
  } = params;

  if (!to) {
    logger.warn('[Email] PRE_RE_ENROLLMENT skipped — no email address');
    return { success: false, error: 'No email address' };
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; }
  .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
  .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
  .button-agree { display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0589aa; }
  .deadline { background: #fff3cd; padding: 12px; border-radius: 6px; margin: 20px 0; text-align: center; font-weight: 600; }
</style>
</head><body>
<div class="container">
  <div class="header"><div class="logo">RISYS</div></div>
  <div class="content">
    <h2>Comunicado de Pré-Rematrícula</h2>
    <p>Olá, <strong>${familyName}</strong>,</p>
    <p>${customBody}</p>
    <p>Seguem as informações financeiras referentes à rematrícula de <strong>${studentName}</strong>${grade ? ` (${grade})` : ''}:</p>
    <div class="info-box">
      <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="font-weight: 600; color: #555;">Valor da mensalidade:</td>
          <td style="font-weight: 700; text-align: right;">${fullMonthlyValue}</td>
        </tr>
        <tr>
          <td style="font-weight: 600; color: #555;">Valor com desconto:</td>
          <td style="font-weight: 700; text-align: right; color: #10b981;">${discountedMonthlyValue}</td>
        </tr>
      </table>
    </div>
    <p>Para confirmar a rematrícula, clique no botão abaixo:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${responseLink}" class="button-agree">Confirmar Rematrícula</a>
    </p>
    <div class="deadline">Prazo para manifestação: ${deadline}</div>
    <p style="font-size: 14px; color: #666;">Este link é exclusivo para sua família. Não compartilhe com terceiros.</p>
  </div>
  <div class="footer"><p>RISYS — Sistema de Gestão Escolar</p></div>
</div>
</body></html>`;

  return sendEmail({
    to,
    subject: `Pré-Rematrícula — ${studentName} — Rio International School`,
    html,
  });
}

export async function sendDocumentRejectionEmail(params: {
  to: string;
  familyName: string;
  studentName: string;
  formLink: string;
  rejectedDocuments: Array<{ type: string; name: string }>;
  schoolName?: string;
}) {
  const { to, familyName, studentName, formLink, rejectedDocuments, schoolName = 'Rio International School' } = params;

  if (!to) {
    logger.warn('[Email] DOCUMENT_REJECTION skipped — no email address');
    return;
  }

  const docLabels: Record<string, string> = {
    MEDICAL_CERTIFICATE: 'Atestado Médico para Prática de Esportes',
    RESIDENCE_PROOF: 'Comprovante de Residência',
    MEDICAL_REPORT: 'Laudo Médico / Psicológico',
  };

  const docListHtml = rejectedDocuments
    .map(d => `<li style="margin-bottom: 8px;"><strong>${docLabels[d.type] || d.type}</strong></li>`)
    .join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; }
  .logo { font-size: 28px; font-weight: bold; color: #0589aa; }
  .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
  .button { display: inline-block; background: #0589aa; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
  .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
  .alert-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0; }
</style>
</head><body>
<div class="container">
  <div class="header"><div class="logo">RISYS</div></div>
  <div class="content">
    <h2>Documentos Pendentes — Rematrícula</h2>
    <p>Olá, <strong>${familyName}</strong>,</p>
    <p>Alguns documentos enviados para a rematrícula de <strong>${studentName}</strong> precisam ser reenviados:</p>
    <div class="alert-box">
      <p style="font-weight: 600; color: #dc2626; margin-bottom: 8px;">Documentos que precisam de correção:</p>
      <ul style="margin: 0; padding-left: 20px;">${docListHtml}</ul>
    </div>
    <p>Por favor, acesse o formulário pelo link abaixo e reenvie os documentos indicados:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${formLink}" class="button">Reenviar Documentos</a>
    </p>
    <p style="font-size: 14px; color: #666;">Este link é exclusivo para sua família. Não compartilhe.</p>
  </div>
  <div class="footer"><p>RISYS — Sistema de Gestão Escolar</p></div>
</div>
</body></html>`;

  return sendEmail({ to, subject: `Documentos Pendentes — ${studentName} — ${schoolName}`, html });
}
