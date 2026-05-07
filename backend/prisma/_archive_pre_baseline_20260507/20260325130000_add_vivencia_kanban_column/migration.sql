-- Insert Vivência column into KanbanColumn
INSERT INTO "KanbanColumn" ("id", "name", "slug", "color", "order", "isFinal", "isDefault", "createdAt", "updatedAt")
VALUES ('kc-vivencia', 'Vivência', 'VIVENCIA', '#A855F7', 7, false, false, NOW(), NOW())
ON CONFLICT ("slug") DO NOTHING;

-- Reorder existing columns to make room
UPDATE "KanbanColumn" SET "order" = 8 WHERE "slug" = 'APPROVED';
UPDATE "KanbanColumn" SET "order" = 9 WHERE "slug" = 'WAITLIST';
UPDATE "KanbanColumn" SET "order" = 10 WHERE "slug" = 'ENROLLED';
UPDATE "KanbanColumn" SET "order" = 11 WHERE "slug" = 'REJECTED';
UPDATE "KanbanColumn" SET "order" = 12 WHERE "slug" = 'LOST';

-- Move leads currently in UNDER_ANALYSIS with vivência-related gates to the new VIVENCIA column
UPDATE "Lead" SET "columnId" = 'kc-vivencia'
WHERE "columnId" = 'kc-under-analysis'
AND "admissionGateStatus" IN ('VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'EVALUATION_PENDING', 'EVALUATION_COMPLETED');
