import { Resend } from 'resend';
import { config } from '../../config/index.js';
import logger from '../../utils/logger.js';
import { SendEmailParams } from '../../types/email.types.js';

const resend = new Resend(config.resend.apiKey);

const FROM_EMAIL = 'RISYS <noreply@mail.agentelab.com.br>';

export function formatExpiryLabel(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0 && remainingHours > 0) return `${days} dia${days > 1 ? 's' : ''} e ${remainingHours} hora${remainingHours > 1 ? 's' : ''}`;
  if (days > 0) return `${days} dia${days > 1 ? 's' : ''}`;
  return `${hours} hora${hours > 1 ? 's' : ''}`;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const recipients = Array.isArray(to) ? to : [to];
  const startTime = Date.now();

  logger.info(`[Email] SENDING | to=[${recipients.length} destinatário(s)] | subject="${subject}"`);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
      text,
    });

    const duration = Date.now() - startTime;

    if (error) {
      logger.error(`[Email] FAILED | to=[${recipients.length} destinatário(s)] | subject="${subject}" | duration=${duration}ms | error=${JSON.stringify(error)}`);
      return { success: false, error };
    }

    logger.info(`[Email] SENT | to=[${recipients.length} destinatário(s)] | subject="${subject}" | id=${data?.id} | duration=${duration}ms`);
    return { success: true, data };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`[Email] ERROR | to=[${recipients.length} destinatário(s)] | subject="${subject}" | duration=${duration}ms | error=${errorMessage}`);
    return { success: false, error };
  }
}
