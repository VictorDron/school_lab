import { Request, Response } from 'express';
import * as AdmissionsService from '../../../services/admissions.service.js';
import logger from '../../../utils/logger.js';
import { validateMagicBytes } from '../../../middlewares/upload.js';

export async function uploadApplicationDocuments(req: Request, res: Response) {
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
    const validation = await AdmissionsService.validateApplicationToken(token, metadata);

    if (!validation.valid || !validation.lead) {
      if (validation.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Link de inscrição inválido',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (validation.error === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de inscrição expirado',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Erro ao validar link',
      });
    }

    const uploadedDocuments = await AdmissionsService.uploadApplicationDocuments(
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
    logger.error('Public document upload error:', error);
    res.status(500).json({ success: false, error: 'Erro ao enviar documentos' });
  }
}

/**
 * GET /public/application/:token/documents - Get existing documents for a lead
 * Returns list of uploaded documents and pending document requests
 */
export async function getApplicationDocuments(req: Request, res: Response) {
  try {
    const { token } = req.params;

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    // Validate token
    const validation = await AdmissionsService.validateApplicationToken(token, metadata);

    if (!validation.valid || !validation.lead) {
      if (validation.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Link de inscrição inválido',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (validation.error === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de inscrição expirado',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Erro ao validar link',
      });
    }

    const data = await AdmissionsService.getApplicationDocuments(validation.lead.id);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Get public documents error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar documentos' });
  }
}

/**
 * DELETE /public/application/:token/documents/:documentId - Delete admission document
 */
export async function deleteApplicationDocument(req: Request, res: Response) {
  try {
    const { token, documentId } = req.params;

    const metadata = {
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
    };

    // Validate token
    const validation = await AdmissionsService.validateApplicationToken(token, metadata);

    if (!validation.valid || !validation.lead) {
      if (validation.error === 'TOKEN_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'Link de inscrição inválido',
          code: 'TOKEN_NOT_FOUND',
        });
      }

      if (validation.error === 'TOKEN_EXPIRED') {
        return res.status(410).json({
          success: false,
          error: 'Link de inscrição expirado',
          code: 'TOKEN_EXPIRED',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Erro ao validar link',
      });
    }

    await AdmissionsService.deleteApplicationDocument(validation.lead.id, documentId);

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

    logger.error('Delete admission document error:', error);
    res.status(500).json({ success: false, error: 'Erro ao remover documento' });
  }
}
