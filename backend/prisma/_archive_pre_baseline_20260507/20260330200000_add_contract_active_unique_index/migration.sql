-- CreateIndex: Partial unique index to enforce at-most-one active contract per lead.
-- Contracts with status = 'CANCELLED' are excluded, allowing a lead to have
-- one cancelled contract and one new active contract simultaneously.
-- This is the database-level enforcement for BUG-01 (race condition on contract creation).
CREATE UNIQUE INDEX "Contract_leadId_active_unique"
ON "Contract" ("leadId")
WHERE "status" != 'CANCELLED';
