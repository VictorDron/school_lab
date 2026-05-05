import { Request, Response } from 'express';
import * as EnrollmentService from '../../../services/enrollment.service.js';
import logger from '../../../utils/logger.js';
import { validateMagicBytes } from '../../../middlewares/upload.js';

/**
 * POST /public/enrollment/:token/documents - Upload enrollment documents
 */
export async function uploadEnrollmentDocuments(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum arquivo enviado',
      });
    }

    // Validate actual file content via magic bytes (SEC-02)
    for (const file of files) {
      if (!validateMagicBytes(file.buffer)) {
        return res.status(422).json({
          success: false,
          error: 'Tipo de arquivo inválido. O conteúdo do arquivo não corresponde ao tipo declarado.',
        });
      }
    }

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    // Validate token
    const validation = await EnrollmentService.validateEnrollmentToken(token, metadata);

    if (!validation.valid || !validation.lead) {
      if (validation.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Link de matrícula inválido',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (validation.error === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de matrícula expirado',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (validation.error === 'ADMISSION_NOT_COMPLETED') {
        return res.status(400).json({
          success: false,
          error: 'Complete a admissão primeiro',
          code: 'ADMISSION_NOT_COMPLETED',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Erro ao validar link',
      });
    }

    const uploadedDocuments = await EnrollmentService.uploadEnrollmentDocumentsBatch(
      validation.lead,
      files,
      req.body
    );

    res.status(201).json({
      success: true,
      message: `${uploadedDocuments.length} documento(s) enviado(s) com sucesso`,
      data: uploadedDocuments,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'DOCUMENT_LIMIT_EXCEEDED') {
      return res.status(400).json({
        success: false,
        error: 'Limite de documentos atingido (maximo 50)',
        code: 'DOCUMENT_LIMIT_EXCEEDED',
      });
    }

    logger.error('Enrollment document upload error:', error);
    res.status(500).json({ success: false, error: 'Erro ao enviar documentos' });
  }
}

/**
 * DELETE /public/enrollment/:token/documents/:documentId - Delete enrollment document
 */
export async function deleteEnrollmentDocument(req: Request, res: Response) {
  try {
    const { token, documentId } = req.params;

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    // Validate token
    const validation = await EnrollmentService.validateEnrollmentToken(token, metadata);

    if (!validation.valid || !validation.lead) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido',
      });
    }

    // Pass leadId for authorization check - ensures document belongs to this lead
    await EnrollmentService.deleteEnrollmentDocument(documentId, validation.lead.id);

    res.json({
      success: true,
      message: 'Documento removido com sucesso',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'DOCUMENT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Documento não encontrado',
        });
      }
      if (error.message === 'DOCUMENT_NOT_AUTHORIZED') {
        return res.status(403).json({
          success: false,
          error: 'Você não tem permissão para remover este documento',
        });
      }
    }

    logger.error('Delete enrollment document error:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover documento' });
  }
}

/**
 * PATCH /public/enrollment/:token/documents/:documentId/includes
 */
export async function toggleEnrollmentDocumentIncludes(req: Request, res: Response) {
  try {
    const { token, documentId } = req.params;
    const { includesOtherDocs } = req.body;

    if (!token || !documentId) {
      return res.status(400).json({ success: false, error: 'Token e documentId são obrigatórios' });
    }

    if (!Array.isArray(includesOtherDocs)) {
      return res.status(400).json({ success: false, error: 'includesOtherDocs deve ser um array' });
    }

    const validation = await EnrollmentService.validateEnrollmentToken(token, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (!validation.valid || !validation.lead) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido',
      });
    }

    const document = await EnrollmentService.updateDocumentIncludes(
      documentId,
      validation.lead.id,
      includesOtherDocs
    );

    res.json({
      success: true,
      data: document,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'DOCUMENT_NOT_FOUND') {
        return res.status(404).json({ success: false, error: 'Documento não encontrado' });
      }
      if (error.message === 'DOCUMENT_NOT_AUTHORIZED') {
        return res.status(403).json({ success: false, error: 'Você não tem permissão para modificar este documento' });
      }
      if (error.message === 'DOCUMENT_CANNOT_INCLUDE') {
        return res.status(400).json({ success: false, error: 'Este tipo de documento não suporta inclusão' });
      }
      if (error.message === 'INVALID_INCLUDE_TYPE') {
        return res.status(400).json({ success: false, error: 'Tipo de inclusão inválido para este documento' });
      }
    }

    logger.error('Update document includes error:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar documento' });
  }
}
