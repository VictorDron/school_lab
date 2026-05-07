import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleSubNav from '@/components/layout/ModuleSubNav';
import DepartmentsView from '@/components/team/DepartmentsView';
import PositionsView from '@/components/team/PositionsView';
import EmployeesView from '@/components/team/EmployeesView';
import OrgChartView from '@/components/team/OrgChartView';

export default function TeamPage() {
  return (
    <div className="min-h-full bg-paper grain">
      <ModuleSubNav
        items={[
          { to: '/team/employees', label: '— Colaboradores' },
          { to: '/team/departments', label: '— Departamentos' },
          { to: '/team/positions', label: '— Cargos' },
          { to: '/team/org-chart', label: '— Organograma' },
        ]}
      />
      <Routes>
        <Route index element={<Navigate to="employees" replace />} />
        <Route path="employees" element={<EmployeesView />} />
        <Route path="departments" element={<DepartmentsView />} />
        <Route path="positions" element={<PositionsView />} />
        <Route path="org-chart" element={<OrgChartView />} />
      </Routes>
    </div>
  );
}
