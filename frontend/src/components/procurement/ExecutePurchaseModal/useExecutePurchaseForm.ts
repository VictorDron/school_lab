import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useExecutePurchase } from '@/hooks/usePurchases';
import type { ExecutePurchaseInput, PurchaseRequest } from '@/types/procurement';
import { buildInitialItems } from './helpers';
import type { ItemRow } from './types';

interface UseExecutePurchaseFormParams {
  purchase: PurchaseRequest;
  onClose: () => void;
}

/**
 * Owns the editable item list, the supplier/invoice/notes scratch
 * fields, and the validate-then-mutate handler. The body-scroll lock
 * stays here so the modal closes consistently restore document
 * scrolling when the hook unmounts.
 */
export function useExecutePurchaseForm({ purchase, onClose }: UseExecutePurchaseFormParams) {
  const executeMutation = useExecutePurchase();

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [items, setItems] = useState<ItemRow[]>(() => buildInitialItems(purchase));

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const updateItem = (index: number, updates: Partial<ItemRow>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const actualTotal = useMemo(
    () =>
      items
        .filter((item) => item.included)
        .reduce((sum, item) => sum + item.actualQuantity * item.actualUnitPrice, 0),
    [items],
  );

  const assetsToCreate = items.filter((item) => item.included && item.createAsset).length;

  const handleExecute = () => {
    if (!supplierId) {
      toast.error('Selecione um fornecedor.');
      return;
    }

    const includedItems = items.filter((item) => item.included);
    if (includedItems.length === 0) {
      toast.error('Selecione ao menos um item.');
      return;
    }

    for (const item of includedItems) {
      if (item.createAsset && (!item.assetCategoryId || !item.assetLocationId)) {
        toast.error(`Preencha categoria e localização do ativo para "${item.description}".`);
        return;
      }
    }

    const data: ExecutePurchaseInput = {
      supplierId,
      invoiceNumber: invoiceNumber || undefined,
      notes: notes || undefined,
      items: includedItems.map((item) => ({
        purchaseItemId: item.purchaseItemId,
        actualQuantity: item.actualQuantity,
        actualUnitPrice: item.actualUnitPrice,
        createAsset: item.createAsset,
        assetCategoryId: item.createAsset ? item.assetCategoryId : undefined,
        assetLocationId: item.createAsset ? item.assetLocationId : undefined,
      })),
    };

    executeMutation.mutate({ id: purchase.id, data }, { onSuccess: () => onClose() });
  };

  return {
    supplierId,
    setSupplierId,
    invoiceNumber,
    setInvoiceNumber,
    notes,
    setNotes,
    showNewSupplier,
    setShowNewSupplier,
    items,
    setItems,
    updateItem,
    actualTotal,
    assetsToCreate,
    handleExecute,
    isExecuting: executeMutation.isPending,
  };
}
