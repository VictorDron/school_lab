import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../../types/index.js';
import * as StudentsService from '../../services/students/index.js';
import * as ImportDocumentsService from '../../services/import-documents.service.js';
import logger from '../../utils/logger.js';
import { reviewDocumentSchema, documentUploadSchema } from './schemas.js';

export async function uploadStudentDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }

    const documentType = req.body.documentType || 'OTHER';

    const doc = await StudentsService.uploadStudentDocument(
      id,
      { buffer: file.buffer, originalname: file.originalname, mimetype: file.mimetype, size: file.size },
      req.user!.id,
      documentType,
    );

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    const appErr = err as any;
    if (appErr?.statusCode) {
      return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }
    logger.error('Failed to upload student document', { id: req.params.id, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao enviar documento.' });
  }
}

export async function reviewStudentDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { id, docId } = req.params;
    const data = reviewDocumentSchema.parse(req.body);

    const doc = await StudentsService.reviewStudentDocument(id, docId, req.user!.id, data.status, data.rejectionReason);

    res.json({ success: true, data: doc });
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
    logger.error('Failed to review student document', { id: req.params.id, docId: req.params.docId, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao revisar documento.' });
  }
}

export async function deleteStudentDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { id, docId } = req.params;
    await StudentsService.deleteStudentDocument(id, docId, req.user!.id);
    res.json({ success: true, message: 'Documento excluído com sucesso.' });
  } catch (err) {
    const appErr = err as any;
    if (appErr?.statusCode) {
      return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }
    logger.error('Failed to delete student document', { id: req.params.id, docId: req.params.docId, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao excluir documento.' });
  }
}

export async function updateStudentDocumentType(req: AuthenticatedRequest, res: Response) {
  try {
    const { id, docId } = req.params;
    const { documentType } = req.body;

    if (!documentType || typeof documentType !== 'string') {
      return res.status(400).json({ success: false, error: 'Tipo de documento é obrigatório.' });
    }

    const doc = await StudentsService.updateStudentDocumentType(id, docId, documentType, req.user!.id);
    res.json({ success: true, data: doc });
  } catch (err) {
    const appErr = err as any;
    if (appErr?.statusCode) {
      return res.status(appErr.statusCode).json({ success: false, error: appErr.message });
    }
    logger.error('Failed to update student document type', { id: req.params.id, docId: req.params.docId, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao atualizar tipo do documento.' });
  }
}

/**
 * Upload documents ZIP and match to students via fuzzy name matching.
 * Supports 3 selection modes: explicit studentIds, importHistoryId, or filters.
 */
export async function uploadDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.zip')) {
      return res.status(400).json({
        success: false,
        error: 'Formato de arquivo inválido. Envie um arquivo .zip.',
      });
    }

    // Parse body — studentIds/importHistoryId/filters may come as JSON string from FormData
    const rawBody: Record<string, unknown> = {};
    for (const key of ['studentIds', 'importHistoryId', 'filters']) {
      const val = req.body[key];
      if (val === undefined) continue;
      rawBody[key] = typeof val === 'string' ? JSON.parse(val) : val;
    }

    const body = documentUploadSchema.parse(rawBody);

    let studentIds: string[];

    if (body.studentIds) {
      studentIds = body.studentIds;
    } else if (body.importHistoryId) {
      const idsFromImport = await StudentsService.findStudentIdsFromImport(
        body.importHistoryId,
      );
      if (!idsFromImport) {
        return res.status(404).json({
          success: false,
          error: 'Importação não encontrada ou sem alunos criados.',
        });
      }
      studentIds = idsFromImport;
    } else {
      studentIds = await StudentsService.findStudentIdsByImportFilters(
        body.filters ?? {},
      );
    }

    if (studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum aluno encontrado com os critérios informados.',
      });
    }

    const students = await StudentsService.findStudentRefsByIds(studentIds);

    const studentRefs = students.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      leadId: s.leadId ?? '',
      leadChildId: s.leadChildId ?? '',
    }));

    const matchResult = await ImportDocumentsService.extractAndMatchDocuments(
      req.file.buffer,
      studentRefs,
    );

    let uploadResult = { uploaded: 0, failed: 0, errors: [] as Array<{ fileName: string; error: string }> };
    if (matchResult.matched.length > 0) {
      uploadResult = await ImportDocumentsService.uploadMatchedDocuments(
        matchResult.matched,
        req.user!.id,
      );
    }

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        matched: matchResult.matched.map((d) => ({
          folderName: d.folderName,
          fileName: d.fileName,
          matchedStudentId: d.matchedStudentId,
          matchScore: d.matchScore,
        })),
        unmatched: matchResult.unmatched.map((d) => ({
          folderName: d.folderName,
          fileName: d.fileName,
        })),
        uploadResult,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos.',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    logger.error('Failed to upload student documents', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao processar documentos.' });
  }
}
