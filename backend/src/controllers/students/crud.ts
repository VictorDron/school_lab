import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../types/index.js';
import { getPaginationParams } from '../../utils/helpers.js';
import * as StudentsService from '../../services/students/index.js';
import logger from '../../utils/logger.js';
import { updateStatusSchema, updateStudentSchema, bulkUpdateSchema } from './schemas.js';

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, grade, status, parentName, enrolledAfter, enrolledBefore, sortBy, sortOrder } = req.query;

    const academicYear = req.query.academicYear
      ? parseInt(req.query.academicYear as string, 10)
      : undefined;

    const ageMin = req.query.ageMin
      ? parseInt(req.query.ageMin as string, 10)
      : undefined;

    const ageMax = req.query.ageMax
      ? parseInt(req.query.ageMax as string, 10)
      : undefined;

    const filters: StudentsService.StudentFilters = {
      ...(search ? { search: search as string } : {}),
      ...(grade ? { grade: grade as string } : {}),
      ...(academicYear && !isNaN(academicYear) ? { academicYear } : {}),
      ...(status ? { status: status as StudentsService.StudentFilters['status'] } : {}),
      ...(parentName ? { parentName: parentName as string } : {}),
      ...(enrolledAfter ? { enrolledAfter: enrolledAfter as string } : {}),
      ...(enrolledBefore ? { enrolledBefore: enrolledBefore as string } : {}),
      ...(ageMin !== undefined && !isNaN(ageMin) ? { ageMin } : {}),
      ...(ageMax !== undefined && !isNaN(ageMax) ? { ageMax } : {}),
      ...(sortBy ? { sortBy: sortBy as StudentsService.StudentFilters['sortBy'] } : {}),
      ...(sortOrder ? { sortOrder: sortOrder as StudentsService.StudentFilters['sortOrder'] } : {}),
    };

    const result = await StudentsService.findMany(filters, { page, limit, skip });

    res.json({
      success: true,
      data: result.students,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    logger.error('Failed to list students', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao listar alunos.' });
  }
}

export async function getById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await StudentsService.findByIdWithDocuments(id);

    if (!result) {
      return res.status(404).json({ success: false, error: 'Aluno não encontrado.' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('Failed to get student by id', { id: req.params.id, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao buscar aluno.' });
  }
}

export async function updateStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = updateStatusSchema.parse(req.body);

    const student = await StudentsService.updateStatus(id, data.status, req.user!.id, data.reason);

    res.json({ success: true, data: student });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos.',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const appErr = err as any;
    if (appErr?.statusCode) {
      return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }

    logger.error('Failed to update student status', { id: req.params.id, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao atualizar status do aluno.' });
  }
}

export async function update(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const data = updateStudentSchema.parse(req.body);

    const student = await StudentsService.updateStudent(id, data, req.user!.id);

    res.json({ success: true, data: student });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos.',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const appErr = err as any;
    if (appErr?.statusCode) {
      return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }

    logger.error('Failed to update student', { id: req.params.id, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao atualizar dados do aluno.' });
  }
}

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const filters: { academicYear?: number } = {};
    if (req.query.academicYear) {
      const year = parseInt(req.query.academicYear as string, 10);
      if (!isNaN(year)) {
        filters.academicYear = year;
      }
    }

    const stats = await StudentsService.getStudentDashboardStats(filters);

    res.json({ success: true, data: stats });
  } catch (err) {
    logger.error('Failed to get student dashboard stats', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas de alunos.' });
  }
}

export async function bulkUpdate(req: AuthenticatedRequest, res: Response) {
  try {
    const data = bulkUpdateSchema.parse(req.body);

    const result = await StudentsService.bulkUpdate(data.ids, data.action, req.user!.id);

    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos.',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    const appErr = err as any;
    if (appErr?.statusCode) {
      return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }

    logger.error('Failed to bulk update students', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao atualizar alunos em lote.' });
  }
}

export async function exportCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, grade, status, parentName, enrolledAfter, enrolledBefore, sortBy, sortOrder } = req.query;

    const academicYear = req.query.academicYear
      ? parseInt(req.query.academicYear as string, 10)
      : undefined;

    const ageMin = req.query.ageMin
      ? parseInt(req.query.ageMin as string, 10)
      : undefined;

    const ageMax = req.query.ageMax
      ? parseInt(req.query.ageMax as string, 10)
      : undefined;

    const filters: StudentsService.StudentFilters = {
      ...(search ? { search: search as string } : {}),
      ...(grade ? { grade: grade as string } : {}),
      ...(academicYear && !isNaN(academicYear) ? { academicYear } : {}),
      ...(status ? { status: status as StudentsService.StudentFilters['status'] } : {}),
      ...(parentName ? { parentName: parentName as string } : {}),
      ...(enrolledAfter ? { enrolledAfter: enrolledAfter as string } : {}),
      ...(enrolledBefore ? { enrolledBefore: enrolledBefore as string } : {}),
      ...(ageMin !== undefined && !isNaN(ageMin) ? { ageMin } : {}),
      ...(ageMax !== undefined && !isNaN(ageMax) ? { ageMax } : {}),
      ...(sortBy ? { sortBy: sortBy as StudentsService.StudentFilters['sortBy'] } : {}),
      ...(sortOrder ? { sortOrder: sortOrder as StudentsService.StudentFilters['sortOrder'] } : {}),
    };

    const csv = await StudentsService.exportCsv(filters);

    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=alunos-export-${today}.csv`);
    res.send(csv);
  } catch (err) {
    logger.error('Failed to export students CSV', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao exportar alunos.' });
  }
}

export async function uploadAvatar(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
    }

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de arquivo inválido. Envie uma imagem JPEG, PNG ou WebP.',
      });
    }

    const avatarUrl = await StudentsService.uploadAvatar(id, file.buffer, file.mimetype, req.user!.id);

    res.json({ success: true, data: { avatarUrl } });
  } catch (err) {
    const appErr = err as any;
    if (appErr?.statusCode) {
      return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }

    logger.error('Failed to upload student avatar', { id: req.params.id, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao enviar foto do aluno.' });
  }
}

export async function getEvolutionStats(req: AuthenticatedRequest, res: Response) {
  try {
    const academicYear = req.query.academicYear
      ? parseInt(req.query.academicYear as string, 10)
      : undefined;

    const stats = await StudentsService.getEvolutionStats(
      academicYear && !isNaN(academicYear) ? academicYear : undefined
    );

    res.json({ success: true, data: stats });
  } catch (err) {
    logger.error('Failed to get student evolution stats', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao buscar estatísticas de evolução.' });
  }
}
