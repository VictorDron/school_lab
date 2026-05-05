import QRCode from 'qrcode';
import { prisma } from '../../config/database.js';
import { uploadFile } from '../../config/supabase.js';
import { generateCode } from '../../utils/helpers.js';
import { createAuditLog } from '../audit.service.js';
import { createNotification } from '../notification.service.js';
import type { ExecutePurchaseData } from './types.js';

/**
 * Execute an APPROVED purchase: create the PurchaseOrder, optionally
 * spawn Asset rows for items flagged with `createAsset`, then flip the
 * request to PURCHASED. Each generated asset gets its own QR code
 * uploaded to storage so the frontend can print labels immediately.
 * The actual total comes from the executor's `actualUnitPrice` if items
 * are provided — otherwise we fall back to the request's estimate.
 */
export async function executePurchase(
  id: string,
  data: ExecutePurchaseData,
  userId: string,
  userEmail: string,
) {
  const purchase = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!purchase) {
    return { error: 'NOT_FOUND' as const };
  }

  if (purchase.status !== 'APPROVED') {
    return { error: 'NOT_APPROVED' as const };
  }

  const actualTotal =
    data.items?.reduce(
      (sum: number, item: any) => sum + item.actualQuantity * item.actualUnitPrice,
      0,
    ) || Number(purchase.totalAmount);

  const purchaseOrder = await prisma.purchaseOrder.create({
    data: {
      purchaseRequestId: purchase.id,
      supplierId: data.supplierId || null,
      invoiceNumber: data.invoiceNumber,
      totalAmount: actualTotal,
      notes: data.notes,
      executedById: userId,
      autoCreateAssets: data.items?.some((i: any) => i.createAsset) || false,
      executedAt: new Date(),
    },
  });

  const createdAssets: any[] = [];
  if (data.items) {
    for (const item of data.items) {
      if (item.createAsset) {
        const purchaseItem = purchase.items.find((pi: any) => pi.id === item.purchaseItemId);
        if (!purchaseItem) continue;

        const code = generateCode('AST');

        const qrDataUrl = await QRCode.toDataURL(code, { width: 300 });
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrCodeUrl = await uploadFile(qrBuffer, `assets/qr/${code}.png`, 'image/png');

        const asset = await prisma.asset.create({
          data: {
            code,
            name: purchaseItem.description,
            categoryId: item.assetCategoryId!,
            locationId: item.assetLocationId!,
            status: 'AVAILABLE',
            acquisitionDate: new Date(),
            acquisitionValue: item.actualUnitPrice,
            currentValue: item.actualUnitPrice,
            qrCodeUrl,
            purchaseOrderId: purchaseOrder.id,
            createdById: userId,
            notes: `Auto-criado via compra ${purchase.code}`,
          },
        });

        createdAssets.push(asset);

        await createAuditLog({
          actorId: userId,
          actorEmail: userEmail,
          action: 'ASSET_CREATED',
          entityType: 'ASSET',
          entityId: asset.id,
          metadata: { code: asset.code, source: 'purchase', purchaseCode: purchase.code },
        });
      }
    }
  }

  await prisma.purchaseRequest.update({
    where: { id: purchase.id },
    data: { status: 'PURCHASED', purchasedAt: new Date() },
  });

  await prisma.approvalAction.create({
    data: {
      purchaseRequestId: purchase.id,
      userId,
      action: 'EXECUTED',
      previousStatus: 'APPROVED',
      newStatus: 'PURCHASED',
      comments: data.notes,
    },
  });

  await createNotification({
    userId: purchase.createdById,
    type: 'purchase_executed',
    title: 'Compra Executada',
    message: `Sua requisição "${purchase.title}" foi executada.${
      createdAssets.length > 0 ? ` ${createdAssets.length} ativo(s) criado(s).` : ''
    }`,
    data: { purchaseId: purchase.id, purchaseCode: purchase.code },
  });

  await createAuditLog({
    actorId: userId,
    actorEmail: userEmail,
    action: 'PURCHASE_EXECUTED',
    entityType: 'PURCHASE',
    entityId: purchase.id,
    metadata: {
      code: purchase.code,
      supplierId: data.supplierId,
      assetsCreated: createdAssets.length,
    },
  });

  return { data: { purchaseOrder, createdAssets } };
}

export async function getStatsOverview() {
  const [pending, approved, total, totalAmount] = await Promise.all([
    prisma.purchaseRequest.count({
      where: { status: { in: ['PENDING_MANAGER', 'PENDING_FINANCE'] } },
    }),
    prisma.purchaseRequest.count({ where: { status: 'APPROVED' } }),
    prisma.purchaseRequest.count(),
    prisma.purchaseRequest.aggregate({
      where: { status: 'PURCHASED' },
      _sum: { totalAmount: true },
    }),
  ]);

  return { pending, approved, total, totalSpent: totalAmount._sum.totalAmount || 0 };
}
