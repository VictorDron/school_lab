import type { ContractPayment, PaymentStatus } from '@/types/contract';

interface PaymentScheduleTableProps {
  payments: ContractPayment[];
}

const statusConfig: Record<PaymentStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-amber-100 text-amber-800' },
  PAID: { label: 'Pago', color: 'bg-green-100 text-green-800' },
  OVERDUE: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatBRL(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function PaymentScheduleTable({ payments }: PaymentScheduleTableProps) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-neutral-500 text-center py-4">
        Nenhuma parcela cadastrada.
      </p>
    );
  }

  const sorted = [...payments].sort((a, b) => a.installmentNumber - b.installmentNumber);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
            <th className="py-2 px-3">#</th>
            <th className="py-2 px-3">Vencimento</th>
            <th className="py-2 px-3">Valor</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Pago em</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((payment) => {
            const status = statusConfig[payment.status];
            return (
              <tr
                key={payment.id}
                className="border-b border-neutral-100 hover:bg-neutral-50"
              >
                <td className="py-2 px-3 text-neutral-700">{payment.installmentNumber}</td>
                <td className="py-2 px-3 text-neutral-700">{formatDate(payment.dueDate)}</td>
                <td className="py-2 px-3 text-neutral-800 font-medium">{formatBRL(payment.amount)}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </td>
                <td className="py-2 px-3 text-neutral-500">
                  {payment.paidAt ? formatDate(payment.paidAt) : '--'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
