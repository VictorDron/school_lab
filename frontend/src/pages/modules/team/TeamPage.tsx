import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleSubNav from '@/components/layout/ModuleSubNav';
import EmptyModulePlaceholder from '@/components/layout/EmptyModulePlaceholder';

export default function TeamPage() {
  return (
    <div className="min-h-full bg-paper grain">
      <ModuleSubNav
        items={[
          { to: '/team/departments', label: '— Departamentos' },
          { to: '/team/positions', label: '— Cargos' },
          { to: '/team/employees', label: '— Colaboradores' },
          { to: '/team/org-chart', label: '— Organograma' },
        ]}
      />
      <Routes>
        <Route index element={<Navigate to="employees" replace />} />
        <Route path="departments" element={<EmptyModulePlaceholder title="Departamentos" subtitle="Estrutura organizacional da escola" />} />
        <Route path="positions" element={<EmptyModulePlaceholder title="Cargos" subtitle="Cargos e funções dentro dos departamentos" />} />
        <Route path="employees" element={<EmptyModulePlaceholder title="Colaboradores" subtitle="Time da escola — perfis, departamentos e hierarquia" />} />
        <Route path="org-chart" element={<EmptyModulePlaceholder title="Organograma" subtitle="Hierarquia visual da equipe" />} />
      </Routes>
    </div>
  );
}
