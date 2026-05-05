import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock, clicksignMock, supabaseMock } = vi.hoisted(() => {
  const prismaMock = {
    contract: {
      findUnique: vi.fn(),
    },
    contractAddendum: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    addendumSigner: {
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(prismaMock)),
  };
  const clicksignMock = {
    createDocument: vi.fn(),
    createSigner: vi.fn(),
    addSignerToDocument: vi.fn(),
    notifySigners: vi.fn(),
  };
  const supabaseMock = {
    uploadFile: vi.fn(),
    getSignedUrl: vi.fn(),
  };
  return { prismaMock, clicksignMock, supabaseMock };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../services/clicksign.service.js', () => clicksignMock);
vi.mock('../config/supabase.js', () => supabaseMock);
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  createAddendum,
  listByContractId,
  generateAddendumPdf,
  sendAddendumForSignature,
  handleAddendumWebhook,
} from '../services/addendum.service.js';

const baseContract = {
  id: 'contract-1',
  code: 'CTR-20260101-0001',
  status: 'ACTIVE',
  leadId: 'lead-1',
  totalAnnualValue: 82800,
  createdAt: new Date('2026-01-01'),
  lead: {
    id: 'lead-1',
    familyName: 'Silva',
    parents: [
      {
        fullName: 'Maria Silva',
        cpf: '12345678901',
        email: 'maria@test.com',
        street: 'Rua A',
        number: '100',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '20000-000',
      },
    ],
    children: [{ fullName: 'João Silva', desiredGrade: '5th Grade', isApplicant: true }],
    address: { street: 'Rua A', number: '100', neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ', zipCode: '20000-000' },
  },
  signers: [],
};

const baseAddendumData = {
  contractId: 'contract-1',
  type: 'DISCOUNT' as const,
  description: 'Desconto de 10% aplicado por motivo X',
  changedValues: [{ field: 'Desconto', oldValue: '0%', newValue: '10%' }],
  signers: [{ role: 'SCHOOL_REPRESENTATIVE' as const, name: 'Maria Silva', email: 'maria@test.com', cpf: '12345678901' }],
};

const createdAddendum = {
  id: 'addendum-1',
  contractId: 'contract-1',
  code: 'ADT-20260403-0001',
  type: 'DISCOUNT',
  status: 'DRAFT',
  description: 'Desconto de 10% aplicado por motivo X',
  changedValues: [{ field: 'Desconto', oldValue: '0%', newValue: '10%' }],
  documentUrl: null,
  signedDocumentUrl: null,
  clicksignEnvelopeId: null,
  clicksignStatus: null,
  clicksignEnvelopeUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  signedAt: null,
  signers: [
    { id: 'signer-1', addendumId: 'addendum-1', role: 'SCHOOL_REPRESENTATIVE', name: 'Maria Silva', email: 'maria@test.com', cpf: '12345678901', phone: null, hasSigned: false, signedAt: null },
  ],
};

describe('Addendum Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAddendum', () => {
    it('should create addendum with DRAFT status and generated code', async () => {
      prismaMock.contract.findUnique.mockResolvedValue(baseContract);
      prismaMock.contractAddendum.create.mockResolvedValue(createdAddendum);

      const result = await createAddendum(baseAddendumData);

      expect(result.status).toBe('DRAFT');
      expect(result.code).toMatch(/^ADT-\d{8}-\d{4}$/);
      expect(result.contractId).toBe('contract-1');
      expect(result.signers).toHaveLength(1);
      expect(prismaMock.contract.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'contract-1' } }),
      );
    });

    it('should throw CONTRACT_NOT_FOUND when contract does not exist', async () => {
      prismaMock.contract.findUnique.mockResolvedValue(null);

      await expect(createAddendum(baseAddendumData)).rejects.toThrow('CONTRACT_NOT_FOUND');
    });

    it('should throw INVALID_CONTRACT_STATUS when contract is CANCELLED', async () => {
      prismaMock.contract.findUnique.mockResolvedValue({ ...baseContract, status: 'CANCELLED' });

      await expect(createAddendum(baseAddendumData)).rejects.toThrow('INVALID_CONTRACT_STATUS');
    });
  });

  describe('listByContractId', () => {
    it('should list addendums by contractId ordered by createdAt desc', async () => {
      const addendums = [
        { ...createdAddendum, createdAt: new Date('2026-04-03') },
        { ...createdAddendum, id: 'addendum-2', createdAt: new Date('2026-04-01') },
      ];
      prismaMock.contractAddendum.findMany.mockResolvedValue(addendums);

      const result = await listByContractId('contract-1');

      expect(result).toHaveLength(2);
      expect(prismaMock.contractAddendum.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contractId: 'contract-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('generateAddendumPdf', () => {
    it('should generate PDF and update documentUrl', async () => {
      prismaMock.contractAddendum.findUnique.mockResolvedValue({
        ...createdAddendum,
        contract: baseContract,
      });
      supabaseMock.uploadFile.mockResolvedValue('https://storage.example.com/addendums/addendum-1/aditivo-ADT-20260403-0001.pdf');
      prismaMock.contractAddendum.update.mockResolvedValue({
        ...createdAddendum,
        documentUrl: 'https://storage.example.com/addendums/addendum-1/aditivo-ADT-20260403-0001.pdf',
      });

      const result = await generateAddendumPdf('addendum-1');

      expect(result.documentUrl).toContain('addendums/');
      expect(supabaseMock.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.stringContaining('addendums/addendum-1/'),
        'application/pdf',
      );
      expect(prismaMock.contractAddendum.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'addendum-1' },
          data: expect.objectContaining({ documentUrl: expect.any(String) }),
        }),
      );
    });

    it('should throw ADDENDUM_NOT_FOUND when addendum does not exist', async () => {
      prismaMock.contractAddendum.findUnique.mockResolvedValue(null);

      await expect(generateAddendumPdf('nonexistent')).rejects.toThrow('ADDENDUM_NOT_FOUND');
    });
  });

  describe('sendAddendumForSignature', () => {
    it('should throw ADDENDUM_NO_DOCUMENT when documentUrl is null', async () => {
      prismaMock.contractAddendum.findUnique.mockResolvedValue({
        ...createdAddendum,
        documentUrl: null,
      });

      await expect(sendAddendumForSignature('addendum-1', 'user-1')).rejects.toThrow('ADDENDUM_NO_DOCUMENT');
    });

    it('should send for signature via ClickSign and update status to PENDING_SIGNATURE', async () => {
      // Mock global fetch for PDF download
      const mockFetch = vi.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
      });
      vi.stubGlobal('fetch', mockFetch);

      const addendumWithDoc = {
        ...createdAddendum,
        documentUrl: 'https://storage.example.com/addendums/addendum-1/aditivo.pdf',
      };
      prismaMock.contractAddendum.findUnique.mockResolvedValue(addendumWithDoc);
      supabaseMock.getSignedUrl.mockResolvedValue('https://storage.example.com/signed-url');
      clicksignMock.createDocument.mockResolvedValue({ document: { key: 'doc-key-1' } });
      clicksignMock.createSigner.mockResolvedValue({ signer: { key: 'signer-key-1' } });
      clicksignMock.addSignerToDocument.mockResolvedValue({ list: { request_signature_key: 'req-key-1' } });
      clicksignMock.notifySigners.mockResolvedValue({});
      prismaMock.addendumSigner.update.mockResolvedValue({});
      prismaMock.contractAddendum.update.mockResolvedValue({
        ...addendumWithDoc,
        status: 'PENDING_SIGNATURE',
        clicksignEnvelopeId: 'doc-key-1',
      });

      const result = await sendAddendumForSignature('addendum-1', 'user-1');

      expect(result.status).toBe('PENDING_SIGNATURE');
      expect(clicksignMock.createDocument).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('aditivo-'),
        expect.any(String),
      );
      expect(clicksignMock.createSigner).toHaveBeenCalled();
      expect(clicksignMock.addSignerToDocument).toHaveBeenCalled();
      expect(clicksignMock.notifySigners).toHaveBeenCalled();
    });
  });

  describe('handleAddendumWebhook', () => {
    it('should handle webhook COMPLETED event and update to SIGNED', async () => {
      prismaMock.contractAddendum.findFirst.mockResolvedValue({
        ...createdAddendum,
        clicksignEnvelopeId: 'env-key-1',
        status: 'PENDING_SIGNATURE',
        signers: createdAddendum.signers,
      });
      prismaMock.contractAddendum.update.mockResolvedValue({
        ...createdAddendum,
        status: 'SIGNED',
        signedAt: new Date(),
      });

      await handleAddendumWebhook('env-key-1', 'envelope_completed', {});

      expect(prismaMock.contractAddendum.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clicksignEnvelopeId: 'env-key-1' },
          data: expect.objectContaining({
            status: 'SIGNED',
            clicksignStatus: 'COMPLETED',
            signedAt: expect.any(Date),
          }),
        }),
      );
    });
  });
});
