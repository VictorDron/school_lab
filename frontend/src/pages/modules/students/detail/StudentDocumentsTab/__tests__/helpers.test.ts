import { describe, it, expect } from 'vitest';
import {
  canPreview,
  formatDate,
  formatDocType,
  formatFileSize,
  isImage,
  unifyDocuments,
} from '../helpers';

describe('formatDocType', () => {
  it('maps known type codes to their pt-BR labels', () => {
    expect(formatDocType('STUDENT_ID')).toBe('RG do Aluno');
    expect(formatDocType('BIRTH_CERTIFICATE')).toBe('Certidão de Nascimento');
    expect(formatDocType('OTHER')).toBe('Outro');
  });

  it('returns the original code when no label is mapped', () => {
    expect(formatDocType('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
  });
});

describe('formatDate', () => {
  it('formats an ISO string as dd/MM/yyyy', () => {
    expect(formatDate('2026-05-03T12:00:00Z')).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('returns the em-dash placeholder for null/undefined', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns the em-dash placeholder for an invalid date', () => {
    expect(formatDate('not a date')).toBe('—');
  });
});

describe('formatFileSize', () => {
  it('renders bytes for sub-KB values', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('renders KB with one decimal for sub-MB values', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('renders MB with one decimal for larger values', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('returns an empty string for falsy inputs', () => {
    expect(formatFileSize(undefined)).toBe('');
    expect(formatFileSize(0)).toBe('');
  });
});

describe('isImage', () => {
  it('returns true for image mime types', () => {
    expect(isImage('image/jpeg')).toBe(true);
    expect(isImage('image/png')).toBe(true);
  });

  it('returns false for non-image mime types', () => {
    expect(isImage('application/pdf')).toBe(false);
    expect(isImage(undefined)).toBe(false);
  });
});

describe('canPreview', () => {
  it('returns true for images and PDFs', () => {
    expect(canPreview('image/png')).toBe(true);
    expect(canPreview('application/pdf')).toBe(true);
  });

  it('returns false for everything else', () => {
    expect(canPreview('application/msword')).toBe(false);
    expect(canPreview(undefined)).toBe(false);
  });
});

describe('unifyDocuments', () => {
  it('normalizes admission docs as APPROVED with field aliases', () => {
    const [doc] = unifyDocuments(
      [{ id: 'a1', name: 'rg.pdf', url: 'http://x/rg.pdf', type: 'STUDENT_ID', size: 100 }],
      [],
    );
    expect(doc.source).toBe('admission');
    expect(doc.fileName).toBe('rg.pdf');
    expect(doc.fileUrl).toBe('http://x/rg.pdf');
    expect(doc.documentType).toBe('STUDENT_ID');
    expect(doc.status).toBe('APPROVED');
    expect(doc.category).toBe('ADMISSION');
    expect(doc.fileSize).toBe(100);
  });

  it('falls back to the alternate field names when admission aliases are missing', () => {
    const [doc] = unifyDocuments(
      [{ id: 'a2', fileName: 'foto.jpg', fileUrl: 'http://x/foto.jpg', fileSize: 50 }],
      [],
    );
    expect(doc.fileName).toBe('foto.jpg');
    expect(doc.fileUrl).toBe('http://x/foto.jpg');
    expect(doc.documentType).toBe('OTHER');
    expect(doc.fileSize).toBe(50);
  });

  it('passes through enrollment doc fields unchanged', () => {
    const [doc] = unifyDocuments(
      [],
      [
        {
          id: 'e1',
          fileName: 'laudo.pdf',
          fileUrl: 'http://x/laudo.pdf',
          documentType: 'MEDICAL_REPORT',
          status: 'REJECTED',
          rejectionReason: 'Ilegível',
          category: 'STUDENT',
          mimeType: 'application/pdf',
        },
      ],
    );
    expect(doc.source).toBe('enrollment');
    expect(doc.status).toBe('REJECTED');
    expect(doc.rejectionReason).toBe('Ilegível');
    expect(doc.category).toBe('STUDENT');
  });

  it('defaults enrollment status to PENDING and category to STUDENT', () => {
    const [doc] = unifyDocuments(
      [],
      [{ id: 'e2', fileName: 'x.pdf', fileUrl: 'http://x/x.pdf' }],
    );
    expect(doc.status).toBe('PENDING');
    expect(doc.category).toBe('STUDENT');
    expect(doc.documentType).toBe('OTHER');
  });

  it('concatenates admission then enrollment docs', () => {
    const list = unifyDocuments(
      [{ id: 'a1', name: 'a.pdf', url: 'http://x/a.pdf' }],
      [{ id: 'e1', fileName: 'e.pdf', fileUrl: 'http://x/e.pdf' }],
    );
    expect(list).toHaveLength(2);
    expect(list[0].source).toBe('admission');
    expect(list[1].source).toBe('enrollment');
  });
});
