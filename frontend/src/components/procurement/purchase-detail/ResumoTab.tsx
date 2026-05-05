import {
  Loader2,
  Save,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import {
  formatCurrency,
  formatDate,
  DEPARTMENT_OPTIONS,
  PRIORITY_LABELS,
  PriorityBadge,
  StatusBadge,
} from './constants';
import type { ResumoTabProps } from './constants';
import type { PurchasePriority } from '@/types/procurement';

// ── Component ─────────────────────────────────────────────────────────────────

export function ResumoTab({ purchase, isEditing, editForm, onEditFormChange, onSave, onCancel, isSaving }: ResumoTabProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Creator info */}
      <div className="card p-4">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Solicitante
        </h4>
        <div className="flex items-center gap-3">
          <Avatar
            src={purchase.creator.avatarUrl}
            name={purchase.creator.displayName}
            size="md"
          />
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {purchase.creator.displayName}
            </p>
            {purchase.creator.email && (
              <p className="text-xs text-neutral-500">{purchase.creator.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Title (editable) */}
      {isEditing && (
        <div className="card p-4">
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Titulo
          </h4>
          <input
            type="text"
            value={editForm.title}
            onChange={(e) => onEditFormChange({ title: e.target.value })}
            className="input w-full"
            placeholder="Título da requisição"
          />
        </div>
      )}

      {/* Details grid */}
      <div className="card p-4">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Detalhes
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="label">Departamento</span>
            {isEditing ? (
              <select
                value={editForm.department}
                onChange={(e) => onEditFormChange({ department: e.target.value })}
                className="input w-full mt-1"
              >
                <option value="">Selecione...</option>
                {DEPARTMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-neutral-900">{purchase.department}</p>
            )}
          </div>
          <div>
            <span className="label">Prioridade</span>
            {isEditing ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {(Object.keys(PRIORITY_LABELS) as PurchasePriority[]).map((p) => (
                  <label
                    key={p}
                    className={`cursor-pointer text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      editForm.priority === p
                        ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p}
                      checked={editForm.priority === p}
                      onChange={() => onEditFormChange({ priority: p })}
                      className="sr-only"
                    />
                    {PRIORITY_LABELS[p]}
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-0.5">
                <PriorityBadge priority={purchase.priority} />
              </div>
            )}
          </div>
          <div>
            <span className="label">Data de Criacao</span>
            <p className="text-sm text-neutral-900">{formatDate(purchase.createdAt)}</p>
          </div>
          <div>
            <span className="label">Data de Submissao</span>
            <p className="text-sm text-neutral-900">{formatDate(purchase.submittedAt)}</p>
          </div>
          {purchase.approvedAt && (
            <div>
              <span className="label">Data de Aprovação</span>
              <p className="text-sm text-neutral-900">{formatDate(purchase.approvedAt)}</p>
            </div>
          )}
          {purchase.rejectedAt && (
            <div>
              <span className="label">Data de Rejeicao</span>
              <p className="text-sm text-neutral-900">{formatDate(purchase.rejectedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Justification */}
      <div className="card p-4">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Justificativa
        </h4>
        {isEditing ? (
          <textarea
            value={editForm.justification}
            onChange={(e) => onEditFormChange({ justification: e.target.value })}
            className="input w-full"
            rows={4}
            placeholder="Justificativa da requisição"
          />
        ) : (
          <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
            {purchase.justification || 'Nenhuma justificativa informada.'}
          </p>
        )}
      </div>

      {/* Notes (editable, shown only in edit mode or if has content) */}
      {(isEditing || purchase.notes) && (
        <div className="card p-4">
          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Observações
          </h4>
          {isEditing ? (
            <textarea
              value={editForm.notes}
              onChange={(e) => onEditFormChange({ notes: e.target.value })}
              className="input w-full"
              rows={3}
              placeholder="Observações adicionais (opcional)"
            />
          ) : (
            <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
              {purchase.notes}
            </p>
          )}
        </div>
      )}

      {/* Save / Cancel buttons when editing */}
      {isEditing && (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="btn btn-secondary btn-md"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || !editForm.title.trim() || !editForm.department}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </button>
        </div>
      )}

      {/* Total */}
      <div className="card p-4">
        <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Valor Total Estimado
        </h4>
        <p className="text-2xl font-bold text-neutral-900">
          {formatCurrency(purchase.totalAmount)}
        </p>
      </div>

      {/* Purchase Order info (if PURCHASED) */}
      {purchase.status === 'PURCHASED' && purchase.purchaseOrder && (
        <div className="card p-4 border-emerald-200 bg-emerald-50/30">
          <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-3">
            Dados da Compra
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {purchase.purchaseOrder.supplier && (
              <div>
                <span className="label">Fornecedor</span>
                <p className="text-sm text-neutral-900">
                  {purchase.purchaseOrder.supplier.name}
                </p>
              </div>
            )}
            {purchase.purchaseOrder.invoiceNumber && (
              <div>
                <span className="label">Nota Fiscal</span>
                <p className="text-sm text-neutral-900">
                  {purchase.purchaseOrder.invoiceNumber}
                </p>
              </div>
            )}
            {purchase.purchaseOrder.totalAmount != null && (
              <div>
                <span className="label">Valor Real</span>
                <p className="text-sm font-semibold text-emerald-700">
                  {formatCurrency(purchase.purchaseOrder.totalAmount)}
                </p>
              </div>
            )}
            {purchase.purchaseOrder.executedAt && (
              <div>
                <span className="label">Data de Execução</span>
                <p className="text-sm text-neutral-900">
                  {formatDate(purchase.purchaseOrder.executedAt)}
                </p>
              </div>
            )}
          </div>
          {purchase.purchaseOrder.notes && (
            <div className="mt-3 pt-3 border-t border-emerald-200">
              <span className="label">Observações</span>
              <p className="text-sm text-neutral-700 mt-1">
                {purchase.purchaseOrder.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
