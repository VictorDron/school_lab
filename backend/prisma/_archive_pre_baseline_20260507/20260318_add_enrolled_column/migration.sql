-- Add ENROLLED kanban column if it doesn't exist
INSERT INTO "KanbanColumn" ("id", "name", "slug", "color", "order", "isFinal", "isDefault", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Matriculado', 'ENROLLED', '#10B981',
  (SELECT COALESCE(MAX("order"), 0) + 1 FROM "KanbanColumn"),
  true, false, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "KanbanColumn" WHERE "slug" = 'ENROLLED');
