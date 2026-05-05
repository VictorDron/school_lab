-- CreateTable
CREATE TABLE "LeadChildTransport" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "dropoffPickupPersons" JSONB,
    "dropoffPickupOther" TEXT,
    "transportMethod" TEXT NOT NULL DEFAULT '',
    "transportMethodOther" TEXT,
    "familyVehicles" JSONB,
    "canLeaveAlone" BOOLEAN NOT NULL DEFAULT false,
    "isAthlete" BOOLEAN NOT NULL DEFAULT false,
    "athleteSchedule" JSONB,
    "schoolBusCompany" TEXT,
    "schoolBusContactName" TEXT,
    "schoolBusContactPhone" TEXT,
    "schoolBusContactEmail" TEXT,
    "hasLegalRestrictions" BOOLEAN NOT NULL DEFAULT false,
    "legalRestrictionsNotes" TEXT,
    "allowThirdPartyPickup" BOOLEAN NOT NULL DEFAULT false,
    "authorizedPersons" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadChildTransport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadChildTransport_childId_key" ON "LeadChildTransport"("childId");

-- CreateIndex
CREATE INDEX "LeadChildTransport_leadId_idx" ON "LeadChildTransport"("leadId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_primaryContactEmail_idx" ON "Lead"("primaryContactEmail");

-- CreateIndex
CREATE INDEX "LeadChild_cpf_idx" ON "LeadChild"("cpf");

-- AddForeignKey
ALTER TABLE "LeadChildTransport" ADD CONSTRAINT "LeadChildTransport_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadChildTransport" ADD CONSTRAINT "LeadChildTransport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

