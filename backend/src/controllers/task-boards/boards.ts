import { Response } from "express";
import { z } from "zod";
import { createAuditLog } from "../../services/audit.service.js";
import * as TaskBoardsService from "../../services/task-boards.service.js";
import { AuthenticatedRequest } from "../../types/index.js";
import { getIO } from "../../socket/io.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { createBoardSchema, updateBoardSchema } from "./schemas.js";

export async function getBoards(req: AuthenticatedRequest, res: Response) {
  try {
    const boards = await TaskBoardsService.listBoards(req.user!.id);

    res.json({ success: true, data: boards });
  } catch (error) {
    logger.error("Get boards error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function getBoard(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const userId = req.user!.id;

    const hasAccess = await TaskBoardsService.checkBoardAccess(userId, boardId);
    if (!hasAccess) {
      return res.status(404).json({
        success: false,
        error: "Quadro não encontrado",
      });
    }

    const board = await TaskBoardsService.getBoard(boardId);

    res.json({ success: true, data: board });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    logger.error("Get board error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function createBoard(req: AuthenticatedRequest, res: Response) {
  try {
    const data = createBoardSchema.parse(req.body);
    const userId = req.user!.id;

    const board = await TaskBoardsService.createBoard(userId, data);

    await createAuditLog(
      {
        actorId: userId,
        actorEmail: req.user!.email,
        action: "TASK_BOARD_CREATED",
        entityType: "TASK_BOARD",
        entityId: board.id,
        metadata: { name: data.name, visibility: data.visibility },
      },
      req,
    );

    try {
      const io = getIO();
      io.emit("task:boardCreated", { board });
    } catch {}

    res.status(201).json({ success: true, data: board });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    logger.error("Create board error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function updateBoard(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const data = updateBoardSchema.parse(req.body);
    const userId = req.user!.id;

    const hasAccess = await TaskBoardsService.checkBoardAccess(
      userId,
      boardId,
      true,
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Sem permissão para editar este quadro",
      });
    }

    const board = await TaskBoardsService.updateBoard(boardId, data);

    await createAuditLog(
      {
        actorId: userId,
        actorEmail: req.user!.email,
        action: "TASK_BOARD_UPDATED",
        entityType: "TASK_BOARD",
        entityId: boardId,
        metadata: data,
      },
      req,
    );

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:boardUpdated", { board });
    } catch {}

    res.json({ success: true, data: board });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    logger.error("Update board error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function archiveBoard(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const userId = req.user!.id;

    const hasAccess = await TaskBoardsService.checkBoardAccess(
      userId,
      boardId,
      true,
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: "Sem permissão para arquivar este quadro",
      });
    }

    const board = await TaskBoardsService.archiveBoard(boardId);

    await createAuditLog(
      {
        actorId: userId,
        actorEmail: req.user!.email,
        action: "TASK_BOARD_UPDATED",
        entityType: "TASK_BOARD",
        entityId: boardId,
        metadata: { isArchived: true },
      },
      req,
    );

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:boardArchived", { boardId });
    } catch {}

    res.json({ success: true, data: board });
  } catch (error) {
    logger.error("Archive board error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}
