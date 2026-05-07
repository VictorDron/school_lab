import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleSubNav from '@/components/layout/ModuleSubNav';
import CashFlowView from '@/components/finance/CashFlowView';
import TuitionsView from '@/components/finance/TuitionsView';
import InvoicesView from '@/components/finance/InvoicesView';
import PayablesView from '@/components/finance/PayablesView';

export default function FinancePage() {
  return (
    <div className="min-h-full bg-paper grain">
      <ModuleSubNav
        items={[
          { to: '/financial/cash-flow', label: '— Fluxo de Caixa' },
          { to: '/financial/invoices', label: '— Cobranças' },
          { to: '/financial/payables', label: '— Contas a Pagar' },
          { to: '/financial/tuitions', label: '— Mensalidades' },
        ]}
      />
      <Routes>
        <Route index element={<Navigate to="cash-flow" replace />} />
        <Route path="cash-flow" element={<CashFlowView />} />
        <Route path="invoices"  element={<InvoicesView />} />
        <Route path="payables"  element={<PayablesView />} />
        <Route path="tuitions"  element={<TuitionsView />} />
      </Routes>
    </div>
  );
}
