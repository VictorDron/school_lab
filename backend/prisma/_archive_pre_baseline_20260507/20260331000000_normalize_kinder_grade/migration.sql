-- Normalize 'Kinder' to 'Kindergarten' in Student table (import GRADE_MAP fix)
UPDATE "Student" SET grade = 'Kindergarten' WHERE grade = 'Kinder';
-- Also normalize in LeadChild.desiredGrade if applicable
UPDATE "LeadChild" SET "desiredGrade" = 'Kindergarten' WHERE "desiredGrade" = 'Kinder';
