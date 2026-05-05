import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useUpdateStudent } from '@/hooks/useStudents';
import { gradeOptions } from '@/constants/grades';
import { nationalities } from '@/constants/nationalities';
import type { Student } from '@/types/students';

interface StudentEditModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
}

const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
];

const inputClass =
  'w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white transition-colors hover:border-neutral-300';

export function StudentEditModal({ student, isOpen, onClose }: StudentEditModalProps) {
  const [fullName, setFullName] = useState(student.fullName);
  const [grade, setGrade] = useState(student.grade ?? '');
  const [academicYear, setAcademicYear] = useState(student.academicYear);
  const [dateOfBirth, setDateOfBirth] = useState(
    student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : ''
  );
  const [cpf, setCpf] = useState(student.cpf ?? '');
  const [gender, setGender] = useState(student.gender ?? '');
  const [nationality, setNationality] = useState(student.nationality ?? '');

  const { mutate: updateStudent, isPending } = useUpdateStudent();

  const nationalityOptions = useMemo(
    () =>
      nationalities.map((n) => ({
        value: n.en,
        label: n.pt,
      })),
    []
  );

  useEffect(() => {
    setFullName(student.fullName);
    setGrade(student.grade ?? '');
    setAcademicYear(student.academicYear);
    setDateOfBirth(student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '');
    setCpf(student.cpf ?? '');
    setGender(student.gender ?? '');
    setNationality(student.nationality ?? '');
  }, [student.id]);

  if (!isOpen) return null;

  function hasChanges(): boolean {
    return (
      fullName !== student.fullName ||
      grade !== (student.grade ?? '') ||
      academicYear !== student.academicYear ||
      dateOfBirth !== (student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '') ||
      cpf !== (student.cpf ?? '') ||
      gender !== (student.gender ?? '') ||
      nationality !== (student.nationality ?? '')
    );
  }

  function formatCpfInput(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  function handleCpfChange(value: string) {
    setCpf(formatCpfInput(value));
  }

  function handleSave() {
    const data: Record<string, unknown> = {};

    if (fullName !== student.fullName) data.fullName = fullName;
    if (grade !== (student.grade ?? '')) data.grade = grade || null;
    if (academicYear !== student.academicYear) data.academicYear = academicYear;
    if (dateOfBirth !== (student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '')) {
      data.dateOfBirth = dateOfBirth || null;
    }
    if (cpf !== (student.cpf ?? '')) {
      data.cpf = cpf ? cpf.replace(/\D/g, '') : null;
    }
    if (gender !== (student.gender ?? '')) data.gender = gender || null;
    if (nationality !== (student.nationality ?? '')) data.nationality = nationality || null;

    updateStudent({ id: student.id, data }, { onSuccess: () => onClose() });
  }

  function handleCancel() {
    setFullName(student.fullName);
    setGrade(student.grade ?? '');
    setAcademicYear(student.academicYear);
    setDateOfBirth(student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '');
    setCpf(student.cpf ?? '');
    setGender(student.gender ?? '');
    setNationality(student.nationality ?? '');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={handleCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h3 className="text-base font-semibold text-neutral-900">Editar dados do aluno</h3>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                Nome Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                minLength={2}
                className={inputClass}
              />
            </div>

            {/* Grid: Turma + Ano */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Turma (Série)
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {gradeOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Ano Letivo
                </label>
                <input
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(Number(e.target.value))}
                  min={2020}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Grid: Data Nascimento + CPF */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf ? formatCpfInput(cpf) : ''}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Grid: Gênero + Nacionalidade */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Gênero
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Nacionalidade
                </label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione...</option>
                  {nationalityOptions.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isPending || !hasChanges() || fullName.trim().length < 2}
            className="px-5 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
