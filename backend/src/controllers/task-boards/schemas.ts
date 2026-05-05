import { z } from "zod";

export const createBoardSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    description: z.string().optional(),
    channelId: z.string().optional(),
    visibility: z
      .enum(["PUBLIC", "PRIVATE", "CHANNEL"])
      .default("PUBLIC"),
  })
  .superRefine((data, ctx) => {
    if (data.visibility === "CHANNEL" && !data.channelId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selecione um canal para criar um quadro vinculado",
        path: ["channelId"],
      });
    }
  });

export const updateBoardSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").optional(),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "CHANNEL"]).optional(),
});

export const addMemberSchema = z.object({
  userId: z.string(),
});

export const createColumnSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().optional().default("#6B7280"),
});

export const updateColumnSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  limit: z.number().nullable().optional(),
});

export const reorderColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    }),
  ),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
});

export const updateLabelSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
});
