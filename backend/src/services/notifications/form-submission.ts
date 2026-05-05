import { prisma } from '../../config/database.js';
import { Lead } from '@prisma/client';
import { sendEmail } from '../email.service.js';
import logger from '../../utils/logger.js';
import { FRONTEND_URL, EMAIL_THROTTLE_MS, delay } from './constants.js';

/**
 * Notify CRM admins when a family submits the admission form
 */
export async function notifyAdminsOfFormSubmission(lead: Lead, studentName: string) {
  try {
    const crmUsers = await prisma.moduleAccess.findMany({
      where: {
        module: 'CRM',
        accessLevel: { in: ['ADMIN', 'EDIT'] },
        user: {
          status: 'ACTIVE',
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    if (crmUsers.length === 0) {
      logger.info('No CRM admins to notify');
      return;
    }

    const notifications = crmUsers.map((access) => ({
      userId: access.user.id,
      type: 'FORM_RECEIVED',
      title: 'Nova inscrição recebida',
      message: `A família ${lead.familyName} enviou o formulário de inscrição para ${studentName}.`,
      data: {
        leadId: lead.id,
        leadCode: lead.code,
        familyName: lead.familyName,
        studentName,
      },
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Send emails sequentially with throttling to respect rate limits (2 req/sec)
    for (let i = 0; i < crmUsers.length; i++) {
      const access = crmUsers[i];

      if (i > 0) {
        await delay(EMAIL_THROTTLE_MS);
      }

      try {
        await sendFormReceivedEmail({
          to: access.user.email,
          adminName: access.user.displayName,
          familyName: lead.familyName,
          studentName,
          leadCode: lead.code,
          leadId: lead.id,
        });
      } catch (err) {
        logger.error(`Failed to send email to ${access.user.email}:`, err);
      }
    }

    logger.info(`Notified ${crmUsers.length} CRM users about form submission for lead ${lead.code}`);
  } catch (error) {
    logger.error('Error notifying admins of form submission:', error);
    throw error;
  }
}

async function sendFormReceivedEmail(params: {
  to: string;
  adminName: string;
  familyName: string;
  studentName: string;
  leadCode: string;
  leadId: string;
}) {
  const { to, adminName, familyName, studentName, leadCode, leadId } = params;

  const subject = `Nova inscrição recebida: ${studentName}`;
  const crmLink = `${FRONTEND_URL}/crm?lead=${leadId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a56db;">Nova Inscrição Recebida</h2>

      <p>Olá ${adminName},</p>

      <p>Uma nova inscrição foi recebida no sistema CRM:</p>

      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 8px 0;"><strong>Família:</strong> ${familyName}</p>
        <p style="margin: 8px 0;"><strong>Estudante:</strong> ${studentName}</p>
        <p style="margin: 8px 0;"><strong>Código:</strong> ${leadCode}</p>
      </div>

      <p>
        <a href="${crmLink}"
           style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Ver no CRM
        </a>
      </p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        Este email foi enviado automaticamente pelo sistema School Lab.
      </p>
    </div>
  `;

  const text = `
Nova Inscrição Recebida

Olá ${adminName},

Uma nova inscrição foi recebida no sistema CRM:

Família: ${familyName}
Estudante: ${studentName}
Código: ${leadCode}

Ver no CRM: ${crmLink}

Este email foi enviado automaticamente pelo sistema School Lab.
  `;

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}
