import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface StatusCardsProps {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
}

export function StatusCards({ pendingCount, approvedCount, rejectedCount }: StatusCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <Clock className="w-4 h-4 text-yellow-600" />
        <div>
          <p className="text-lg font-semibold text-yellow-700">{pendingCount}</p>
          <p className="text-xs text-yellow-600">Pendentes</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <div>
          <p className="text-lg font-semibold text-green-700">{approvedCount}</p>
          <p className="text-xs text-green-600">Aprovados</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <XCircle className="w-4 h-4 text-red-600" />
        <div>
          <p className="text-lg font-semibold text-red-700">{rejectedCount}</p>
          <p className="text-xs text-red-600">Rejeitados</p>
        </div>
      </div>
    </div>
  );
}
