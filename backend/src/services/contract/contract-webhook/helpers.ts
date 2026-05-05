import { uploadFile } from '../../../config/supabase.js';
import logger from '../../../utils/logger.js';

/**
 * Upload to Supabase with exponential backoff retry. Returns the resulting URL or
 * null if every attempt failed.
 */
export async function retryUpload(
  buffer: Buffer,
  path: string,
  contentType: string,
  maxRetries = 3,
): Promise<string | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const url = await uploadFile(buffer, path, contentType);
    if (url) return url;
    if (attempt < maxRetries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      logger.warn(`[Webhook] Supabase upload attempt ${attempt} failed, retrying in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  return null;
}
