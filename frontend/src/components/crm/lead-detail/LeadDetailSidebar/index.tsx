import type { Lead } from '@/types/crm';
import { useLeadDetailSidebar } from './useLeadDetailSidebar';
import { SidebarContacts } from './SidebarContacts';
import { SidebarMeta } from './SidebarMeta';
import { SidebarLinks } from './SidebarLinks';
import { SidebarFamily } from './SidebarFamily';
import { SidebarNotes } from './SidebarNotes';

interface LeadDetailSidebarProps {
  lead: Lead;
  canEdit: boolean;
}

// --- Main Sidebar Component ---

export function LeadDetailSidebar({ lead, canEdit }: LeadDetailSidebarProps) {
  const { derived, ui, setters, handlers, mutations } = useLeadDetailSidebar({ lead });
  const {
    applicationLink,
    enrollmentLink,
    showEnrollmentSection,
    initials,
    hasSecondaryContact,
    hasFormData,
    tokenStatus,
    enrollmentStatus,
  } = derived;

  return (
    <aside className="w-full lg:w-[380px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white overflow-y-auto max-h-[40vh] lg:max-h-none">
      <div className="p-4 space-y-0">
        <SidebarContacts
          lead={lead}
          hasSecondaryContact={hasSecondaryContact}
          initials={initials}
        />

        <SidebarMeta
          lead={lead}
          canEdit={canEdit}
          onNotificationPreferenceChange={handlers.handleNotificationPreferenceChange}
          updateLeadPending={mutations.updateLeadPending}
        />

        <SidebarLinks
          lead={lead}
          canEdit={canEdit}
          applicationLink={applicationLink}
          enrollmentLink={enrollmentLink}
          showEnrollmentSection={showEnrollmentSection}
          tokenStatus={tokenStatus}
          enrollmentStatus={enrollmentStatus}
          viewingForm={ui.viewingForm}
          setViewingForm={setters.setViewingForm}
          onCopyLink={handlers.handleCopyLink}
          onGenerateApplicationLink={mutations.generateApplicationLink}
          onSendApplicationEmail={mutations.sendApplicationEmail}
          onGenerateEnrollmentLink={mutations.generateEnrollmentLink}
          onSendEnrollmentEmail={mutations.sendEnrollmentEmail}
          generateApplicationLinkPending={mutations.generateApplicationLinkPending}
          sendApplicationEmailPending={mutations.sendApplicationEmailPending}
          generateEnrollmentLinkPending={mutations.generateEnrollmentLinkPending}
          sendEnrollmentEmailPending={mutations.sendEnrollmentEmailPending}
        />

        <SidebarFamily lead={lead} hasFormData={hasFormData} />

        <SidebarNotes notes={lead.notes} />
      </div>
    </aside>
  );
}

