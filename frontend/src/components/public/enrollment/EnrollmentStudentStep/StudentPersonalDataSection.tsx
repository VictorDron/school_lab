import { gradeOptions } from '@/constants/grades';
import { formatDateToBR, mapGender } from '@/utils/validation';
import { LockedField } from '@/components/public/shared';

// ---------------------------------------------------------------------------
// StudentPersonalDataSection — locked identity fields plus the only editable
// field in this section, the desired grade. The desired grade form path
// depends on whether the family has more than one child enrolled.
// ---------------------------------------------------------------------------

export interface StudentPersonalDataSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  language: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enrollmentStudents: any[];
  activeStudentTab: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeStudent: any;
}

export function StudentPersonalDataSection({
  register,
  language,
  enrollmentStudents,
  activeStudentTab,
  activeStudent,
}: StudentPersonalDataSectionProps) {
  const isMultiStudent = enrollmentStudents.length > 1;
  const desiredGradePath = isMultiStudent
    ? `studentsEnrollment.${activeStudentTab}.desiredGrade`
    : 'student.desiredGrade';

  return (
    <>
      <h3 className="text-lg font-medium text-neutral-900">
        {language === 'pt' ? 'Dados Pessoais do Aluno' : 'Student Personal Data'}
        {isMultiStudent && (
          <span className="text-primary-600 text-sm font-normal ml-2">
            ({activeStudent?.fullName || `${language === 'pt' ? 'Filho' : 'Child'} ${activeStudentTab + 1}`})
          </span>
        )}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LockedField
          label={language === 'pt' ? 'Nome Completo' : 'Full Name'}
          value={activeStudent?.fullName}
        />
        <LockedField
          label={language === 'pt' ? 'Data de Nascimento' : 'Date of Birth'}
          value={formatDateToBR(activeStudent?.dateOfBirth)}
        />
        <LockedField
          label={language === 'pt' ? 'Gênero' : 'Gender'}
          value={mapGender(activeStudent?.gender, language)}
        />
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            {language === 'pt' ? 'Série Desejada' : 'Desired Grade'}
          </label>
          <select
            key={`desired-grade-${activeStudentTab}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...register(desiredGradePath as any)}
            className="input"
          >
            <option value="">{language === 'pt' ? 'Selecione...' : 'Select...'}</option>
            {gradeOptions.map((grade) => (
              <option key={grade.value} value={grade.value}>{grade.en}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
