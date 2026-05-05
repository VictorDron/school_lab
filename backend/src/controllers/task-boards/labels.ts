import { Response } from "express";
import { z } from "zod";
import * as TaskBoardsService from "../../services/task-boards.service.js";
import { AuthenticatedRequest } from "../../types/index.js";
import { getIO } from "../../socket/io.js";
import logger from "../../utils/logger.js";
import { createLabelSchema, updateLabelSchema } from "./schemas.js";

export async function getLabels(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;

    const labels = await TaskBoardsService.listLabels(boardId);

    res.json({ success: true, data: labels });
  } catch (error) {
    logger.error("Get labels error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function createLabel(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const data = createLabelSchema.parse(req.body);

    const label = await TaskBoardsService.createLabel(boardId, data);

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:labelCreated", { boardId, label });
    } catch {}

    res.status(201).json({ success: true, data: label });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    logger.error("Create label error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function updateLabel(req: AuthenticatedRequest, res: Response) {
  try {
    const { labelId } = req.params;
    const data = updateLabelSchema.parse(req.body);

    const label = await TaskBoardsService.updateLabel(labelId, data);

    try {
      const io = getIO();
      io.to(`board:${label.boardId}`).emit("task:labelUpdated", { label });
    } catch {}

    res.json({ success: true, data: label });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    logger.error("Update label error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function deleteLabel(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId, labelId } = req.params;

    await TaskBoardsService.deleteLabel(labelId);

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:labelDeleted", { boardId, labelId });
    } catch {}

    res.json({ success: true, message: "Label excluída com sucesso" });
  } catch (error) {
    logger.error("Delete label error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}
