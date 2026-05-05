import { z } from 'zod';

export const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'CANCELLED']),
  reason: z.string().optional(),
});

export const updateStudentSchema = z.object({
  fullName: z.string().min(2).max(200).optional(),
  grade: z.string().optional(),
  academicYear: z.number().int().min(2020).max(2035).optional(),
  dateOfBirth: z.string().datetime().optional().or(z.null()),
  cpf: z.string().optional().or(z.null()),
  gender: z.string().optional().or(z.null()),
  nationality: z.string().optional().or(z.null()),
});

export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.object({
    type: z.enum(['changeGrade', 'changeStatus']),
    value: z.string().min(1),
  }),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
}).refine(
  (data) => data.status !== 'REJECTED' || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: 'Motivo da rejeição é obrigatório.' },
);

export const documentUploadSchema = z.object({
  studentIds: z.array(z.string().uuid()).optional(),
  importHistoryId: z.string().uuid().optional(),
  filters: z.object({
    academicYear: z.number().int().optional(),
    grade: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'CANCELLED']).optional(),
  }).optional(),
}).refine(
  (data) => data.studentIds || data.importHistoryId || data.filters,
  { message: 'Informe studentIds, importHistoryId ou filters.' },
);
