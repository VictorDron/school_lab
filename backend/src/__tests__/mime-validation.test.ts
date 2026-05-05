// SEC-02: Magic bytes MIME type validation on file uploads
import { describe, it, expect } from 'vitest';
import { validateMagicBytes } from '../middlewares/upload.js';

describe('validateMagicBytes', () => {
  it('should accept file when PDF magic bytes match PDF MIME type', () => {
    // PDF magic bytes: %PDF- (hex 25 50 44 46 2D)
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    expect(validateMagicBytes(pdfBuffer)).toBe(true);
  });

  it('should reject with false when PHP file bytes are presented (no valid magic bytes)', () => {
    // PHP file starting with <?php — not a recognized magic type for allowed extensions
    const phpBuffer = Buffer.from('<?php echo "hello"; ?>');
    expect(validateMagicBytes(phpBuffer)).toBe(false);
  });

  it('should accept file when JPEG magic bytes match JPEG MIME type', () => {
    // JPEG SOI marker: FF D8 FF E0
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    expect(validateMagicBytes(jpegBuffer)).toBe(true);
  });

  it('should reject empty buffer regardless of declared MIME type', () => {
    const emptyBuffer = Buffer.alloc(0);
    expect(validateMagicBytes(emptyBuffer)).toBe(false);
  });

  it('should reject null-like buffer', () => {
    // Buffer with no recognizable content
    const randomBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    // Random bytes won't match any allowed magic type
    expect(validateMagicBytes(randomBuffer)).toBe(false);
  });
});
