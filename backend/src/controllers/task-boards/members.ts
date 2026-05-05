import { Response } from "express";
import { z } from "zod";
import * as TaskBoardsService from "../../services/task-boards.service.js";
import { createNotification } from "../../services/notification.service.js";
import { AuthenticatedRequest } from "../../types/index.js";
import { getIO } from "../../socket/io.js";
import logger from "../../utils/logger.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { addMemberSchema } from "./schemas.js";

export async function getBoardMembers(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { boardId } = req.params;

    const members = await TaskBoardsService.listBoardMembers(boardId);

    res.json({ success: true, data: members });
  } catch (error) {
    logger.error("Get board members error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function addBoardMember(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const data = addMemberSchema.parse(req.body);

    const member = await TaskBoardsService.addBoardMember(
      boardId,
      data.userId,
    );

    await createNotification({
      userId: data.userId,
      type: "task_board_added",
      title: "Adicionado ao Quadro",
      message: `${req.user!.displayName} adicionou você ao quadro de tarefas`,
      data: { boardId },
    });

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:memberAdded", { boardId, member });
    } catch {}

    res.json({ success: true, data: member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    logger.error("Add board member error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function removeBoardMember(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const { boardId, userId } = req.params;

    await TaskBoardsService.removeBoardMember(boardId, userId);

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:memberRemoved", { boardId, userId });
    } catch {}

    res.json({ success: true, message: "Membro removido com sucesso" });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    logger.error("Remove board member error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}
