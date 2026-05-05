import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// ==================== CONFIGURATION ====================
// Uses ClickSign API v1 (the version supported by the account's access token)

function getBaseUrl(): string {
  const env = process.env.CLICKSIGN_ENV || 'sandbox';
  return env === 'production'
    ? 'https://app.clicksign.com/api/v1'
    : 'https://sandbox.clicksign.com/api/v1';
}

function getAccessToken(): string {
  const token = process.env.CLICKSIGN_ACCESS_TOKEN;
  if (!token) throw new Error('CLICKSIGN_NOT_CONFIGURED');
  return token;
}

function apiUrl(path: string): string {
  return `${getBaseUrl()}${path}?access_token=${getAccessToken()}`;
}

function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (parseInt(cpf[9]) !== d1) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  return parseInt(cpf[10]) === d2;
}

// ==================== API v1 FUNCTIONS ====================

/**
 * Creates a document in ClickSign from base64 content.
 * In API v1, there are no "envelopes" — documents are the main entity.
 * Returns: { document: { key, path, status, ... } }
 */
export async function createDocument(
  base64Content: string,
  filename: string,
  deadline: string,
) {
  try {
    const response = await axios.post(apiUrl('/documents'), {
      document: {
        path: `/risys/${filename}`,
        content_base64: `data:application/pdf;base64,${base64Content}`,
        deadline_at: `${deadline}T23:59:59-03:00`,
        auto_close: true,
        locale: 'pt-BR',
        sequence_enabled: false,
      },
    }, { headers: { 'Content-Type': 'application/json' } });
    logger.info('ClickSign createDocument success', { filename, documentKey: response.data?.document?.key });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.error('ClickSign createDocument failed', { status: err.response?.status, data: err.response?.data, filename });
    }
    throw err;
  }
}

/**
 * Creates a signer in ClickSign.
 * Returns: { signer: { key, email, ... } }
 */
export async function createSigner(
  email: string,
  name: string,
  cpf?: string,
  birthday?: string,
) {
  // ClickSign requires at least first + last name ("nome e sobrenome")
  const trimmedName = name.trim();
  if (trimmedName.split(/\s+/).length < 2) {
    throw new Error(`CLICKSIGN_SIGNER_INVALID_NAME`);
  }

  const signerData: any = {
    email,
    auths: ['email'],
    name: trimmedName,
  };
  // Only send CPF if valid (ClickSign validates CPF check digits)
  if (cpf) {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length === 11 && isValidCpf(cleanCpf)) {
      signerData.documentation = cleanCpf;
    }
  }
  if (birthday) signerData.birthday = birthday;

  try {
    const response = await axios.post(apiUrl('/signers'), {
      signer: signerData,
    }, { headers: { 'Content-Type': 'application/json' } });
    logger.info('ClickSign createSigner success', { email, signerKey: response.data?.signer?.key });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.error('ClickSign createSigner failed', { status: err.response?.status, data: err.response?.data, email });
    }
    throw err;
  }
}

/**
 * Adds a signer to a document (creates a "list" / signing requirement).
 * sign_as: 'sign' (assinar), 'approve' (aprovar), 'witness' (testemunhar)
 */
export async function addSignerToDocument(
  documentKey: string,
  signerKey: string,
  signAs?: string,
) {
  try {
    const response = await axios.post(apiUrl('/lists'), {
      list: {
        document_key: documentKey,
        signer_key: signerKey,
        sign_as: signAs || 'sign',
      },
    }, { headers: { 'Content-Type': 'application/json' } });
    logger.info('ClickSign addSignerToDocument success', { documentKey, signerKey });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.error('ClickSign addSignerToDocument failed', { status: err.response?.status, data: err.response?.data, documentKey, signerKey });
    }
    throw err;
  }
}

/**
 * Sends notification emails to signers of a document.
 */
export async function notifySigners(
  documentKey: string,
  message?: string,
) {
  const response = await axios.post(apiUrl('/notifications'), {
    request_signature_key: documentKey,
    message: message || 'Por favor, assine o contrato de prestação de serviços educacionais.',
  }, { headers: { 'Content-Type': 'application/json' } });
  return response.data;
}

