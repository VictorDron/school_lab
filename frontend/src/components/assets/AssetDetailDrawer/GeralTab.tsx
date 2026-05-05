import {
  MapPin,
  QrCode,
  Download,
  Printer,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import type { Asset } from '@/types/assets';
import {
  formatCurrency,
  formatDate,
  isWarrantyExpired,
  isWarrantyExpiringSoon,
} from './helpers';

// ---------------------------------------------------------------------------
// GeralTab — overview tab. Photo, info grid (category, location, brand,
// model, serial, warranty with expiry badges, acquisition data, current
// value, depreciation, responsible person, source PO link), QR code panel
// with download/print actions, and free-form notes.
// ---------------------------------------------------------------------------

export function GeralTab({ asset }: { asset: Asset }) {
  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-center">
        {asset.photoUrl ? (
          <img
            src={asset.photoUrl}
            alt={asset.name}
            className="w-full max-w-sm h-48 object-cover rounded-xl border border-neutral-200"
          />
        ) : (
          <div className="w-full max-w-sm h-48 bg-neutral-100 rounded-xl border border-neutral-200 flex flex-col items-center justify-center gap-2">
            <QrCode className="w-12 h-12 text-neutral-300" />
            <span className="text-sm text-neutral-400">Sem foto do ativo</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <InfoItem label="Categoria" value={asset.category?.name ?? '-'} />
        <InfoItem
          label="Localização"
          value={asset.location?.name ?? '-'}
          icon={<MapPin className="w-3.5 h-3.5 text-neutral-400" />}
        />

        <InfoItem label="Marca" value={asset.brand ?? '-'} />
        <InfoItem label="Modelo" value={asset.model ?? '-'} />

        <InfoItem label="Nº Série" value={asset.serialNumber ?? '-'} />
        <WarrantyItem warranty={asset.warranty ?? null} />

        <InfoItem
          label="Data Aquisição"
          value={asset.acquisitionDate ? formatDate(asset.acquisitionDate) : '-'}
        />
        <InfoItem
          label="Valor Aquisição"
          value={asset.acquisitionValue != null ? formatCurrency(asset.acquisitionValue) : '-'}
        />

        <InfoItem
          label="Valor Atual"
          value={asset.currentValue != null ? formatCurrency(asset.currentValue) : '-'}
        />
        <InfoItem
          label="Taxa Depreciação"
          value={asset.depreciationRate != null ? `${asset.depreciationRate}% a.a.` : '-'}
        />

        <div className="col-span-2">
          <span className="text-xs text-neutral-500 block mb-1">Responsável</span>
          {asset.responsible ? (
            <div className="flex items-center gap-2">
              <Avatar name={asset.responsible.displayName} size="sm" />
              <span className="text-sm text-neutral-900">{asset.responsible.displayName}</span>
            </div>
          ) : (
            <span className="text-sm text-neutral-400 italic">Sem responsável</span>
          )}
        </div>

        {asset.purchaseOrderId && (
          <div className="col-span-2">
            <span className="text-xs text-neutral-500 block mb-1">Origem</span>
            <a
              href={`/procurement/orders/${asset.purchaseOrderId}`}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              Ordem de Compra
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {asset.qrCodeUrl && <QrCodePanel asset={asset} />}

      {asset.notes && (
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Observações</h3>
          <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 whitespace-pre-wrap">
            {asset.notes}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoItem — single label + value cell used throughout the info grid.
// ---------------------------------------------------------------------------

function InfoItem({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-neutral-500 block mb-1">{label}</span>
      <span className="text-sm text-neutral-900 flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WarrantyItem — warranty cell with date plus expired/expiring badges.
// Pulled out of the grid because it has more conditional structure than the
// other InfoItem cells.
// ---------------------------------------------------------------------------

function WarrantyItem({ warranty }: { warranty: string | null }) {
  if (!warranty) {
    return (
      <div>
        <span className="text-xs text-neutral-500 block mb-1">Garantia</span>
        <span className="text-sm text-neutral-900">-</span>
      </div>
    );
  }

  const expired = isWarrantyExpired(warranty);
  const expiringSoon = !expired && isWarrantyExpiringSoon(warranty);

  return (
    <div>
      <span className="text-xs text-neutral-500 block mb-1">Garantia</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-900">{formatDate(warranty)}</span>
        {expired && (
          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-medium">
            Expirada
          </span>
        )}
        {expiringSoon && (
          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-warning-100 text-warning-700 rounded font-medium">
            <AlertTriangle className="w-3 h-3" />
            Expirando
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QrCodePanel — shows the QR image plus actions to download the PNG and to
// print a centered, code-labelled version of it.
// ---------------------------------------------------------------------------

function QrCodePanel({ asset }: { asset: Asset }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>QR Code - ${asset.code}</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;">
          <img src="${asset.qrCodeUrl}" style="width:300px;height:300px;" />
          <p style="font-family:monospace;font-size:18px;margin-top:16px;">${asset.code}</p>
          <p style="font-family:sans-serif;font-size:14px;color:#666;">${asset.name}</p>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="border border-neutral-200 rounded-xl p-4">
      <h3 className="text-sm font-medium text-neutral-700 mb-3">Código QR</h3>
      <div className="flex items-center gap-4">
        <img
          src={asset.qrCodeUrl}
          alt={`QR Code - ${asset.code}`}
          className="w-24 h-24 border border-neutral-200 rounded-lg"
        />
        <div className="flex flex-col gap-2">
          <a
            href={asset.qrCodeUrl}
            download={`qr-${asset.code}.png`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}
