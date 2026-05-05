import { Response } from "express";
import { z } from "zod";
import * as TaskBoardsService from "../../services/task-boards.service.js";
import { AuthenticatedRequest } from "../../types/index.js";
import { getIO } from "../../socket/io.js";
import logger from "../../utils/logger.js";
import {
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
} from "./schemas.js";

export async function getColumns(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;

    const columns = await TaskBoardsService.listColumns(boardId);

    res.json({ success: true, data: columns });
  } catch (error) {
    logger.error("Get columns error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function createColumn(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const data = createColumnSchema.parse(req.body);

    const column = await TaskBoardsService.createColumn(boardId, data);

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:columnCreated", { boardId, column });
    } catch {}

    res.status(201).json({ success: true, data: column });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    logger.error("Create column error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function updateColumn(req: AuthenticatedRequest, res: Response) {
  try {
    const { columnId } = req.params;
    const data = updateColumnSchema.parse(req.body);

    const column = await TaskBoardsService.updateColumn(columnId, data);

    try {
      const io = getIO();
      io.to(`board:${column.boardId}`).emit("task:columnUpdated", { column });
    } catch {}

    res.json({ success: true, data: column });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    logger.error("Update column error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function deleteColumn(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId, columnId } = req.params;

    await TaskBoardsService.deleteColumn(boardId, columnId);

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:columnDeleted", {
        boardId,
        columnId,
      });
    } catch {}

    res.json({ success: true, message: "Coluna excluída com sucesso" });
  } catch (error) {
    logger.error("Delete column error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}

export async function reorderColumns(req: AuthenticatedRequest, res: Response) {
  try {
    const { boardId } = req.params;
    const data = reorderColumnsSchema.parse(req.body);

    await TaskBoardsService.reorderColumns(data.columns);

    try {
      const io = getIO();
      io.to(`board:${boardId}`).emit("task:columnsReordered", {
        boardId,
        columns: data.columns,
      });
    } catch {}

    res.json({ success: true, message: "Colunas reordenadas com sucesso" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error.errors,
      });
    }
    logger.error("Reorder columns error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
}
