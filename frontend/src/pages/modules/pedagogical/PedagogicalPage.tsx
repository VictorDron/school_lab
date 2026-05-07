import { Routes, Route, Navigate } from 'react-router-dom';
import ModuleSubNav from '@/components/layout/ModuleSubNav';
import ClassesView from '@/components/pedagogical/ClassesView';
import SubjectsView from '@/components/pedagogical/SubjectsView';
import LessonPlansView from '@/components/pedagogical/LessonPlansView';
import GradesView from '@/components/pedagogical/GradesView';
import AttendanceView from '@/components/pedagogical/AttendanceView';

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
        <Route path="classes"      element={<ClassesView />} />
        <Route path="subjects"     element={<SubjectsView />} />
        <Route path="lesson-plans" element={<LessonPlansView />} />
        <Route path="grades"       element={<GradesView />} />
        <Route path="attendance"   element={<AttendanceView />} />
      </Routes>
    </div>
  );
}
