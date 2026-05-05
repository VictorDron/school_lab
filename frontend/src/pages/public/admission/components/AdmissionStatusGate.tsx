import { AlertCircle, CheckCircle, Clock, Link2Off, Loader2 } from 'lucide-react';
import { PublicStatusCard } from '@/components/public/shared';
import type { AdmissionTranslations } from '../translations';

export type AdmissionTokenError = 'expired' | 'invalid' | null;

interface AdmissionStatusGateProps {
  applicationToken: string | null;
  tokenError: AdmissionTokenError;
  isPrefillLoading: boolean;
  submitted: boolean;
  t: AdmissionTranslations;
}

/**
 * Returns the matching status screen for any pre-form state, or null when
 * the form should render. The order matters — checks fall through from
 * "no token" to "submitted" so each stage takes priority over later ones.
 */
export function AdmissionStatusGate({
  applicationToken,
  tokenError,
  isPrefillLoading,
  submitted,
  t,
}: AdmissionStatusGateProps): JSX.Element | null {
  const backHome = <a href="/" className="btn btn-primary btn-md">{t.backToHome}</a>;

  if (!applicationToken) {
    return (
      <PublicStatusCard
        gradientBackground
        variant="neutral"
        icon={Link2Off}
        title={t.restrictedAccess}
        message={t.restrictedMessage}
        footer={backHome}
      />
    );
  }

  if (tokenError === 'expired') {
    return (
      <PublicStatusCard
        gradientBackground
        variant="amber"
        icon={Clock}
        title={t.linkExpired}
        message={t.expiredMessage}
        footer={backHome}
      />
    );
  }

  if (tokenError === 'invalid') {
    return (
      <PublicStatusCard
        gradientBackground
        variant="red"
        icon={AlertCircle}
        title={t.invalidLink}
        message={t.invalidMessage}
        footer={backHome}
      />
    );
  }

  if (isPrefillLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-neutral-600">{t.loadingData}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <PublicStatusCard
        gradientBackground
        variant="green"
        icon={CheckCircle}
        title={t.applicationSubmitted}
        message={t.submittedMessage}
      />
    );
  }

  return null;
}
