import { Response } from 'express';
import { DocumentSecurityLevel, AppModule } from '@prisma/client';
import { getPaginationParams } from '../utils/helpers.js';
import { AuthenticatedRequest } from '../types/index.js';
import * as DocumentsService from '../services/documents.service.js';
import logger from '../utils/logger.js';

// ==================== HANDLERS ====================

export async function listDocuments(req: AuthenticatedRequest, res: Response) {
  try {
    const pagination = getPaginationParams(req.query);
    const { module, securityLevel, search } = req.query;

    const result = await DocumentsService.listDocuments(
      {
        module: module as AppModule | undefined,
        securityLevel: securityLevel as DocumentSecurityLevel | undefined,
        search: search as string | undefined,
      },
      pagination,
      { id: req.user!.id, role: req.user!.role },
    );

    res.json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    logger.error('Get documents error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await DocumentsService.getDocumentById(
      req.params.id,
      { id: req.user!.id, role: req.user!.role },
      req.user!.email,
    );

    if ('error' in result && result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    if ('error' in result && result.error === 'ACCESS_DENIED') {
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Get document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function uploadDocument(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Arquivo obrigatório' });
    }

    const result = await DocumentsService.uploadDocument(
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      req.body,
      req.user!.id,
      req.user!.email,
    );

    if ('error' in result) {
      return res.status(500).json({ success: false, error: 'Falha no upload do arquivo' });
    }

    res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Upload document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function updateDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, description, module, securityLevel, tags } = req.body;

    const result = await DocumentsService.updateDocument(
      req.params.id,
      { title, description, module, securityLevel, tags },
      req.user!.id,
      req.user!.email,
      req.user!.role,
    );

    if ('error' in result && result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    if ('error' in result && result.error === 'ACCESS_DENIED') {
      return res.status(403).json({ success: false, error: 'Apenas o proprietário pode editar' });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    logger.error('Update document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await DocumentsService.deleteDocument(
      req.params.id,
      req.user!.id,
      req.user!.email,
      req.user!.role,
    );

    if ('error' in result && result.error === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    }
    if ('error' in result && result.error === 'ACCESS_DENIED') {
      return res.status(403).json({ success: false, error: 'Apenas o proprietário pode deletar' });
    }

    res.json({ success: true, message: 'Documento deletado' });
  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
}
