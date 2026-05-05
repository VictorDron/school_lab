export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Rate limiting: Resend allows 2 requests/second, so we wait 600ms between emails
export const EMAIL_THROTTLE_MS = 600;

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
