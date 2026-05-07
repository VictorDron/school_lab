import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleSubNav from '@/components/layout/ModuleSubNav';
import EmptyModulePlaceholder from '@/components/layout/EmptyModulePlaceholder';

export default function FinancePage() {
  return (
    <div className="min-h-full bg-paper grain">
      <ModuleSubNav
        items={[
          { to: '/financial/cash-flow', label: '— Fluxo de Caixa' },
          { to: '/financial/tuitions', label: '— Mensalidades' },
          { to: '/financial/invoices', label: '— Cobranças' },
          { to: '/financial/payables', label: '— Contas a Pagar' },
        ]}
      />
      <Routes>
        <Route index element={<Navigate to="cash-flow" replace />} />
        <Route path="cash-flow" element={<EmptyModulePlaceholder title="Fluxo de Caixa" subtitle="Visão consolidada de receitas e despesas" />} />
        <Route path="tuitions" element={<EmptyModulePlaceholder title="Mensalidades" subtitle="Tabela-base de mensalidades por série/ano" />} />
        <Route path="invoices" element={<EmptyModulePlaceholder title="Cobranças" subtitle="Mensalidades e cobranças avulsas" />} />
        <Route path="payables" element={<EmptyModulePlaceholder title="Contas a Pagar" subtitle="Contas, fornecedores e despesas operacionais" />} />
      </Routes>
    </div>
  );
}
