import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Lead } from '@/types/crm';
import {
  useTokenStatus,
  useGenerateApplicationLink,
  useSendApplicationLinkEmail,
  useEnrollmentTokenStatus,
  useGenerateEnrollmentLink,
  useSendEnrollmentLinkEmail,
  useUpdateLead,
} from '@/hooks/useLeads';
import {
  buildApplicationLink,
  buildEnrollmentLink,
  isEnrollmentEligible,
  getInitials,
  hasFormData,
} from './helpers';

export type ViewingForm = 'admission' | 'enrollment' | null;

type NotificationPreference = 'PRIMARY' | 'MOTHER' | 'FATHER' | 'BOTH';

export function useLeadDetailSidebar({ lead }: { lead: Lead }) {
  const [viewingForm, setViewingForm] = useState<ViewingForm>(null);

  const { data: tokenStatusData } = useTokenStatus(lead.id);
  const tokenStatus = tokenStatusData?.data;

  const { data: enrollmentStatusData } = useEnrollmentTokenStatus(lead.id);
  const enrollmentStatus = enrollmentStatusData?.data;

  const generateApplicationLinkMutation = useGenerateApplicationLink();
  const sendApplicationEmailMutation = useSendApplicationLinkEmail();
  const generateEnrollmentLinkMutation = useGenerateEnrollmentLink();
  const sendEnrollmentEmailMutation = useSendEnrollmentLinkEmail();
  const updateLeadMutation = useUpdateLead();

  const applicationLink = buildApplicationLink(lead.applicationToken);
  const enrollmentLink = buildEnrollmentLink(lead.enrollmentToken);
  const showEnrollmentSection = isEnrollmentEligible(lead.admissionGateStatus);
  const initials = getInitials(lead.primaryContactName);
  const hasSecondaryContact = !!(
    lead.secondaryContactName ||
    lead.secondaryContactEmail ||
    lead.secondaryContactPhone
  );
  const lead_hasFormData = hasFormData(lead);

  const handleCopyLink = (link: string, label: string) => {
    navigator.clipboard.writeText(link);
    toast.success(`${label} copiado!`);
  };

  const handleNotificationPreferenceChange = (value: NotificationPreference) => {
    updateLeadMutation.mutate({ id: lead.id, data: { notificationPreference: value } });
  };

  const generateApplicationLink = () => generateApplicationLinkMutation.mutate(lead.id);
  const sendApplicationEmail = () => sendApplicationEmailMutation.mutate(lead.id);
  const generateEnrollmentLink = () => generateEnrollmentLinkMutation.mutate(lead.id);
  const sendEnrollmentEmail = () => sendEnrollmentEmailMutation.mutate(lead.id);

  return {
    derived: {
      applicationLink,
      enrollmentLink,
      showEnrollmentSection,
      initials,
      hasSecondaryContact,
      hasFormData: lead_hasFormData,
      tokenStatus,
      enrollmentStatus,
    },
    ui: {
      viewingForm,
    },
    setters: {
      setViewingForm,
    },
    handlers: {
      handleCopyLink,
      handleNotificationPreferenceChange,
    },
    mutations: {
      generateApplicationLink,
      sendApplicationEmail,
      generateEnrollmentLink,
      sendEnrollmentEmail,
      generateApplicationLinkPending: generateApplicationLinkMutation.isPending,
      sendApplicationEmailPending: sendApplicationEmailMutation.isPending,
      generateEnrollmentLinkPending: generateEnrollmentLinkMutation.isPending,
      sendEnrollmentEmailPending: sendEnrollmentEmailMutation.isPending,
      updateLeadPending: updateLeadMutation.isPending,
    },
  };
}
