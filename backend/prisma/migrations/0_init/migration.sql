-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('NONE', 'VIEW', 'EDIT', 'ADMIN');

-- CreateEnum
CREATE TYPE "AddendumStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'SIGNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AddendumType" AS ENUM ('DISCOUNT', 'SPECIAL_CONDITION', 'GRADE_CHANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "AdmissionDepartment" AS ENUM ('ADMISSIONS', 'PSYCHOLOGY', 'HEALTH', 'SECRETARIAT', 'COORDINATION', 'FINANCE', 'LEGAL', 'DIRECTOR');

-- CreateEnum
CREATE TYPE "AdmissionGateStatus" AS ENUM ('NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED', 'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED', 'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'EVALUATION_PENDING', 'EVALUATION_COMPLETED', 'APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED', 'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AppModule" AS ENUM ('COMMUNICATION', 'PROCUREMENT', 'ASSETS', 'CRM', 'GED', 'ADMIN', 'STUDENT_MANAGEMENT', 'PEDAGOGICAL', 'TEAM_MANAGEMENT', 'FINANCIAL');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'LINK_SENT', 'FORM_RECEIVED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DECOMMISSIONED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'PASSWORD_RESET', 'PASSWORD_CHANGED', 'PASSWORD_CHANGE_FAILURE', 'PROFILE_UPDATED', 'USER_CREATED', 'USER_UPDATED', 'USER_ARCHIVED', 'USER_ACTIVATED', 'USER_DELETED', 'INVITE_SENT', 'INVITE_ACCEPTED', 'CHANNEL_CREATED', 'CHANNEL_UPDATED', 'CHANNEL_DELETED', 'DM_CREATED', 'MESSAGE_SENT', 'MESSAGE_EDITED', 'MESSAGE_DELETED', 'MESSAGE_PINNED', 'REACTION_ADDED', 'TICKET_CREATED', 'TICKET_UPDATED', 'TICKET_ASSIGNED', 'TICKET_COMMENTED', 'TICKET_CLOSED', 'LEAD_CREATED', 'LEAD_UPDATED', 'LEAD_STATUS_CHANGED', 'LEAD_DELETED', 'APPLICATION_STATUS_CHANGED', 'APPLICATION_LINK_GENERATED', 'APPLICATION_LINK_EMAILED', 'APPLICATION_LINK_REVOKED', 'ENROLLMENT_LINK_GENERATED', 'ENROLLMENT_LINK_EMAILED', 'ENROLLMENT_LINK_REVOKED', 'ENROLLMENT_TOKEN_REVOKED', 'ENROLLMENT_ACCESSED', 'ENROLLMENT_EXPIRED', 'ENROLLMENT_FORM_SUBMITTED', 'ENROLLMENT_SUBMITTED', 'ENROLLMENT_GENERATED', 'ENROLLMENT_REVOKED', 'ENROLLMENT_DOCUMENTS_UPLOADED', 'DOCUMENTS_UPLOADED_VIA_PUBLIC_FORM', 'DOCUMENT_DELETED_VIA_PUBLIC_FORM', 'ADMISSION_GATE_CHANGED', 'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'VISIT_CANCELLED', 'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED', 'VIVENCIA_CANCELLED', 'EVALUATION_CREATED', 'EVALUATION_UPDATED', 'CONTRACT_CREATED', 'CONTRACT_SENT_FOR_SIGNATURE', 'CONTRACT_LEGAL_APPROVAL', 'CONTRACT_FINANCIAL_APPROVAL', 'CONTRACT_DOCUMENT_GENERATED', 'CONTRACT_CANCELLED', 'ESCALATION_CREATED', 'ESCALATION_RESOLVED', 'FINANCIAL_ANALYSIS_CREATED', 'FINANCIAL_ANALYSIS_UPDATED', 'FINANCIAL_ANALYSIS_APPROVED', 'PAYMENT_RECORDED', 'KANBAN_COLUMN_CREATED', 'KANBAN_COLUMN_UPDATED', 'KANBAN_COLUMN_DELETED', 'KANBAN_COLUMN_REORDERED', 'DOCUMENT_UPLOADED', 'DOCUMENT_UPDATED', 'DOCUMENT_VIEWED', 'DOCUMENT_DELETED', 'PURCHASE_CREATED', 'PURCHASE_UPDATED', 'PURCHASE_SUBMITTED', 'PURCHASE_APPROVED', 'PURCHASE_REJECTED', 'PURCHASE_EXECUTED', 'PURCHASE_ORDER_CREATED', 'PURCHASE_CANCELLED', 'SUPPLIER_CREATED', 'SUPPLIER_UPDATED', 'SUPPLIER_ARCHIVED', 'ASSET_CREATED', 'ASSET_UPDATED', 'ASSET_MOVED', 'ASSET_ASSIGNED', 'ASSET_UNASSIGNED', 'ASSET_DECOMMISSIONED', 'ASSET_RESPONSIBLE_REVOKED', 'INVENTORY_STARTED', 'INVENTORY_COMPLETED', 'INVENTORY_ITEM_CHECKED', 'MAINTENANCE_CREATED', 'MAINTENANCE_UPDATED', 'MAINTENANCE_COMPLETED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'LOCATION_CREATED', 'LOCATION_UPDATED', 'LOCATION_DELETED', 'TASK_BOARD_CREATED', 'TASK_BOARD_UPDATED', 'TASK_CARD_CREATED', 'TASK_CARD_UPDATED', 'TASK_CARD_MOVED', 'TASK_CARD_COMPLETED', 'CALENDAR_EVENT_CREATED', 'CALENDAR_EVENT_UPDATED', 'CALENDAR_EVENT_DELETED', 'SETTINGS_UPDATED', 'PARENTAL_CONSENT_RECORDED', 'STUDENT_CREATED', 'STUDENT_STATUS_CHANGED', 'STUDENT_UPDATED', 'BULK_IMPORT', 'RE_ENROLLMENT_INVITE_SENT', 'RE_ENROLLMENT_FORM_SUBMITTED', 'RE_ENROLLMENT_DATA_UPDATED', 'RE_ENROLLMENT_PERIOD_DELETED', 'DEPARTMENT_CREATED', 'DEPARTMENT_UPDATED', 'DEPARTMENT_DELETED', 'POSITION_CREATED', 'POSITION_UPDATED', 'POSITION_DELETED', 'EMPLOYEE_HR_UPDATED', 'TUITION_CREATED', 'TUITION_UPDATED', 'TUITION_DELETED', 'INVOICE_CREATED', 'INVOICE_UPDATED', 'INVOICE_PAID', 'INVOICE_DELETED', 'PAYABLE_CREATED', 'PAYABLE_UPDATED', 'PAYABLE_PAID', 'PAYABLE_DELETED', 'SCHOOL_SUBJECT_CREATED', 'SCHOOL_SUBJECT_UPDATED', 'SCHOOL_SUBJECT_DELETED', 'SCHOOL_CLASS_CREATED', 'SCHOOL_CLASS_UPDATED', 'SCHOOL_CLASS_DELETED', 'CLASS_SUBJECT_ADDED', 'CLASS_SUBJECT_REMOVED', 'STUDENT_ENROLLED_CLASS', 'STUDENT_UNENROLLED_CLASS', 'LESSON_PLAN_CREATED', 'LESSON_PLAN_UPDATED', 'LESSON_PLAN_DELETED', 'STUDENT_GRADE_RECORDED', 'STUDENT_GRADE_UPDATED', 'STUDENT_GRADE_DELETED', 'ATTENDANCE_RECORDED');

-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('MEETING', 'DEADLINE', 'REMINDER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('PUBLIC', 'PRIVATE', 'DIRECT');

-- CreateEnum
CREATE TYPE "ClickSignEnvelopeStatus" AS ENUM ('CREATED', 'RUNNING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('GENERAL', 'POSITIVE', 'CONCERN', 'INTERNAL');

-- CreateEnum
CREATE TYPE "ContractSignerRole" AS ENUM ('PARENT', 'GUARDIAN', 'SCHOOL_REPRESENTATIVE', 'WITNESS');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'PENDING_LEGAL', 'PENDING_FINANCIAL', 'SENT', 'SIGNED', 'ACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CrmEventType" AS ENUM ('VISIT', 'VIVENCIA');

-- CreateEnum
CREATE TYPE "DocumentRequestStatus" AS ENUM ('PENDING', 'RECEIVED', 'REJECTED', 'WAIVED');

-- CreateEnum
CREATE TYPE "DocumentSecurityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'SENSITIVE', 'RESTRICTED', 'CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('CLT', 'PJ', 'ESTAGIO', 'TERCEIRIZADO', 'AUTONOMO', 'TEMPORARIO');

-- CreateEnum
CREATE TYPE "EnrollmentFormStatus" AS ENUM ('NOT_STARTED', 'LINK_SENT', 'FORM_RECEIVED');

-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('FIRST', 'RENEWAL');

-- CreateEnum
CREATE TYPE "EscalationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EvaluationDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FinancialAnalysisStatus" AS ENUM ('PENDING', 'IN_ANALYSIS', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FormDraftType" AS ENUM ('ADMISSION', 'ENROLLMENT');

-- CreateEnum
CREATE TYPE "GateApprovalDecision" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL', 'ESCALATED');

-- CreateEnum
CREATE TYPE "InventoryItemStatus" AS ENUM ('PENDING', 'FOUND', 'NOT_FOUND', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "InventorySessionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadOriginType" AS ENUM ('ADMIN_CREATED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'EVENT', 'ADVERTISEMENT', 'WALK_IN', 'PHONE', 'EMAIL', 'OTHER', 'IMPORT');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "MaintenanceType" AS ENUM ('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CALIBRATION', 'CLEANING');

-- CreateEnum
CREATE TYPE "MarketingLeadIntent" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE', 'SOBMEDIDA', 'DEMO');

-- CreateEnum
CREATE TYPE "MarketingLeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM', 'TASK_REF');

-- CreateEnum
CREATE TYPE "NotificationPreference" AS ENUM ('PRIMARY', 'MOTHER', 'FATHER', 'BOTH');

-- CreateEnum
CREATE TYPE "PayableCategory" AS ENUM ('RENT', 'UTILITIES', 'PAYROLL', 'SUPPLIES', 'SERVICES', 'TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "PayableStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PreReEnrollmentResponseStatus" AS ENUM ('PENDING', 'AGREED', 'DISAGREED', 'NEGOTIATING', 'NEGOTIATED');

-- CreateEnum
CREATE TYPE "PurchasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('DRAFT', 'PENDING_MANAGER', 'PENDING_FINANCE', 'APPROVED', 'REJECTED', 'PURCHASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "ReEnrollmentGateStatus" AS ENUM ('CONVITE_ENVIADO', 'FORMULARIO_CONFIRMADO', 'DOCS_APROVADOS', 'CONTRATO_PENDENTE', 'CONTRATO_ASSINADO', 'TAXA_PAGA', 'REMATRICULADO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "ReEnrollmentInviteStatus" AS ENUM ('PENDING', 'SENT', 'OPENED', 'CONFIRMED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ReEnrollmentPeriodStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "RecurrenceFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SchoolInvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SchoolInvoiceType" AS ENUM ('TUITION', 'MATERIAL', 'ENROLLMENT_FEE', 'ACTIVITY', 'OTHER');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskBoardVisibility" AS ENUM ('CHANNEL', 'PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TaskCardStatus" AS ENUM ('OPEN', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TicketDepartment" AS ENUM ('IT', 'MAINTENANCE', 'CLEANING', 'SECRETARIAT', 'GENERAL');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'COORDINATOR', 'TEACHER', 'SECRETARY', 'IT', 'MAINTENANCE', 'CLEANING', 'PURCHASING', 'FINANCE', 'ADMISSIONS', 'PSYCHOLOGY', 'HEALTH', 'LEGAL', 'DIRECTOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "VivenciaStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "AccountsPayable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "PayableCategory" NOT NULL DEFAULT 'OTHER',
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PayableStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "attachmentUrl" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountsPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddendumSigner" (
    "id" TEXT NOT NULL,
    "addendumId" TEXT NOT NULL,
    "role" "ContractSignerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "clicksignSignerId" TEXT,
    "clicksignAuthMethod" TEXT,
    "hasSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddendumSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionGateApproval" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "gateStep" "AdmissionGateStatus" NOT NULL,
    "department" "AdmissionDepartment" NOT NULL,
    "decision" "GateApprovalDecision" NOT NULL DEFAULT 'PENDING',
    "decidedById" TEXT,
    "notes" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskCardId" TEXT,

    CONSTRAINT "AdmissionGateApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationTokenLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationTokenLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalAction" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comments" TEXT,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "acquisitionDate" TIMESTAMP(3),
    "acquisitionValue" DECIMAL(12,2),
    "currentValue" DECIMAL(12,2),
    "warranty" TIMESTAMP(3),
    "photoUrl" TEXT,
    "qrCodeUrl" TEXT,
    "responsibleId" TEXT,
    "createdById" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "depreciationRate" DOUBLE PRECISION,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLocation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMaintenance" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "MaintenanceType" NOT NULL DEFAULT 'CORRECTIVE',
    "description" TEXT NOT NULL,
    "cost" DECIMAL(12,2),
    "scheduledDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'SCHEDULED',
    "priority" "PurchasePriority" NOT NULL DEFAULT 'NORMAL',
    "vendor" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "completedById" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetMovement" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "fromLocationId" TEXT NOT NULL,
    "toLocationId" TEXT NOT NULL,
    "reason" TEXT,
    "movedById" TEXT NOT NULL,
    "movedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "CalendarEventType" NOT NULL DEFAULT 'CUSTOM',
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "color" TEXT,
    "channelId" TEXT,
    "taskCardId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceFrequency" "RecurrenceFrequency",
    "recurrenceInterval" INTEGER DEFAULT 1,
    "recurrenceEndDate" TIMESTAMP(3),
    "recurrenceParentId" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CalendarEventParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventReminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "minutesBefore" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "isSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CalendarEventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ChannelType" NOT NULL DEFAULT 'PUBLIC',
    "createdBy" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelMember" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassEnrollment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),

    CONSTRAINT "ClassEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,
    "weeklyHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClickSignWebhookLog" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClickSignWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "templateVersion" TEXT,
    "totalAnnualValue" DECIMAL(12,2),
    "installments" INTEGER,
    "discountPercent" DECIMAL(5,2),
    "enrollmentFee" DECIMAL(12,2),
    "documentUrl" TEXT,
    "signedDocumentUrl" TEXT,
    "clicksignEnvelopeId" TEXT,
    "clicksignStatus" "ClickSignEnvelopeStatus",
    "clicksignEnvelopeUrl" TEXT,
    "legalApprovalStatus" "GateApprovalDecision",
    "legalApprovedById" TEXT,
    "legalApprovedAt" TIMESTAMP(3),
    "legalNotes" TEXT,
    "financialApprovalStatus" "GateApprovalDecision",
    "financialApprovedById" TEXT,
    "financialApprovedAt" TIMESTAMP(3),
    "financialNotes" TEXT,
    "enrollmentType" "EnrollmentType" NOT NULL DEFAULT 'FIRST',
    "studentId" TEXT,
    "studentGrade" TEXT,
    "negotiatedDiscountPercent" DECIMAL(5,2),
    "negotiatedFinalValue" DECIMAL(12,2),
    "negotiationJustification" TEXT,
    "negotiationApprovedById" TEXT,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractAddendum" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "AddendumType" NOT NULL,
    "status" "AddendumStatus" NOT NULL DEFAULT 'DRAFT',
    "description" TEXT NOT NULL,
    "changedValues" JSONB,
    "documentUrl" TEXT,
    "signedDocumentUrl" TEXT,
    "clicksignEnvelopeId" TEXT,
    "clicksignStatus" "ClickSignEnvelopeStatus",
    "clicksignEnvelopeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "signedAt" TIMESTAMP(3),

    CONSTRAINT "ContractAddendum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractDefaultSigner" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "role" "ContractSignerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractDefaultSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractPayment" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "boletoUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSigner" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "role" "ContractSignerRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "clicksignSignerId" TEXT,
    "clicksignAuthMethod" TEXT,
    "hasSigned" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "refusedAt" TIMESTAMP(3),
    "refusalReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CriticalIssueEscalation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT,
    "raisedById" TEXT NOT NULL,
    "department" "AdmissionDepartment" NOT NULL,
    "gateStep" "AdmissionGateStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "EscalationSeverity" NOT NULL DEFAULT 'MEDIUM',
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CriticalIssueEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "eventType" "CrmEventType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "color" TEXT,
    "visitStatus" "VisitStatus",
    "visitNotes" TEXT,
    "visitCompletedAt" TIMESTAMP(3),
    "vivenciaStatus" "VivenciaStatus",
    "vivenciaNotes" TEXT,
    "vivenciaCompletedAt" TIMESTAMP(3),
    "assignedTeacherId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headUserId" TEXT,
    "parentDepartmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "module" "AppModule",
    "securityLevel" "DocumentSecurityLevel" NOT NULL DEFAULT 'INTERNAL',
    "tags" TEXT[],
    "allowedRoles" "UserRole"[],
    "aiAnalysis" JSONB,
    "uploadedById" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentFeePayment" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptUrl" TEXT,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentFeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceEvaluation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "evaluatedById" TEXT NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL,
    "behavior" TEXT,
    "english" TEXT,
    "interactionWithKids" TEXT,
    "mathPlacement" TEXT,
    "englishPlacement" TEXT,
    "additionalNotes" TEXT,
    "decision" "EvaluationDecision" NOT NULL DEFAULT 'PENDING',
    "decisionById" TEXT,
    "decisionAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "lastEditedById" TEXT,
    "lastEditedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyPriceException" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "overrideAnnualValue" DECIMAL(12,2),
    "overrideDiscountPercent" DECIMAL(5,2),
    "previousDiscountPercent" DECIMAL(5,2),
    "justification" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "approvedById" TEXT,
    "approvalNotes" TEXT,
    "approvalDecidedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyPriceException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAnalysis" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "cpfAnalyzed" TEXT,
    "cpfStatus" TEXT,
    "analysisNotes" TEXT,
    "negotiationNotes" TEXT,
    "status" "FinancialAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormDraft" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "formType" "FormDraftType" NOT NULL,
    "data" JSONB NOT NULL,
    "step" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateStepConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gateStep" "AdmissionGateStatus" NOT NULL,
    "department" "AdmissionDepartment" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "approvalOrder" INTEGER NOT NULL DEFAULT 0,
    "allowedRoles" "UserRole"[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GateStepConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "totalRows" INTEGER NOT NULL,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "createdStudentIds" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "status" "InventoryItemStatus" NOT NULL DEFAULT 'PENDING',
    "checkedById" TEXT,
    "checkedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventorySession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "InventorySessionStatus" NOT NULL DEFAULT 'DRAFT',
    "startedById" TEXT NOT NULL,
    "locationId" TEXT,
    "categoryId" TEXT,
    "completedById" TEXT,
    "totalAssets" INTEGER NOT NULL DEFAULT 0,
    "foundCount" INTEGER NOT NULL DEFAULT 0,
    "missingCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventorySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "token" TEXT NOT NULL,
    "invitedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanbanColumn" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "order" INTEGER NOT NULL,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KanbanColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "primaryContactName" TEXT NOT NULL,
    "primaryContactEmail" TEXT NOT NULL,
    "primaryContactPhone" TEXT,
    "secondaryContactName" TEXT,
    "secondaryContactEmail" TEXT,
    "secondaryContactPhone" TEXT,
    "columnId" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "numberOfChildren" INTEGER NOT NULL DEFAULT 1,
    "desiredGrades" TEXT[],
    "hasSiblingsAtSchool" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "applicationToken" TEXT,
    "applicationTokenExpires" TIMESTAMP(3),
    "applicationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "originType" "LeadOriginType" NOT NULL DEFAULT 'ADMIN_CREATED',
    "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "applicationSentAt" TIMESTAMP(3),
    "lastFormSubmittedAt" TIMESTAMP(3),
    "formSubmissionCount" INTEGER NOT NULL DEFAULT 0,
    "admissionGateStatus" "AdmissionGateStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "livesWith" TEXT,
    "guardianInfo" TEXT,
    "notificationPreference" "NotificationPreference" NOT NULL DEFAULT 'PRIMARY',
    "enrollmentToken" TEXT,
    "enrollmentTokenExpires" TIMESTAMP(3),
    "enrollmentStatus" "EnrollmentFormStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "enrollmentSentAt" TIMESTAMP(3),
    "enrollmentSubmittedAt" TIMESTAMP(3),
    "enrollmentSubmissionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAdditionalInfo" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT,
    "hasPsychoEvaluation" BOOLEAN NOT NULL DEFAULT false,
    "psychoEvaluationDetails" TEXT,
    "hasAcademicSupport" BOOLEAN NOT NULL DEFAULT false,
    "academicSupportDetails" TEXT,
    "hasHealthIssues" BOOLEAN NOT NULL DEFAULT false,
    "healthIssuesDetails" TEXT,
    "hasAdaptationDifficulty" BOOLEAN NOT NULL DEFAULT false,
    "adaptationDifficultyDetails" TEXT,
    "otherRelevantInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadAdditionalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAddress" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadChild" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT,
    "desiredGrade" TEXT,
    "currentGrade" TEXT,
    "currentSchool" TEXT,
    "specialNeeds" TEXT,
    "primaryLanguage" TEXT,
    "otherLanguages" TEXT[],
    "relationship" TEXT NOT NULL DEFAULT 'STUDENT',
    "isApplicant" BOOLEAN NOT NULL DEFAULT true,
    "studentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadChildHealth" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "weight" TEXT,
    "height" TEXT,
    "bloodType" TEXT,
    "medicalConditions" TEXT[],
    "medicalConditionsNotes" TEXT,
    "hasHospitalizations" BOOLEAN NOT NULL DEFAULT false,
    "hospitalizationsNotes" TEXT,
    "hasSeizures" BOOLEAN NOT NULL DEFAULT false,
    "seizuresNotes" TEXT,
    "allergies" TEXT[],
    "allergiesNotes" TEXT,
    "feverMedications" TEXT[],
    "feverMedicationOther" TEXT,
    "painMedications" TEXT[],
    "painMedicationOther" TEXT,
    "medicationRestrictions" TEXT,
    "regularMedications" TEXT,
    "hasEatingDisorder" BOOLEAN NOT NULL DEFAULT false,
    "eatingDisorderNotes" TEXT,
    "additionalHealthInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadChildHealth_pkey" PRIMARY KEY ("id")
);

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
    "athleteNotes" TEXT,
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

-- CreateTable
CREATE TABLE "LeadComment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "CommentType" NOT NULL DEFAULT 'GENERAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDocument" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,
    "uploadedVia" TEXT,
    "childId" TEXT,
    "childIndex" INTEGER,

    CONSTRAINT "LeadDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDocumentRequest" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "childId" TEXT,
    "status" "DocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "LeadDocumentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEducationHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT,
    "schoolName" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "gradesAttended" TEXT,
    "yearStart" INTEGER,
    "yearEnd" INTEGER,
    "notes" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEducationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEmergencyContact" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "relationship" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEnrollmentDocument" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT,
    "documentType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "includesOtherDocs" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "expiryDate" TIMESTAMP(3),

    CONSTRAINT "LeadEnrollmentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEnrollmentInfo" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "childId" TEXT,
    "academicCalendar" TEXT,
    "campus" TEXT,
    "course" TEXT,
    "module" TEXT,
    "classGroup" TEXT,
    "personType" TEXT,
    "studentCpf" TEXT,
    "studentIdNumber" TEXT,
    "studentIdIssueDate" TEXT,
    "studentIdIssuer" TEXT,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "termsAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadEnrollmentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFinancialResponsible" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "responsibleType" TEXT NOT NULL,
    "relationship" TEXT,
    "personType" TEXT DEFAULT 'INDIVIDUAL',
    "fullName" TEXT,
    "cpf" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "cnpj" TEXT,
    "tradeName" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "neighborhood" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "zipCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadFinancialResponsible_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadHealthPlan" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "beneficiaryCode" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "preferredHospital" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadHealthPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadHistory" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadParent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "parentType" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cpf" TEXT,
    "occupation" TEXT,
    "nativeLanguage" TEXT,
    "idNumber" TEXT,
    "idIssueDate" TEXT,
    "idIssuer" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "maritalStatus" TEXT,
    "education" TEXT,
    "religion" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "neighborhood" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "sameAddressAsOtherParent" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadParent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTransport" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "dropoffPickupPersons" JSONB,
    "dropoffPickupOther" TEXT,
    "transportMethod" TEXT NOT NULL,
    "transportMethodOther" TEXT,
    "familyVehicles" JSONB,
    "canLeaveAlone" BOOLEAN NOT NULL DEFAULT false,
    "isAthlete" BOOLEAN NOT NULL DEFAULT false,
    "athleteSchedule" JSONB,
    "athleteNotes" TEXT,
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

    CONSTRAINT "LeadTransport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadView" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "content" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "studentCount" TEXT NOT NULL,
    "notes" TEXT,
    "intent" "MarketingLeadIntent" NOT NULL,
    "status" "MarketingLeadStatus" NOT NULL DEFAULT 'NEW',
    "source" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedById" TEXT,
    "pinnedAt" TIMESTAMP(3),
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageMention" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" "AppModule" NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'VIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleChannel" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "module" "AppModule" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentalConsent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "consentTextVersion" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParentalConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodPriceTable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "baseAnnualValue" DECIMAL(12,2) NOT NULL,
    "enrollmentFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountPercent" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodPriceTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreReEnrollmentResponse" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "PreReEnrollmentResponseStatus" NOT NULL DEFAULT 'PENDING',
    "emailSentAt" TIMESTAMP(3),
    "emailTo" TEXT,
    "respondedAt" TIMESTAMP(3),
    "disagreementReason" TEXT,
    "negotiatedDiscountPercent" DECIMAL(5,2),
    "negotiatedFinalValue" DECIMAL(12,2),
    "negotiationJustification" TEXT,
    "negotiationApprovedById" TEXT,
    "negotiationCompletedAt" TIMESTAMP(3),
    "communicatedAnnualValue" DECIMAL(12,2),
    "communicatedAdjustmentPercent" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreReEnrollmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "estimatedUnitPrice" DECIMAL(12,2) NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "purchaseRequestId" TEXT NOT NULL,
    "supplierId" TEXT,
    "executedById" TEXT,
    "invoiceNumber" TEXT,
    "invoiceUrl" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "autoCreateAssets" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "priority" "PurchasePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'DRAFT',
    "justification" TEXT NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "attachments" JSONB,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReEnrollmentInvite" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "ReEnrollmentInviteStatus" NOT NULL DEFAULT 'PENDING',
    "gateStatus" "ReEnrollmentGateStatus" NOT NULL DEFAULT 'CONVITE_ENVIADO',
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "notes" TEXT,
    "emailStatus" TEXT,
    "emailError" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "optOutReminders" BOOLEAN NOT NULL DEFAULT false,
    "extendedDeadline" TIMESTAMP(3),
    "rematriculadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReEnrollmentInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReEnrollmentPeriod" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetYear" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "eligibleGrades" TEXT[],
    "status" "ReEnrollmentPeriodStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adjustmentPercent" DECIMAL(5,2),
    "requiresFeePayment" BOOLEAN NOT NULL DEFAULT true,
    "preReEnrollmentEmailTemplate" TEXT,
    "preReEnrollmentDeadline" TIMESTAMP(3),
    "earlyBirdDeadline" TIMESTAMP(3),
    "earlyBirdDiscountPercent" DECIMAL(5,2),
    "discountOptions" JSONB DEFAULT '[]',

    CONSTRAINT "ReEnrollmentPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "shift" TEXT,
    "capacity" INTEGER,
    "homeroomTeacherId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT,
    "type" "SchoolInvoiceType" NOT NULL DEFAULT 'TUITION',
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "SchoolInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(10,2),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolSubject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "leadChildId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "cpf" TEXT,
    "gender" TEXT,
    "nationality" TEXT,
    "avatarUrl" TEXT,
    "grade" TEXT,
    "academicYear" INTEGER NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previousStudentId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGrade" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "grade" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "type" TEXT,
    "notes" TEXT,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "cnpj" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL DEFAULT 'School Lab',
    "legalName" TEXT,
    "cnpj" TEXT,
    "legalAddress" TEXT,
    "legalCity" TEXT,
    "legalRepresentative" TEXT,
    "jurisdiction" TEXT,
    "lgpdContactEmail" TEXT,
    "internationalMaterialFee" DECIMAL(12,2),
    "gradeProgression" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "logoUrl" TEXT,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'pt',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "feeTable" JSONB,
    "foodTable" JSONB,
    "discountOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskBoard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channelId" TEXT,
    "visibility" "TaskBoardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "createdById" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskBoardMember" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskBoardMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCard" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NONE',
    "status" "TaskCardStatus" NOT NULL DEFAULT 'OPEN',
    "order" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attachments" JSONB,
    "coverImage" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceModule" TEXT,
    "sourceLeadId" TEXT,
    "sourceType" TEXT,

    CONSTRAINT "TaskCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCardLabel" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "TaskCardLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklist" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "TaskChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskColumn" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "order" INTEGER NOT NULL,
    "limit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskLabel" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "TaskLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department" "TicketDepartment" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdById" TEXT NOT NULL,
    "assigneeId" TEXT,
    "channelId" TEXT,
    "sourceMessageId" TEXT,
    "attachments" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketActivity" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tuition" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "monthlyAmount" DECIMAL(10,2) NOT NULL,
    "materialAmount" DECIMAL(10,2),
    "enrollmentFee" DECIMAL(10,2),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tuition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "displayName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "area" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "lastLoginAt" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "requirePasswordChange" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departmentId" TEXT,
    "employmentType" "EmploymentType",
    "hireDate" TIMESTAMP(3),
    "managerId" TEXT,
    "positionId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountsPayable_category_idx" ON "AccountsPayable"("category" ASC);

-- CreateIndex
CREATE INDEX "AccountsPayable_dueDate_idx" ON "AccountsPayable"("dueDate" ASC);

-- CreateIndex
CREATE INDEX "AccountsPayable_status_idx" ON "AccountsPayable"("status" ASC);

-- CreateIndex
CREATE INDEX "AccountsPayable_tenantId_idx" ON "AccountsPayable"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "AddendumSigner_addendumId_idx" ON "AddendumSigner"("addendumId" ASC);

-- CreateIndex
CREATE INDEX "AdmissionGateApproval_decision_idx" ON "AdmissionGateApproval"("decision" ASC);

-- CreateIndex
CREATE INDEX "AdmissionGateApproval_department_idx" ON "AdmissionGateApproval"("department" ASC);

-- CreateIndex
CREATE INDEX "AdmissionGateApproval_gateStep_idx" ON "AdmissionGateApproval"("gateStep" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionGateApproval_leadId_gateStep_department_key" ON "AdmissionGateApproval"("leadId" ASC, "gateStep" ASC, "department" ASC);

-- CreateIndex
CREATE INDEX "AdmissionGateApproval_leadId_idx" ON "AdmissionGateApproval"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionGateApproval_taskCardId_key" ON "AdmissionGateApproval"("taskCardId" ASC);

-- CreateIndex
CREATE INDEX "ApplicationTokenLog_createdAt_idx" ON "ApplicationTokenLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ApplicationTokenLog_leadId_idx" ON "ApplicationTokenLog"("leadId" ASC);

-- CreateIndex
CREATE INDEX "ApplicationTokenLog_token_idx" ON "ApplicationTokenLog"("token" ASC);

-- CreateIndex
CREATE INDEX "ApprovalAction_purchaseRequestId_idx" ON "ApprovalAction"("purchaseRequestId" ASC);

-- CreateIndex
CREATE INDEX "ApprovalAction_userId_idx" ON "ApprovalAction"("userId" ASC);

-- CreateIndex
CREATE INDEX "Asset_categoryId_idx" ON "Asset"("categoryId" ASC);

-- CreateIndex
CREATE INDEX "Asset_code_idx" ON "Asset"("code" ASC);

-- CreateIndex
CREATE INDEX "Asset_locationId_idx" ON "Asset"("locationId" ASC);

-- CreateIndex
CREATE INDEX "Asset_purchaseOrderId_idx" ON "Asset"("purchaseOrderId" ASC);

-- CreateIndex
CREATE INDEX "Asset_responsibleId_idx" ON "Asset"("responsibleId" ASC);

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_tenantId_code_key" ON "Asset"("tenantId" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "Asset_tenantId_idx" ON "Asset"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "AssetCategory_tenantId_idx" ON "AssetCategory"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_tenantId_name_key" ON "AssetCategory"("tenantId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "AssetLocation_parentId_idx" ON "AssetLocation"("parentId" ASC);

-- CreateIndex
CREATE INDEX "AssetLocation_tenantId_idx" ON "AssetLocation"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AssetLocation_tenantId_name_key" ON "AssetLocation"("tenantId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "AssetMaintenance_assetId_idx" ON "AssetMaintenance"("assetId" ASC);

-- CreateIndex
CREATE INDEX "AssetMaintenance_scheduledDate_idx" ON "AssetMaintenance"("scheduledDate" ASC);

-- CreateIndex
CREATE INDEX "AssetMaintenance_status_idx" ON "AssetMaintenance"("status" ASC);

-- CreateIndex
CREATE INDEX "AssetMovement_assetId_idx" ON "AssetMovement"("assetId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_classId_studentId_date_key" ON "Attendance"("classId" ASC, "studentId" ASC, "date" ASC);

-- CreateIndex
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date" ASC);

-- CreateIndex
CREATE INDEX "Attendance_studentId_idx" ON "Attendance"("studentId" ASC);

-- CreateIndex
CREATE INDEX "Attendance_tenantId_idx" ON "Attendance"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEvent_channelId_idx" ON "CalendarEvent"("channelId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEvent_createdById_idx" ON "CalendarEvent"("createdById" ASC);

-- CreateIndex
CREATE INDEX "CalendarEvent_endTime_idx" ON "CalendarEvent"("endTime" ASC);

-- CreateIndex
CREATE INDEX "CalendarEvent_recurrenceParentId_idx" ON "CalendarEvent"("recurrenceParentId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime" ASC);

-- CreateIndex
CREATE INDEX "CalendarEvent_taskCardId_idx" ON "CalendarEvent"("taskCardId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEvent_tenantId_idx" ON "CalendarEvent"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEventParticipant_eventId_idx" ON "CalendarEventParticipant"("eventId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventParticipant_eventId_userId_key" ON "CalendarEventParticipant"("eventId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEventParticipant_userId_idx" ON "CalendarEventParticipant"("userId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEventReminder_eventId_idx" ON "CalendarEventReminder"("eventId" ASC);

-- CreateIndex
CREATE INDEX "CalendarEventReminder_isSent_idx" ON "CalendarEventReminder"("isSent" ASC);

-- CreateIndex
CREATE INDEX "Channel_createdBy_idx" ON "Channel"("createdBy" ASC);

-- CreateIndex
CREATE INDEX "Channel_tenantId_idx" ON "Channel"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Channel_type_idx" ON "Channel"("type" ASC);

-- CreateIndex
CREATE INDEX "ChannelMember_channelId_idx" ON "ChannelMember"("channelId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelMember_channelId_userId_key" ON "ChannelMember"("channelId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "ChannelMember_userId_idx" ON "ChannelMember"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ClassEnrollment_classId_studentId_key" ON "ClassEnrollment"("classId" ASC, "studentId" ASC);

-- CreateIndex
CREATE INDEX "ClassEnrollment_studentId_idx" ON "ClassEnrollment"("studentId" ASC);

-- CreateIndex
CREATE INDEX "ClassEnrollment_tenantId_idx" ON "ClassEnrollment"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId" ASC, "subjectId" ASC);

-- CreateIndex
CREATE INDEX "ClassSubject_teacherId_idx" ON "ClassSubject"("teacherId" ASC);

-- CreateIndex
CREATE INDEX "ClassSubject_tenantId_idx" ON "ClassSubject"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ClickSignWebhookLog_envelopeId_idx" ON "ClickSignWebhookLog"("envelopeId" ASC);

-- CreateIndex
CREATE INDEX "ClickSignWebhookLog_processed_idx" ON "ClickSignWebhookLog"("processed" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_clicksignEnvelopeId_key" ON "Contract"("clicksignEnvelopeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Contract_code_key" ON "Contract"("code" ASC);

-- CreateIndex
CREATE INDEX "Contract_leadId_idx" ON "Contract"("leadId" ASC);

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status" ASC);

-- CreateIndex
CREATE INDEX "Contract_studentId_idx" ON "Contract"("studentId" ASC);

-- CreateIndex
CREATE INDEX "Contract_tenantId_idx" ON "Contract"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContractAddendum_clicksignEnvelopeId_key" ON "ContractAddendum"("clicksignEnvelopeId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ContractAddendum_code_key" ON "ContractAddendum"("code" ASC);

-- CreateIndex
CREATE INDEX "ContractAddendum_contractId_idx" ON "ContractAddendum"("contractId" ASC);

-- CreateIndex
CREATE INDEX "ContractAddendum_status_idx" ON "ContractAddendum"("status" ASC);

-- CreateIndex
CREATE INDEX "ContractAddendum_tenantId_idx" ON "ContractAddendum"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ContractDefaultSigner_tenantId_idx" ON "ContractDefaultSigner"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ContractPayment_contractId_idx" ON "ContractPayment"("contractId" ASC);

-- CreateIndex
CREATE INDEX "ContractPayment_status_idx" ON "ContractPayment"("status" ASC);

-- CreateIndex
CREATE INDEX "ContractSigner_contractId_idx" ON "ContractSigner"("contractId" ASC);

-- CreateIndex
CREATE INDEX "CriticalIssueEscalation_isResolved_idx" ON "CriticalIssueEscalation"("isResolved" ASC);

-- CreateIndex
CREATE INDEX "CriticalIssueEscalation_leadId_idx" ON "CriticalIssueEscalation"("leadId" ASC);

-- CreateIndex
CREATE INDEX "CriticalIssueEscalation_severity_idx" ON "CriticalIssueEscalation"("severity" ASC);

-- CreateIndex
CREATE INDEX "CrmEvent_assignedTeacherId_idx" ON "CrmEvent"("assignedTeacherId" ASC);

-- CreateIndex
CREATE INDEX "CrmEvent_eventType_idx" ON "CrmEvent"("eventType" ASC);

-- CreateIndex
CREATE INDEX "CrmEvent_leadId_idx" ON "CrmEvent"("leadId" ASC);

-- CreateIndex
CREATE INDEX "CrmEvent_startDate_idx" ON "CrmEvent"("startDate" ASC);

-- CreateIndex
CREATE INDEX "CrmEvent_tenantId_idx" ON "CrmEvent"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Department_tenantId_idx" ON "Department"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Department_tenantId_name_key" ON "Department"("tenantId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "Document_module_idx" ON "Document"("module" ASC);

-- CreateIndex
CREATE INDEX "Document_securityLevel_idx" ON "Document"("securityLevel" ASC);

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById" ASC);

-- CreateIndex
CREATE INDEX "EnrollmentFeePayment_inviteId_idx" ON "EnrollmentFeePayment"("inviteId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentFeePayment_inviteId_key" ON "EnrollmentFeePayment"("inviteId" ASC);

-- CreateIndex
CREATE INDEX "ExperienceEvaluation_childId_idx" ON "ExperienceEvaluation"("childId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceEvaluation_eventId_childId_key" ON "ExperienceEvaluation"("eventId" ASC, "childId" ASC);

-- CreateIndex
CREATE INDEX "ExperienceEvaluation_eventId_idx" ON "ExperienceEvaluation"("eventId" ASC);

-- CreateIndex
CREATE INDEX "ExperienceEvaluation_leadId_idx" ON "ExperienceEvaluation"("leadId" ASC);

-- CreateIndex
CREATE INDEX "ExperienceEvaluation_tenantId_idx" ON "ExperienceEvaluation"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "FamilyPriceException_approvalStatus_idx" ON "FamilyPriceException"("approvalStatus" ASC);

-- CreateIndex
CREATE INDEX "FamilyPriceException_periodId_idx" ON "FamilyPriceException"("periodId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FamilyPriceException_periodId_studentId_key" ON "FamilyPriceException"("periodId" ASC, "studentId" ASC);

-- CreateIndex
CREATE INDEX "FamilyPriceException_studentId_idx" ON "FamilyPriceException"("studentId" ASC);

-- CreateIndex
CREATE INDEX "FamilyPriceException_tenantId_idx" ON "FamilyPriceException"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAnalysis_leadId_key" ON "FinancialAnalysis"("leadId" ASC);

-- CreateIndex
CREATE INDEX "FormDraft_expiresAt_idx" ON "FormDraft"("expiresAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "FormDraft_token_formType_key" ON "FormDraft"("token" ASC, "formType" ASC);

-- CreateIndex
CREATE INDEX "FormDraft_token_idx" ON "FormDraft"("token" ASC);

-- CreateIndex
CREATE INDEX "GateStepConfig_gateStep_idx" ON "GateStepConfig"("gateStep" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GateStepConfig_tenantId_gateStep_department_key" ON "GateStepConfig"("tenantId" ASC, "gateStep" ASC, "department" ASC);

-- CreateIndex
CREATE INDEX "GateStepConfig_tenantId_idx" ON "GateStepConfig"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ImportHistory_createdAt_idx" ON "ImportHistory"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ImportHistory_tenantId_idx" ON "ImportHistory"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ImportHistory_userId_idx" ON "ImportHistory"("userId" ASC);

-- CreateIndex
CREATE INDEX "InventoryItem_assetId_idx" ON "InventoryItem"("assetId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sessionId_assetId_key" ON "InventoryItem"("sessionId" ASC, "assetId" ASC);

-- CreateIndex
CREATE INDEX "InventoryItem_sessionId_idx" ON "InventoryItem"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "InventorySession_categoryId_idx" ON "InventorySession"("categoryId" ASC);

-- CreateIndex
CREATE INDEX "InventorySession_code_idx" ON "InventorySession"("code" ASC);

-- CreateIndex
CREATE INDEX "InventorySession_locationId_idx" ON "InventorySession"("locationId" ASC);

-- CreateIndex
CREATE INDEX "InventorySession_status_idx" ON "InventorySession"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "InventorySession_tenantId_code_key" ON "InventorySession"("tenantId" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "InventorySession_tenantId_idx" ON "InventorySession"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "Invite"("email" ASC);

-- CreateIndex
CREATE INDEX "Invite_tenantId_idx" ON "Invite"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token" ASC);

-- CreateIndex
CREATE INDEX "KanbanColumn_order_idx" ON "KanbanColumn"("order" ASC);

-- CreateIndex
CREATE INDEX "KanbanColumn_tenantId_idx" ON "KanbanColumn"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "KanbanColumn_tenantId_slug_key" ON "KanbanColumn"("tenantId" ASC, "slug" ASC);

-- CreateIndex
CREATE INDEX "Lead_admissionGateStatus_idx" ON "Lead"("admissionGateStatus" ASC);

-- CreateIndex
CREATE INDEX "Lead_applicationStatus_idx" ON "Lead"("applicationStatus" ASC);

-- CreateIndex
CREATE INDEX "Lead_applicationToken_idx" ON "Lead"("applicationToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_applicationToken_key" ON "Lead"("applicationToken" ASC);

-- CreateIndex
CREATE INDEX "Lead_code_idx" ON "Lead"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_code_key" ON "Lead"("code" ASC);

-- CreateIndex
CREATE INDEX "Lead_columnId_idx" ON "Lead"("columnId" ASC);

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Lead_enrollmentStatus_idx" ON "Lead"("enrollmentStatus" ASC);

-- CreateIndex
CREATE INDEX "Lead_enrollmentToken_idx" ON "Lead"("enrollmentToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_enrollmentToken_key" ON "Lead"("enrollmentToken" ASC);

-- CreateIndex
CREATE INDEX "Lead_primaryContactEmail_idx" ON "Lead"("primaryContactEmail" ASC);

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source" ASC);

-- CreateIndex
CREATE INDEX "Lead_tenantId_idx" ON "Lead"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "LeadAdditionalInfo_childId_idx" ON "LeadAdditionalInfo"("childId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadAdditionalInfo_leadId_childId_key" ON "LeadAdditionalInfo"("leadId" ASC, "childId" ASC);

-- CreateIndex
CREATE INDEX "LeadAdditionalInfo_leadId_idx" ON "LeadAdditionalInfo"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadAddress_leadId_idx" ON "LeadAddress"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadAddress_leadId_key" ON "LeadAddress"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadChild_cpf_idx" ON "LeadChild"("cpf" ASC);

-- CreateIndex
CREATE INDEX "LeadChild_leadId_idx" ON "LeadChild"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadChildHealth_childId_key" ON "LeadChildHealth"("childId" ASC);

-- CreateIndex
CREATE INDEX "LeadChildHealth_leadId_idx" ON "LeadChildHealth"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadChildTransport_childId_key" ON "LeadChildTransport"("childId" ASC);

-- CreateIndex
CREATE INDEX "LeadChildTransport_leadId_idx" ON "LeadChildTransport"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadComment_leadId_idx" ON "LeadComment"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadComment_userId_idx" ON "LeadComment"("userId" ASC);

-- CreateIndex
CREATE INDEX "LeadDocument_childId_idx" ON "LeadDocument"("childId" ASC);

-- CreateIndex
CREATE INDEX "LeadDocument_leadId_idx" ON "LeadDocument"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadDocumentRequest_leadId_documentType_childId_key" ON "LeadDocumentRequest"("leadId" ASC, "documentType" ASC, "childId" ASC);

-- CreateIndex
CREATE INDEX "LeadDocumentRequest_leadId_idx" ON "LeadDocumentRequest"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadEducationHistory_childId_idx" ON "LeadEducationHistory"("childId" ASC);

-- CreateIndex
CREATE INDEX "LeadEducationHistory_leadId_idx" ON "LeadEducationHistory"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadEmergencyContact_leadId_idx" ON "LeadEmergencyContact"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadEnrollmentDocument_childId_idx" ON "LeadEnrollmentDocument"("childId" ASC);

-- CreateIndex
CREATE INDEX "LeadEnrollmentDocument_documentType_idx" ON "LeadEnrollmentDocument"("documentType" ASC);

-- CreateIndex
CREATE INDEX "LeadEnrollmentDocument_leadId_idx" ON "LeadEnrollmentDocument"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadEnrollmentInfo_childId_key" ON "LeadEnrollmentInfo"("childId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadEnrollmentInfo_leadId_childId_key" ON "LeadEnrollmentInfo"("leadId" ASC, "childId" ASC);

-- CreateIndex
CREATE INDEX "LeadEnrollmentInfo_leadId_idx" ON "LeadEnrollmentInfo"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadFinancialResponsible_leadId_key" ON "LeadFinancialResponsible"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadHealthPlan_leadId_key" ON "LeadHealthPlan"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadHistory_leadId_createdAt_idx" ON "LeadHistory"("leadId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "LeadHistory_leadId_idx" ON "LeadHistory"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadParent_leadId_idx" ON "LeadParent"("leadId" ASC);

-- CreateIndex
CREATE INDEX "LeadParent_parentType_idx" ON "LeadParent"("parentType" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadTransport_leadId_key" ON "LeadTransport"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LeadView_leadId_userId_key" ON "LeadView"("leadId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "LeadView_userId_idx" ON "LeadView"("userId" ASC);

-- CreateIndex
CREATE INDEX "LessonPlan_classId_idx" ON "LessonPlan"("classId" ASC);

-- CreateIndex
CREATE INDEX "LessonPlan_scheduledDate_idx" ON "LessonPlan"("scheduledDate" ASC);

-- CreateIndex
CREATE INDEX "LessonPlan_tenantId_idx" ON "LessonPlan"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "MarketingLead_createdAt_idx" ON "MarketingLead"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "MarketingLead_email_idx" ON "MarketingLead"("email" ASC);

-- CreateIndex
CREATE INDEX "MarketingLead_intent_idx" ON "MarketingLead"("intent" ASC);

-- CreateIndex
CREATE INDEX "MarketingLead_status_idx" ON "MarketingLead"("status" ASC);

-- CreateIndex
CREATE INDEX "Message_channelId_idx" ON "Message"("channelId" ASC);

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Message_isPinned_idx" ON "Message"("isPinned" ASC);

-- CreateIndex
CREATE INDEX "Message_parentId_idx" ON "Message"("parentId" ASC);

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId" ASC);

-- CreateIndex
CREATE INDEX "Message_tenantId_idx" ON "Message"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "MessageMention_messageId_idx" ON "MessageMention"("messageId" ASC);

-- CreateIndex
CREATE INDEX "MessageMention_userId_idx" ON "MessageMention"("userId" ASC);

-- CreateIndex
CREATE INDEX "MessageReaction_messageId_idx" ON "MessageReaction"("messageId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_messageId_userId_emoji_key" ON "MessageReaction"("messageId" ASC, "userId" ASC, "emoji" ASC);

-- CreateIndex
CREATE INDEX "MessageRead_messageId_idx" ON "MessageRead"("messageId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "MessageRead_userId_idx" ON "MessageRead"("userId" ASC);

-- CreateIndex
CREATE INDEX "ModuleAccess_userId_idx" ON "ModuleAccess"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAccess_userId_module_key" ON "ModuleAccess"("userId" ASC, "module" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleChannel_channelId_key" ON "ModuleChannel"("channelId" ASC);

-- CreateIndex
CREATE INDEX "ModuleChannel_entityType_entityId_idx" ON "ModuleChannel"("entityType" ASC, "entityId" ASC);

-- CreateIndex
CREATE INDEX "ModuleChannel_module_idx" ON "ModuleChannel"("module" ASC);

-- CreateIndex
CREATE INDEX "ModuleChannel_tenantId_idx" ON "ModuleChannel"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleChannel_tenantId_module_entityType_entityId_key" ON "ModuleChannel"("tenantId" ASC, "module" ASC, "entityType" ASC, "entityId" ASC);

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead" ASC);

-- CreateIndex
CREATE INDEX "Notification_tenantId_idx" ON "Notification"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId" ASC);

-- CreateIndex
CREATE INDEX "ParentalConsent_consentedAt_idx" ON "ParentalConsent"("consentedAt" ASC);

-- CreateIndex
CREATE INDEX "ParentalConsent_leadId_idx" ON "ParentalConsent"("leadId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PeriodPriceTable_periodId_grade_key" ON "PeriodPriceTable"("periodId" ASC, "grade" ASC);

-- CreateIndex
CREATE INDEX "PeriodPriceTable_periodId_idx" ON "PeriodPriceTable"("periodId" ASC);

-- CreateIndex
CREATE INDEX "PeriodPriceTable_tenantId_idx" ON "PeriodPriceTable"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Position_departmentId_idx" ON "Position"("departmentId" ASC);

-- CreateIndex
CREATE INDEX "Position_tenantId_idx" ON "Position"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Position_tenantId_name_key" ON "Position"("tenantId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_periodId_idx" ON "PreReEnrollmentResponse"("periodId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PreReEnrollmentResponse_periodId_studentId_key" ON "PreReEnrollmentResponse"("periodId" ASC, "studentId" ASC);

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_status_idx" ON "PreReEnrollmentResponse"("status" ASC);

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_studentId_idx" ON "PreReEnrollmentResponse"("studentId" ASC);

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_tenantId_idx" ON "PreReEnrollmentResponse"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "PreReEnrollmentResponse_token_idx" ON "PreReEnrollmentResponse"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PreReEnrollmentResponse_token_key" ON "PreReEnrollmentResponse"("token" ASC);

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseRequestId_idx" ON "PurchaseItem"("purchaseRequestId" ASC);

-- CreateIndex
CREATE INDEX "PurchaseOrder_executedById_idx" ON "PurchaseOrder"("executedById" ASC);

-- CreateIndex
CREATE INDEX "PurchaseOrder_purchaseRequestId_idx" ON "PurchaseOrder"("purchaseRequestId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_purchaseRequestId_key" ON "PurchaseOrder"("purchaseRequestId" ASC);

-- CreateIndex
CREATE INDEX "PurchaseRequest_code_idx" ON "PurchaseRequest"("code" ASC);

-- CreateIndex
CREATE INDEX "PurchaseRequest_createdById_idx" ON "PurchaseRequest"("createdById" ASC);

-- CreateIndex
CREATE INDEX "PurchaseRequest_department_idx" ON "PurchaseRequest"("department" ASC);

-- CreateIndex
CREATE INDEX "PurchaseRequest_status_idx" ON "PurchaseRequest"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseRequest_tenantId_code_key" ON "PurchaseRequest"("tenantId" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "PurchaseRequest_tenantId_idx" ON "PurchaseRequest"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentInvite_gateStatus_idx" ON "ReEnrollmentInvite"("gateStatus" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentInvite_periodId_gateStatus_idx" ON "ReEnrollmentInvite"("periodId" ASC, "gateStatus" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentInvite_periodId_idx" ON "ReEnrollmentInvite"("periodId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReEnrollmentInvite_periodId_studentId_key" ON "ReEnrollmentInvite"("periodId" ASC, "studentId" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentInvite_status_idx" ON "ReEnrollmentInvite"("status" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentInvite_studentId_idx" ON "ReEnrollmentInvite"("studentId" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentInvite_tenantId_idx" ON "ReEnrollmentInvite"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentInvite_token_idx" ON "ReEnrollmentInvite"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ReEnrollmentInvite_token_key" ON "ReEnrollmentInvite"("token" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentPeriod_status_idx" ON "ReEnrollmentPeriod"("status" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentPeriod_targetYear_idx" ON "ReEnrollmentPeriod"("targetYear" ASC);

-- CreateIndex
CREATE INDEX "ReEnrollmentPeriod_tenantId_idx" ON "ReEnrollmentPeriod"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "SchoolClass_tenantId_idx" ON "SchoolClass"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_tenantId_name_year_key" ON "SchoolClass"("tenantId" ASC, "name" ASC, "year" ASC);

-- CreateIndex
CREATE INDEX "SchoolClass_year_idx" ON "SchoolClass"("year" ASC);

-- CreateIndex
CREATE INDEX "SchoolInvoice_dueDate_idx" ON "SchoolInvoice"("dueDate" ASC);

-- CreateIndex
CREATE INDEX "SchoolInvoice_status_idx" ON "SchoolInvoice"("status" ASC);

-- CreateIndex
CREATE INDEX "SchoolInvoice_studentId_idx" ON "SchoolInvoice"("studentId" ASC);

-- CreateIndex
CREATE INDEX "SchoolInvoice_tenantId_idx" ON "SchoolInvoice"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "SchoolSubject_tenantId_idx" ON "SchoolSubject"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolSubject_tenantId_name_key" ON "SchoolSubject"("tenantId" ASC, "name" ASC);

-- CreateIndex
CREATE INDEX "Student_academicYear_idx" ON "Student"("academicYear" ASC);

-- CreateIndex
CREATE INDEX "Student_grade_idx" ON "Student"("grade" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Student_leadChildId_academicYear_key" ON "Student"("leadChildId" ASC, "academicYear" ASC);

-- CreateIndex
CREATE INDEX "Student_leadId_idx" ON "Student"("leadId" ASC);

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Student_tenantId_code_key" ON "Student"("tenantId" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "Student_tenantId_idx" ON "Student"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "StudentGrade_classId_idx" ON "StudentGrade"("classId" ASC);

-- CreateIndex
CREATE INDEX "StudentGrade_period_idx" ON "StudentGrade"("period" ASC);

-- CreateIndex
CREATE INDEX "StudentGrade_studentId_idx" ON "StudentGrade"("studentId" ASC);

-- CreateIndex
CREATE INDEX "StudentGrade_tenantId_idx" ON "StudentGrade"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "StudentHistory_studentId_createdAt_idx" ON "StudentHistory"("studentId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "StudentHistory_studentId_idx" ON "StudentHistory"("studentId" ASC);

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name" ASC);

-- CreateIndex
CREATE INDEX "Supplier_tenantId_idx" ON "Supplier"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_tenantId_key" ON "SystemSettings"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "TaskActivity_cardId_idx" ON "TaskActivity"("cardId" ASC);

-- CreateIndex
CREATE INDEX "TaskAssignment_cardId_idx" ON "TaskAssignment"("cardId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignment_cardId_userId_key" ON "TaskAssignment"("cardId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "TaskAssignment_userId_idx" ON "TaskAssignment"("userId" ASC);

-- CreateIndex
CREATE INDEX "TaskBoard_channelId_idx" ON "TaskBoard"("channelId" ASC);

-- CreateIndex
CREATE INDEX "TaskBoard_createdById_idx" ON "TaskBoard"("createdById" ASC);

-- CreateIndex
CREATE INDEX "TaskBoard_tenantId_idx" ON "TaskBoard"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "TaskBoardMember_boardId_idx" ON "TaskBoardMember"("boardId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TaskBoardMember_boardId_userId_key" ON "TaskBoardMember"("boardId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "TaskBoardMember_userId_idx" ON "TaskBoardMember"("userId" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_code_idx" ON "TaskCard"("code" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_columnId_idx" ON "TaskCard"("columnId" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_createdById_idx" ON "TaskCard"("createdById" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_dueDate_idx" ON "TaskCard"("dueDate" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_order_idx" ON "TaskCard"("order" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_sourceLeadId_idx" ON "TaskCard"("sourceLeadId" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_sourceModule_idx" ON "TaskCard"("sourceModule" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCard_tenantId_code_key" ON "TaskCard"("tenantId" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "TaskCard_tenantId_idx" ON "TaskCard"("tenantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCardLabel_cardId_labelId_key" ON "TaskCardLabel"("cardId" ASC, "labelId" ASC);

-- CreateIndex
CREATE INDEX "TaskChecklist_cardId_idx" ON "TaskChecklist"("cardId" ASC);

-- CreateIndex
CREATE INDEX "TaskChecklistItem_checklistId_idx" ON "TaskChecklistItem"("checklistId" ASC);

-- CreateIndex
CREATE INDEX "TaskColumn_boardId_idx" ON "TaskColumn"("boardId" ASC);

-- CreateIndex
CREATE INDEX "TaskColumn_order_idx" ON "TaskColumn"("order" ASC);

-- CreateIndex
CREATE INDEX "TaskComment_cardId_idx" ON "TaskComment"("cardId" ASC);

-- CreateIndex
CREATE INDEX "TaskComment_userId_idx" ON "TaskComment"("userId" ASC);

-- CreateIndex
CREATE INDEX "TaskLabel_boardId_idx" ON "TaskLabel"("boardId" ASC);

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug" ASC);

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_idx" ON "Ticket"("assigneeId" ASC);

-- CreateIndex
CREATE INDEX "Ticket_channelId_idx" ON "Ticket"("channelId" ASC);

-- CreateIndex
CREATE INDEX "Ticket_code_idx" ON "Ticket"("code" ASC);

-- CreateIndex
CREATE INDEX "Ticket_createdById_idx" ON "Ticket"("createdById" ASC);

-- CreateIndex
CREATE INDEX "Ticket_department_idx" ON "Ticket"("department" ASC);

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_tenantId_code_key" ON "Ticket"("tenantId" ASC, "code" ASC);

-- CreateIndex
CREATE INDEX "Ticket_tenantId_idx" ON "Ticket"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "TicketActivity_ticketId_idx" ON "TicketActivity"("ticketId" ASC);

-- CreateIndex
CREATE INDEX "TicketComment_ticketId_idx" ON "TicketComment"("ticketId" ASC);

-- CreateIndex
CREATE INDEX "TicketComment_userId_idx" ON "TicketComment"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Tuition_tenantId_grade_year_key" ON "Tuition"("tenantId" ASC, "grade" ASC, "year" ASC);

-- CreateIndex
CREATE INDEX "Tuition_tenantId_idx" ON "Tuition"("tenantId" ASC);

-- CreateIndex
CREATE INDEX "Tuition_year_idx" ON "Tuition"("year" ASC);

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE INDEX "User_managerId_idx" ON "User"("managerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken" ASC);

-- CreateIndex
CREATE INDEX "User_positionId_idx" ON "User"("positionId" ASC);

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role" ASC);

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status" ASC);

-- AddForeignKey
ALTER TABLE "AccountsPayable" ADD CONSTRAINT "AccountsPayable_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountsPayable" ADD CONSTRAINT "AccountsPayable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddendumSigner" ADD CONSTRAINT "AddendumSigner_addendumId_fkey" FOREIGN KEY ("addendumId") REFERENCES "ContractAddendum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionGateApproval" ADD CONSTRAINT "AdmissionGateApproval_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionGateApproval" ADD CONSTRAINT "AdmissionGateApproval_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionGateApproval" ADD CONSTRAINT "AdmissionGateApproval_taskCardId_fkey" FOREIGN KEY ("taskCardId") REFERENCES "TaskCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationTokenLog" ADD CONSTRAINT "ApplicationTokenLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AssetLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLocation" ADD CONSTRAINT "AssetLocation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLocation" ADD CONSTRAINT "AssetLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMaintenance" ADD CONSTRAINT "AssetMaintenance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMovement" ADD CONSTRAINT "AssetMovement_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMovement" ADD CONSTRAINT "AssetMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "AssetLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMovement" ADD CONSTRAINT "AssetMovement_movedById_fkey" FOREIGN KEY ("movedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetMovement" ADD CONSTRAINT "AssetMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "AssetLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_taskCardId_fkey" FOREIGN KEY ("taskCardId") REFERENCES "TaskCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventParticipant" ADD CONSTRAINT "CalendarEventParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventParticipant" ADD CONSTRAINT "CalendarEventParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventReminder" ADD CONSTRAINT "CalendarEventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelMember" ADD CONSTRAINT "ChannelMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassEnrollment" ADD CONSTRAINT "ClassEnrollment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_financialApprovedById_fkey" FOREIGN KEY ("financialApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_legalApprovedById_fkey" FOREIGN KEY ("legalApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_negotiationApprovedById_fkey" FOREIGN KEY ("negotiationApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAddendum" ADD CONSTRAINT "ContractAddendum_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractAddendum" ADD CONSTRAINT "ContractAddendum_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractDefaultSigner" ADD CONSTRAINT "ContractDefaultSigner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractPayment" ADD CONSTRAINT "ContractPayment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSigner" ADD CONSTRAINT "ContractSigner_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriticalIssueEscalation" ADD CONSTRAINT "CriticalIssueEscalation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriticalIssueEscalation" ADD CONSTRAINT "CriticalIssueEscalation_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CriticalIssueEscalation" ADD CONSTRAINT "CriticalIssueEscalation_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmEvent" ADD CONSTRAINT "CrmEvent_assignedTeacherId_fkey" FOREIGN KEY ("assignedTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmEvent" ADD CONSTRAINT "CrmEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmEvent" ADD CONSTRAINT "CrmEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmEvent" ADD CONSTRAINT "CrmEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_headUserId_fkey" FOREIGN KEY ("headUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_parentDepartmentId_fkey" FOREIGN KEY ("parentDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFeePayment" ADD CONSTRAINT "EnrollmentFeePayment_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "ReEnrollmentInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentFeePayment" ADD CONSTRAINT "EnrollmentFeePayment_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_decisionById_fkey" FOREIGN KEY ("decisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_evaluatedById_fkey" FOREIGN KEY ("evaluatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CrmEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceEvaluation" ADD CONSTRAINT "ExperienceEvaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPriceException" ADD CONSTRAINT "FamilyPriceException_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPriceException" ADD CONSTRAINT "FamilyPriceException_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPriceException" ADD CONSTRAINT "FamilyPriceException_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPriceException" ADD CONSTRAINT "FamilyPriceException_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyPriceException" ADD CONSTRAINT "FamilyPriceException_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAnalysis" ADD CONSTRAINT "FinancialAnalysis_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateStepConfig" ADD CONSTRAINT "GateStepConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportHistory" ADD CONSTRAINT "ImportHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InventorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventorySession" ADD CONSTRAINT "InventorySession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanColumn" ADD CONSTRAINT "KanbanColumn_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "KanbanColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAdditionalInfo" ADD CONSTRAINT "LeadAdditionalInfo_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAdditionalInfo" ADD CONSTRAINT "LeadAdditionalInfo_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAddress" ADD CONSTRAINT "LeadAddress_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadChild" ADD CONSTRAINT "LeadChild_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadChildHealth" ADD CONSTRAINT "LeadChildHealth_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadChildHealth" ADD CONSTRAINT "LeadChildHealth_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadChildTransport" ADD CONSTRAINT "LeadChildTransport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadChildTransport" ADD CONSTRAINT "LeadChildTransport_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadComment" ADD CONSTRAINT "LeadComment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadComment" ADD CONSTRAINT "LeadComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocument" ADD CONSTRAINT "LeadDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocument" ADD CONSTRAINT "LeadDocument_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocumentRequest" ADD CONSTRAINT "LeadDocumentRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDocumentRequest" ADD CONSTRAINT "LeadDocumentRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEducationHistory" ADD CONSTRAINT "LeadEducationHistory_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEducationHistory" ADD CONSTRAINT "LeadEducationHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEmergencyContact" ADD CONSTRAINT "LeadEmergencyContact_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEnrollmentDocument" ADD CONSTRAINT "LeadEnrollmentDocument_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEnrollmentDocument" ADD CONSTRAINT "LeadEnrollmentDocument_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEnrollmentInfo" ADD CONSTRAINT "LeadEnrollmentInfo_childId_fkey" FOREIGN KEY ("childId") REFERENCES "LeadChild"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEnrollmentInfo" ADD CONSTRAINT "LeadEnrollmentInfo_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFinancialResponsible" ADD CONSTRAINT "LeadFinancialResponsible_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadHealthPlan" ADD CONSTRAINT "LeadHealthPlan_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadHistory" ADD CONSTRAINT "LeadHistory_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadParent" ADD CONSTRAINT "LeadParent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTransport" ADD CONSTRAINT "LeadTransport_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadView" ADD CONSTRAINT "LeadView_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadView" ADD CONSTRAINT "LeadView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageMention" ADD CONSTRAINT "MessageMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAccess" ADD CONSTRAINT "ModuleAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleChannel" ADD CONSTRAINT "ModuleChannel_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleChannel" ADD CONSTRAINT "ModuleChannel_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentalConsent" ADD CONSTRAINT "ParentalConsent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodPriceTable" ADD CONSTRAINT "PeriodPriceTable_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodPriceTable" ADD CONSTRAINT "PeriodPriceTable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReEnrollmentResponse" ADD CONSTRAINT "PreReEnrollmentResponse_negotiationApprovedById_fkey" FOREIGN KEY ("negotiationApprovedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReEnrollmentResponse" ADD CONSTRAINT "PreReEnrollmentResponse_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReEnrollmentResponse" ADD CONSTRAINT "PreReEnrollmentResponse_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreReEnrollmentResponse" ADD CONSTRAINT "PreReEnrollmentResponse_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_executedById_fkey" FOREIGN KEY ("executedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_purchaseRequestId_fkey" FOREIGN KEY ("purchaseRequestId") REFERENCES "PurchaseRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReEnrollmentInvite" ADD CONSTRAINT "ReEnrollmentInvite_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReEnrollmentPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReEnrollmentInvite" ADD CONSTRAINT "ReEnrollmentInvite_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReEnrollmentInvite" ADD CONSTRAINT "ReEnrollmentInvite_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReEnrollmentPeriod" ADD CONSTRAINT "ReEnrollmentPeriod_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReEnrollmentPeriod" ADD CONSTRAINT "ReEnrollmentPeriod_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_homeroomTeacherId_fkey" FOREIGN KEY ("homeroomTeacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolInvoice" ADD CONSTRAINT "SchoolInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolSubject" ADD CONSTRAINT "SchoolSubject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_leadChildId_fkey" FOREIGN KEY ("leadChildId") REFERENCES "LeadChild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_previousStudentId_fkey" FOREIGN KEY ("previousStudentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "SchoolSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentHistory" ADD CONSTRAINT "StudentHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBoard" ADD CONSTRAINT "TaskBoard_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBoard" ADD CONSTRAINT "TaskBoard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBoard" ADD CONSTRAINT "TaskBoard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBoardMember" ADD CONSTRAINT "TaskBoardMember_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskBoardMember" ADD CONSTRAINT "TaskBoardMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "TaskColumn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCard" ADD CONSTRAINT "TaskCard_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCardLabel" ADD CONSTRAINT "TaskCardLabel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCardLabel" ADD CONSTRAINT "TaskCardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "TaskLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklist" ADD CONSTRAINT "TaskChecklist_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "TaskChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskColumn" ADD CONSTRAINT "TaskColumn_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TaskCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLabel" ADD CONSTRAINT "TaskLabel_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketActivity" ADD CONSTRAINT "TicketActivity_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tuition" ADD CONSTRAINT "Tuition_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- POSTGRES RLS — defense-in-depth (originally added in 20260505120000_phase_5_rls)
-- Appended to baseline because `prisma migrate diff` does not introspect
-- RLS policies, functions, or ALTER TABLE ... ENABLE ROW LEVEL SECURITY.
-- Without this block, a fresh DB created from this baseline would have
-- *no* tenant isolation at the database layer.
-- ============================================================================

-- Helper function — reads the per-transaction GUC. Returns NULL when unset.
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '');
$$ LANGUAGE sql STABLE;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'SystemSettings', 'User', 'Invite',
    'Lead',
    'KanbanColumn', 'CrmEvent', 'ExperienceEvaluation',
    'Contract', 'ContractAddendum', 'ContractDefaultSigner', 'GateStepConfig',
    'ReEnrollmentPeriod', 'PeriodPriceTable', 'FamilyPriceException',
    'PreReEnrollmentResponse', 'ReEnrollmentInvite',
    'Channel', 'ModuleChannel', 'Message', 'Ticket', 'TaskBoard', 'TaskCard',
    'AuditLog', 'Notification', 'Document', 'ImportHistory',
    'PurchaseRequest', 'Supplier', 'Asset', 'AssetCategory', 'AssetLocation',
    'InventorySession', 'CalendarEvent', 'Student'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation ON %I
      USING (
        current_tenant_id() IS NULL
        OR current_tenant_id() = '__platform_admin__'
        OR "tenantId"::text = current_tenant_id()
      )
      WITH CHECK (
        current_tenant_id() IS NULL
        OR current_tenant_id() = '__platform_admin__'
        OR "tenantId"::text = current_tenant_id()
      )
    $pol$, tbl);
  END LOOP;
END $$;
