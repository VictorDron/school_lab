import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleSubNav from '@/components/layout/ModuleSubNav';
import EmptyModulePlaceholder from '@/components/layout/EmptyModulePlaceholder';

export default function PedagogicalPage() {
  return (
    <div className="min-h-full bg-paper grain">
      <ModuleSubNav
        items={[
          { to: '/pedagogical/classes', label: '— Turmas' },
          { to: '/pedagogical/subjects', label: '— Disciplinas' },
          { to: '/pedagogical/lesson-plans', label: '— Plano de Aulas' },
          { to: '/pedagogical/grades', label: '— Notas' },
          { to: '/pedagogical/attendance', label: '— Frequência' },
        ]}
      />
      <Routes>
        <Route index element={<Navigate to="classes" replace />} />
        <Route path="classes" element={<EmptyModulePlaceholder title="Turmas" subtitle="Turmas, alunos matriculados e disciplinas" />} />
        <Route path="subjects" element={<EmptyModulePlaceholder title="Disciplinas" subtitle="Catálogo de disciplinas oferecidas pela escola" />} />
        <Route path="lesson-plans" element={<EmptyModulePlaceholder title="Plano de Aulas" subtitle="Planos de aula por turma, disciplina e professor" />} />
        <Route path="grades" element={<EmptyModulePlaceholder title="Notas" subtitle="Lançamento e histórico de notas" />} />
        <Route path="attendance" element={<EmptyModulePlaceholder title="Frequência" subtitle="Registro diário de presença" />} />
      </Routes>
    </div>
  );
}
