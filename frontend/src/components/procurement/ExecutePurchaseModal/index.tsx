import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingCart, X } from 'lucide-react';
import { useSuppliers } from '@/hooks/usePurchases';
import { useAssetCategories, useAssetLocations } from '@/hooks/useAssets';
import { SupplierSelector } from './SupplierSelector';
import { PurchaseItemsTable } from './PurchaseItemsTable';
import { TotalsComparison } from './TotalsComparison';
import { AssetCreationWarning } from './AssetCreationWarning';
import { useExecutePurchaseForm } from './useExecutePurchaseForm';
import type { ExecutePurchaseModalProps } from './types';

export function ExecutePurchaseModal({ purchase, onClose }: ExecutePurchaseModalProps) {
  const { data: suppliersResponse, isLoading: loadingSuppliers } = useSuppliers({ isActive: true });
  const suppliers = suppliersResponse?.data ?? [];
  const { data: categoriesResponse } = useAssetCategories();
  const categories = categoriesResponse?.data ?? [];
  const { data: locationsResponse } = useAssetLocations();
  const locations = locationsResponse?.data ?? [];

  const {
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
    isExecuting,
  } = useExecutePurchaseForm({ purchase, onClose });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-large w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Executar Compra</h2>
                <p className="text-sm text-white/70">
                  {purchase.code} &mdash; {purchase.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <SupplierSelector
              suppliers={suppliers}
              loadingSuppliers={loadingSuppliers}
              supplierId={supplierId}
              setSupplierId={setSupplierId}
              showNewSupplier={showNewSupplier}
              setShowNewSupplier={setShowNewSupplier}
            />

            <div>
              <label className="label">Número da Nota Fiscal</label>
              <input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Ex: NF-001234"
                className="input max-w-xs"
              />
            </div>

            <PurchaseItemsTable
              items={items}
              setItems={setItems}
              onUpdateItem={updateItem}
              categories={categories}
              locations={locations}
            />

            <TotalsComparison estimatedTotal={purchase.totalAmount} actualTotal={actualTotal} />

            <AssetCreationWarning count={assetsToCreate} />

            <div>
              <label className="label">Observações</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Observações sobre a compra..."
                className="input resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-md"
              disabled={isExecuting}
            >
              Cancelar
            </button>
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="btn btn-primary btn-md"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Executando...
                </>
              ) : (
                'Executar Compra'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