/**
 * Gets document details including download URL.
 */
export async function getDocument(documentKey: string) {
  const response = await axios.get(apiUrl(`/documents/${documentKey}`));
  return response.data;
}

// ==================== WRAPPER FUNCTIONS ====================
// These maintain the same interface as the old v3 code so contract.service.ts works

/**
 * Creates an "envelope" (document in v1 terms).
 * Kept for compatibility with contract.service.ts
 */
export async function createEnvelope(
  name: string,
  deadline: string,
  _locale?: string,
) {
  // In v1, we don't create envelopes separately — we return a placeholder
  // The actual document is created in uploadDocument
  return { data: { id: `pending-${name}`, attributes: { name, deadline } } };
}

/**
 * Uploads a document to a "envelope" (creates a document in v1).
 */
export async function uploadDocument(
  _envelopeId: string,
  base64Content: string,
  filename: string,
) {
  // Extract deadline from envelope placeholder or use 30 days
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  const deadlineStr = deadline.toISOString().split('T')[0];

  const result = await createDocument(base64Content, filename, deadlineStr);
  // Return in v3-like format for compatibility
  return { data: { id: result.document.key } };
}

/**
 * Adds a signer to an "envelope" (creates signer + list in v1).
 */
export async function addSigner(
  _envelopeId: string,
  name: string,
  email: string,
  cpf?: string,
  _authMethod?: string,
) {
  const result = await createSigner(email, name, cpf);
  // Store the document key temporarily — it will be linked via addRequirement
  return { data: { id: result.signer.key } };
}

/**
 * Creates a signing requirement (adds signer to document in v1).
 * Returns the request_signature_key for notifications.
 */
export async function addRequirement(
  _envelopeId: string,
  signerKey: string,
  documentKey: string,
  _action?: string,
) {
  const result = await addSignerToDocument(documentKey, signerKey, 'sign');
  const requestSignatureKey = result.list?.request_signature_key;
  return { data: { id: requestSignatureKey || documentKey, requestSignatureKey } };
}

/**
 * "Activates" an envelope — in v1, the document is already active after creation.
 * Accepts an array of request_signature_keys to notify (thread-safe, no global state).
 */
export async function activateEnvelope(documentKey: string, notificationKeys?: string[]) {
  const keys = notificationKeys || [];

  for (const key of keys) {
    try {
      await notifySigners(key);
    } catch {
      // Individual notification failure is non-critical
    }
  }

  return { data: { id: documentKey } };
}

/**
 * Gets documents from an "envelope" (gets document details in v1).
 */
export async function getEnvelopeDocuments(documentKey: string) {
  try {
    const result = await getDocument(documentKey);
    return {
      data: [{
        attributes: {
          signed_url: result.document?.downloads?.signed_file_url,
          download_url: result.document?.downloads?.original_file_url,
        },
      }],
    };
  } catch {
    return { data: [] };
  }
}

// ==================== WEBHOOK VERIFICATION ====================

/**
 * Verifies the HMAC-SHA256 signature of an incoming ClickSign webhook.
 * Returns true if the signature is valid, false otherwise.
 */
export function verifyWebhookHmac(body: string, hmacHeader: string): boolean {
  const secret = process.env.CLICKSIGN_WEBHOOK_SECRET;

  // Skip HMAC verification in dev when secret is not configured
  if (!secret) {
    logger.info('ClickSign HMAC: skipping verification (no secret configured)');
    return true;
  }

  // ClickSign v1 sends Content-Hmac as "sha256=<hex>" — strip the prefix
  const receivedHex = hmacHeader.replace(/^sha256=/, '');

  const computed = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  logger.info('ClickSign HMAC verification', {
    computedPrefix: computed.substring(0, 12),
    receivedPrefix: receivedHex.substring(0, 12),
    bodyLength: body.length,
  });

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(receivedHex, 'hex'),
    );
  } catch {
    logger.warn('ClickSign HMAC: timingSafeEqual threw (buffer length mismatch)', {
      computedLen: computed.length,
      receivedLen: receivedHex.length,
    });
    return false;
  }
}
