// Email service barrel — re-exports all public API
export { sendEmail, formatExpiryLabel } from './email-sender.service.js';
export {
  sendInviteEmail,
  sendPasswordResetEmail,
  sendPasswordResetCredentialsEmail,
  sendWelcomeEmail,
} from './templates/auth-templates.js';
export {
  sendAdmissionConfirmationEmail,
  sendApplicationLinkEmail,
  sendFormApprovedEmail,
  sendVisitScheduledEmail,
  sendRejectionEmail,
} from './templates/admission-templates.js';
export {
  sendEnrollmentConfirmationEmail,
  sendEnrollmentLinkEmail,
  sendEnrollmentWelcomeEmail,
} from './templates/enrollment-templates.js';
export {
  sendNotificationEmail,
  sendGateApprovalEmail,
} from './templates/notification-templates.js';
export {
  sendReEnrollmentInviteEmail,
  sendReEnrollmentFormConfirmationEmail,
  sendReEnrollmentContractSentEmail,
  sendReEnrollmentWelcomeEmail,
  sendPreReEnrollmentEmail,
  sendDocumentRejectionEmail,
} from './templates/re-enrollment-templates.js';
