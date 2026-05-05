import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getModuleChannel } from '../services/module-channel.service.js';
import { AppModule } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { Response } from 'express';
import logger from '../utils/logger.js';

const router = Router();

router.use(authenticate);

// Get channel linked to a module entity
router.get('/:module/:entityType/:entityId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { module, entityType, entityId } = req.params;

    const validModules: AppModule[] = ['COMMUNICATION', 'PROCUREMENT', 'ASSETS', 'CRM', 'GED', 'ADMIN'];
    if (!validModules.includes(module as AppModule)) {
      return res.status(400).json({ success: false, error: 'Módulo inválido' });
    }

    const moduleChannel = await getModuleChannel(module as AppModule, entityType, entityId);

    if (!moduleChannel) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: moduleChannel });
  } catch (error) {
    logger.error('Get module channel error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

export default router;
