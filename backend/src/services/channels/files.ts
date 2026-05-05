import { prisma } from '../../config/database.js';
import { extractStoragePath, getSignedUrl, uploadFile } from '../../config/supabase.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../utils/logger.js';
import { ALLOWED_MIME_TYPES } from './shared.js';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Upload chat attachments. Filters disallowed MIME types up-front, then
 * uploads valid files in sequence — partial success is acceptable: returns
 * `failed` so the caller can surface per-file errors instead of failing
 * the whole batch.
 */
export async function uploadFiles(
  channelId: string,
  userId: string,
  files: Express.Multer.File[],
) {
  if (!files || files.length === 0) {
    throw new AppError(400, 'Nenhum arquivo enviado', 'NO_FILES');
  }

  const rejected: string[] = [];
  const validFiles = files.filter((file) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) return true;
    rejected.push(file.originalname);
    return false;
  });

  if (validFiles.length === 0) {
    throw new AppError(400, 'Nenhum arquivo com tipo permitido', 'INVALID_FILE_TYPES');
  }

  const channel = await prisma.channel.findFirst({
    where: {
      id: channelId,
      OR: [
        { type: 'PUBLIC' },
        { members: { some: { userId } } },
      ],
    },
  });

  if (!channel) {
    throw new AppError(404, 'Canal não encontrado', 'CHANNEL_NOT_FOUND');
  }

  const attachments = [];
  const failed: string[] = [];

  for (const file of validFiles) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `chat/${channelId}/${userId}/${timestamp}-${safeName}`;

    const url = await uploadFile(file.buffer, path, file.mimetype);
    if (!url) {
      logger.error(`Failed to upload file: ${file.originalname}`);
      failed.push(file.originalname);
      continue;
    }

    attachments.push({
      name: file.originalname,
      url,
      type: file.mimetype,
      size: file.size,
      storagePath: path,
    });
  }

  if (attachments.length === 0) {
    throw new AppError(500, 'Falha ao fazer upload dos arquivos', 'UPLOAD_FAILED');
  }

  return { attachments, failed, rejected };
}

/**
 * Re-sign a stored attachment URL. Signed URLs expire (default 7 days)
 * so the chat refreshes them on demand when a stale link 403s.
 */
export async function refreshAttachmentUrl(urlOrPath: string) {
  const path = extractStoragePath(urlOrPath);
  if (!path) {
    throw new AppError(400, 'Não foi possível extrair o caminho do arquivo', 'INVALID_PATH');
  }

  const freshUrl = await getSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (!freshUrl) {
    throw new AppError(404, 'Arquivo não encontrado', 'FILE_NOT_FOUND');
  }

  return { url: freshUrl, storagePath: path };
}
