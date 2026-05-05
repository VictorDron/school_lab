import { prisma } from '../config/database.js';

export interface NotificationRecipient {
  name: string;
  email: string;
}

/**
 * Resolve notification email recipients based on the lead's notificationPreference.
 * Returns an array of {name, email} — 1 element for MOTHER/FATHER/PRIMARY, up to 2 for BOTH.
 * Falls back to primaryContactEmail if parent data is missing.
 */
export async function getNotificationRecipients(leadId: string): Promise<NotificationRecipient[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      notificationPreference: true,
      primaryContactName: true,
      primaryContactEmail: true,
      secondaryContactName: true,
      secondaryContactEmail: true,
      familyName: true,
      parents: {
        select: { parentType: true, fullName: true, email: true },
      },
    },
  });

  if (!lead) return [];

  const preference = lead.notificationPreference || 'PRIMARY';
  const findParent = (type: string) =>
    lead.parents?.find((p) => p.parentType === type && p.email);

  const primaryFallback = (): NotificationRecipient[] =>
    lead.primaryContactEmail
      ? [{ name: lead.primaryContactName, email: lead.primaryContactEmail }]
      : [];

  if (preference === 'PRIMARY') {
    return primaryFallback();
  }

  if (preference === 'MOTHER') {
    const mother = findParent('MOTHER');
    if (mother?.email) return [{ name: mother.fullName, email: mother.email }];
    return primaryFallback();
  }

  if (preference === 'FATHER') {
    const father = findParent('FATHER');
    if (father?.email) return [{ name: father.fullName, email: father.email }];
    if (lead.secondaryContactEmail) {
      return [{ name: lead.secondaryContactName || lead.familyName, email: lead.secondaryContactEmail }];
    }
    return primaryFallback();
  }

  if (preference === 'BOTH') {
    const recipients: NotificationRecipient[] = [];
    const mother = findParent('MOTHER');
    const father = findParent('FATHER');

    if (mother?.email) {
      recipients.push({ name: mother.fullName, email: mother.email });
    } else if (lead.primaryContactEmail) {
      recipients.push({ name: lead.primaryContactName, email: lead.primaryContactEmail });
    }

    const fatherEmail = father?.email || lead.secondaryContactEmail;
    const fatherName = father?.fullName || lead.secondaryContactName || lead.familyName;
    if (fatherEmail && fatherEmail !== recipients[0]?.email) {
      recipients.push({ name: fatherName, email: fatherEmail });
    }

    return recipients.length > 0 ? recipients : primaryFallback();
  }

  return primaryFallback();
}
