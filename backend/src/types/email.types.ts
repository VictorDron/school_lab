export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}
