import { createClient } from '@supabase/supabase-js';
import { config } from './index.js';
import logger from '../utils/logger.js';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

/**
 * Inicializa o bucket de storage do Supabase.
 * Cria o bucket se não existir e configura como público.
 */
export async function initializeStorage(): Promise<void> {
  const bucketName = config.supabase.bucket;
  
  try {
    // Verifica se o bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      logger.error('Erro ao listar buckets:', listError.message);
      return;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Cria o bucket como privado (documentos sensíveis)
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
      });
      
      if (createError) {
        logger.error('Erro ao criar bucket:', createError.message);
      } else {
        logger.info(`Bucket "${bucketName}" criado com sucesso`);
      }
    } else {
      logger.info(`Bucket "${bucketName}" ja existe`);
    }
  } catch (error) {
    logger.error('Erro ao inicializar storage:', error);
  }
}

export async function uploadFile(
  buffer: Buffer,
  path: string,
  contentType: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(config.supabase.bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    logger.error('Upload error:', error);
    return null;
  }

  // Retorna signed URL (bucket privado)
  const { data: signedData, error: signError } = await supabase.storage
    .from(config.supabase.bucket)
    .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 dias

  if (signError) {
    logger.error('Signed URL error after upload:', signError);
    return `${config.supabase.url}/storage/v1/object/${config.supabase.bucket}/${data.path}`;
  }

  return signedData.signedUrl;
}

export async function deleteFile(path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(config.supabase.bucket)
    .remove([path]);

  if (error) {
    logger.error('Delete error:', error);
    return false;
  }

  return true;
}

export async function getSignedUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(config.supabase.bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    logger.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Extract the storage path from a Supabase signed URL or plain path.
 */
export function extractStoragePath(urlOrPath: string): string | null {
  if (!urlOrPath) return null;

  // Already a plain path
  if (!urlOrPath.startsWith('http')) {
    return urlOrPath;
  }

  try {
    const url = new URL(urlOrPath);
    const pathname = decodeURIComponent(url.pathname);
    const bucketName = config.supabase.bucket;

    // Signed URL: /storage/v1/object/sign/{bucket}/{path}
    const signedPattern = `/storage/v1/object/sign/${bucketName}/`;
    const signedIdx = pathname.indexOf(signedPattern);
    if (signedIdx !== -1) {
      return pathname.substring(signedIdx + signedPattern.length);
    }

    // Public URL: /storage/v1/object/public/{bucket}/{path}
    const publicPattern = `/storage/v1/object/public/${bucketName}/`;
    const publicIdx = pathname.indexOf(publicPattern);
    if (publicIdx !== -1) {
      return pathname.substring(publicIdx + publicPattern.length);
    }

    // Authenticated URL: /storage/v1/object/authenticated/{bucket}/{path}
    const authPattern = `/storage/v1/object/authenticated/${bucketName}/`;
    const authIdx = pathname.indexOf(authPattern);
    if (authIdx !== -1) {
      return pathname.substring(authIdx + authPattern.length);
    }

    // Generic: /storage/v1/object/{bucket}/{path}
    const genericPattern = `/storage/v1/object/${bucketName}/`;
    const genericIdx = pathname.indexOf(genericPattern);
    if (genericIdx !== -1) {
      return pathname.substring(genericIdx + genericPattern.length);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Refresh a document URL by generating a new signed URL from the stored URL/path.
 * Returns a fresh signed URL valid for 1 hour.
 */
export async function refreshDocumentUrl(urlOrPath: string): Promise<string> {
  const storagePath = extractStoragePath(urlOrPath);
  if (!storagePath) return urlOrPath; // Return original if can't parse

  const freshUrl = await getSignedUrl(storagePath, 3600); // 1 hour
  return freshUrl || urlOrPath; // Fallback to original
}
