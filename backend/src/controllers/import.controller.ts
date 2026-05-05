import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as ImportService from '../services/import.service.js';
import * as ImportDocumentsService from '../services/import-documents.service.js';
import { getOrCreateSettings } from '../services/settings.service.js';
import { prisma } from '../config/database.js';
import { getIO } from '../socket/io.js';
import logger from '../utils/logger.js';

const ALLOWED_IMPORT_EXTENSIONS = ['.csv', '.xlsx'];

const confirmSchema = z.object({
  rows: z.array(z.any()),
  duplicateActions: z.record(z.string(), z.enum(['skip', 'update', 'create'])),
  familyGroups: z.array(z.any()),
  fileName: z.string(),
  fileSize: z.number().nullable().optional(),
});

const studentIdsSchema = z.array(z.string().uuid());

export async function preview(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo não enviado.' });
    }

    const ext = req.file.originalname.toLowerCase().slice(req.file.originalname.lastIndexOf('.'));
    if (!ALLOWED_IMPORT_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de arquivo inválido. Envie um arquivo .csv ou .xlsx.',
      });
    }

    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant não resolvido' });
    }
    const { schoolName } = await getOrCreateSettings(tenantId);
    const previewResult = await ImportService.previewImport(req.file.buffer, req.file.originalname, schoolName);

    res.json({ success: true, data: previewResult });
  } catch (err) {
    logger.error('Import preview failed', { error: (err as Error).message });
    res.status(400).json({ success: false, error: (err as Error).message });
  }
}

export async function confirm(req: AuthenticatedRequest, res: Response) {
  try {
    const { rows, duplicateActions, familyGroups, fileName, fileSize } = confirmSchema.parse(req.body);
    const user = req.user!;

    // Create ImportHistory immediately with PROCESSING status
    const importHistory = await ImportService.createImportHistory({
      userId: user.id,
      fileName,
      fileSize: fileSize ?? null,
      totalRows: rows.length,
    });

    // Return immediately — processing happens in background
    res.json({
      success: true,
      data: {
        importHistoryId: importHistory.id,
        status: 'PROCESSING',
        totalRows: rows.length,
      },
    });

    // Process in background (fire-and-forget)
    ImportService.processImportInBackground(
      importHistory.id,
      { rows, duplicateActions, familyGroups },
      user.id,
      user.email,
      fileName,
    ).then((result) => {
      try {
        getIO().to('students:list').emit('import:completed', result);
      } catch {
        // Non-fatal
      }
    }).catch((err) => {
      logger.error('Background import failed', { importHistoryId: importHistory.id, error: (err as Error).message });
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos.',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      });
    }

    logger.error('Import confirm failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao confirmar importação.' });
  }
}

export async function downloadTemplate(_req: AuthenticatedRequest, res: Response) {
  try {
    const templateBuffer = ImportService.generateTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template-importacao-school-lab.xlsx"');
    res.send(templateBuffer);
  } catch (err) {
    logger.error('Template download failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao gerar template.' });
  }
}

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

    const rawStudentIds = req.body.studentIds;
    let studentIds: string[];
    try {
      studentIds = studentIdsSchema.parse(
        typeof rawStudentIds === 'string' ? JSON.parse(rawStudentIds) : rawStudentIds,
      );
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Lista de IDs de alunos inválida.',
      });
    }

    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, fullName: true, leadId: true, leadChildId: true },
    });

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

    let uploadResult = { uploaded: 0, skipped: 0, failed: 0, errors: [] as Array<{ fileName: string; error: string }> };
    if (matchResult.matched.length > 0) {
      uploadResult = await ImportDocumentsService.uploadMatchedDocuments(
        matchResult.matched,
        req.user!.id,
      );
    }

    res.json({
      success: true,
      data: {
        matched: matchResult.matched.length,
        unmatched: matchResult.unmatched.length,
        uploadResult,
      },
    });
  } catch (err) {
    logger.error('Document upload failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao processar documentos.' });
  }
}

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 25));

    const result = await ImportService.listImportHistories(undefined, page, limit);

    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (err) {
    logger.error('Import history list failed', { error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao listar histórico de importações.' });
  }
}

export async function getHistoryById(req: AuthenticatedRequest, res: Response) {
  try {
    const history = await ImportService.getImportHistory(req.params.id);

    if (!history) {
      return res.status(404).json({
        success: false,
        error: 'Histórico de importação não encontrado.',
      });
    }

    res.json({ success: true, data: history });
  } catch (err) {
    logger.error('Import history detail failed', { id: req.params.id, error: (err as Error).message });
    res.status(500).json({ success: false, error: 'Erro ao buscar histórico de importação.' });
  }
}
