import multer from 'multer';
import { filetypeinfo } from 'magic-bytes.js';

// Allowed file extensions determined by actual file content (magic bytes).
// Note: magic-bytes.js uses 'jpeg' (not 'jpg') for JPEG files.
export const ALLOWED_MAGIC_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'docx', 'xlsx']);

/**
 * Validates that a file buffer's actual content matches an allowed type.
 * Uses magic bytes (file signatures) rather than trusting the browser-declared MIME type.
 * This prevents file upload spoofing (SEC-02).
 */
export function validateMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length === 0) return false;
  const detected = filetypeinfo(buffer);
  return detected.some((t) => t.extension && ALLOWED_MAGIC_EXTENSIONS.has(t.extension));
}

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, imagens e documentos Office são aceitos.'));
    }
  },
});
