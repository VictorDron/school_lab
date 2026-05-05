import { useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Check, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/lib/api';
import { useStudent, useUpdateStudentField } from '@/hooks/useStudents';
import { getNextGrade } from '@/constants/grades';
import { nationalities } from '@/constants/nationalities';
import { StudentStatusPanel } from './StudentStatusPanel';
import { StudentHistoryTab } from './StudentHistoryTab';
import { StudentDocumentsTab } from './StudentDocumentsTab';
import { StudentContractsTab } from './StudentContractsTab';

type Tab = 'personal' | 'history' | 'documents' | 'contracts';

// ==================== CONSTANTS ====================

const GRADE_OPTIONS = [
  'Nursery', 'Pre-K3', 'Pre-K4', 'Kindergarten',
  '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade',
  '6th Grade', '7th Grade', '8th Grade', '9th Grade',
  '10th Grade', '11th Grade', '12th Grade',
];

const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
];

const NATIONALITY_OPTIONS = nationalities.map((n) => ({ value: n.en, label: n.pt }));

const GENDER_LABELS: Record<string, string> = { M: 'Masculino', F: 'Feminino', O: 'Outro' };

// ==================== HELPERS ====================

function formatCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, 'XXX.XXX.$3-$4');
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Não informado';
  try { return format(parseISO(iso), 'dd/MM/yyyy'); } catch { return 'Não informado'; }
}

function formatNationality(en: string | null): string | null {
  if (!en) return null;
  const found = nationalities.find((n) => n.en === en);
  return found ? found.pt : en;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  try { return format(parseISO(iso), 'yyyy-MM-dd'); } catch { return ''; }
}

// ==================== EDITABLE FIELD ====================

interface EditableFieldProps {
  label: string;
  value: string | null | undefined;
  fieldKey: string;
  endpoint: string;
  studentId: string;
  type?: 'text' | 'date' | 'select' | 'number';
  options?: Array<{ value: string; label: string }>;
  displayValue?: string | null;
  readOnly?: boolean;
}

function EditableField({ label, value, fieldKey, endpoint, studentId, type = 'text', options, displayValue, readOnly }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const updateMutation = useUpdateStudentField(studentId);

  const startEdit = useCallback(() => {
    if (readOnly) return;
    if (type === 'date') {
      setEditValue(toDateInputValue(value ?? null));
    } else {
      setEditValue(value ?? '');
    }
    setIsEditing(true);
  }, [value, type, readOnly]);

  const cancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  const save = useCallback(async () => {
    let saveValue: unknown = editValue || null;
    if (type === 'date' && editValue) {
      saveValue = new Date(editValue).toISOString();
    }
    if (type === 'number' && editValue) {
      saveValue = Number(editValue);
    }

    try {
      await updateMutation.mutateAsync({ endpoint, data: { [fieldKey]: saveValue } });
      setIsEditing(false);
      toast.success('Atualizado!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }, [editValue, type, fieldKey, endpoint, updateMutation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  }, [save, cancel]);

  const shown = displayValue !== undefined ? displayValue : value;

  if (isEditing) {
    return (
      <div>
        <p className="text-xs text-neutral-500 mb-1">{label}</p>
        <div className="flex items-center gap-1.5">
          {type === 'select' && options ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white"
            >
              <option value="">—</option>
              {options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 px-2 py-1 text-sm border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          )}
          <button onClick={save} disabled={updateMutation.isPending}
            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={cancel}
            className="p-1 text-neutral-400 hover:bg-neutral-100 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <p className="text-xs text-neutral-500">{label}</p>
      <div className="flex items-center gap-1.5">
        {shown ? (
          <p className="text-sm font-medium text-neutral-900">{shown}</p>
        ) : (
          <p className="text-sm italic text-neutral-400">Não informado</p>
        )}
        {!readOnly && (
          <button onClick={startEdit}
            className="p-0.5 text-neutral-300 hover:text-violet-600 opacity-0 group-hover:opacity-100 transition-all"
            title="Editar">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Static read-only field (for computed values) */
function DataField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      {value ? (
        <p className="text-sm font-medium text-neutral-900">{value}</p>
      ) : (
        <p className="text-sm italic text-neutral-400">Não informado</p>
      )}
    </div>
  );
}

// ==================== SKELETON & TABS ====================

function SkeletonDetail() {
  return (
    <div className="h-full flex flex-col animate-pulse">
      <div className="p-4 lg:p-6 border-b border-neutral-200">
        <div className="h-4 w-32 bg-neutral-200 rounded mb-4" />
        <div className="h-7 w-64 bg-neutral-200 rounded mb-2" />
        <div className="h-4 w-24 bg-neutral-200 rounded" />
      </div>
      <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-neutral-200 rounded mb-1" />
            <div className="h-5 w-48 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'personal', label: 'Dados Pessoais' },
  { key: 'contracts', label: 'Contratos' },
  { key: 'history', label: 'Histórico' },
  { key: 'documents', label: 'Documentos' },
];

// ==================== MAIN PAGE ====================

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || 'personal';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  const { data, isLoading, isError } = useStudent(id ?? null);

  if (isLoading) return <SkeletonDetail />;

  if (isError || !data?.data) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-lg font-medium text-neutral-700">Aluno não encontrado</p>
        <button onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>
      </div>
    );
  }

  const { student, documents, enrollmentDocuments, emergencyContacts = [], healthData = null, transportData = null, enrollmentInfo = null, healthPlan = null, parents = [] } = data.data;
  const sid = student.id;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Back */}
      <div className="px-4 lg:px-6 pt-4">
        <button onClick={() => navigate('/students')}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para lista
        </button>
      </div>

      {/* Header */}
      <div className="px-4 lg:px-6 pb-4 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">{student.fullName}</h1>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">{student.code}</p>
          </div>
          <StudentStatusPanel student={student} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 px-4 lg:px-6 bg-white">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key ? 'border-violet-600 text-violet-600' : 'border-transparent text-neutral-500 hover:text-neutral-700',
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {activeTab === 'personal' && (
          <div>
            {/* Student data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EditableField label="Nome Completo" value={student.fullName} fieldKey="fullName" endpoint="" studentId={sid} />
              <EditableField label="CPF" value={student.cpf} fieldKey="cpf" endpoint="" studentId={sid}
                displayValue={student.cpf ? formatCpf(student.cpf) : null} />
              <EditableField label="Data de Nascimento" value={student.dateOfBirth} fieldKey="dateOfBirth" endpoint="" studentId={sid} type="date"
                displayValue={formatDate(student.dateOfBirth)} />
              <EditableField label="Gênero" value={student.gender} fieldKey="gender" endpoint="" studentId={sid} type="select"
                options={GENDER_OPTIONS} displayValue={student.gender ? GENDER_LABELS[student.gender] ?? student.gender : null} />
              <EditableField label="Nacionalidade" value={student.nationality} fieldKey="nationality" endpoint="" studentId={sid} type="select"
                options={NATIONALITY_OPTIONS} displayValue={formatNationality(student.nationality)} />
              <EditableField label="Turma" value={student.grade} fieldKey="grade" endpoint="" studentId={sid} type="select"
                options={GRADE_OPTIONS.map((g) => ({ value: g, label: g }))} />
              {student.grade && (
                <DataField label="Próxima Série Sugerida" value={getNextGrade(student.grade) ?? 'Última série'} />
              )}
              <EditableField label="Ano Letivo" value={String(student.academicYear)} fieldKey="academicYear" endpoint="" studentId={sid} type="number" />
              <DataField label="Data de Matrícula" value={formatDate(student.enrolledAt)} />
            </div>

            {/* Enrollment info */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 border-b border-neutral-200 pb-2">Informações de Matrícula</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EditableField label="Curso" value={enrollmentInfo?.course} fieldKey="course" endpoint="/enrollment-info" studentId={sid} />
                <EditableField label="Módulo" value={enrollmentInfo?.module} fieldKey="module" endpoint="/enrollment-info" studentId={sid} />
                <EditableField label="Turma (Classe)" value={enrollmentInfo?.classGroup} fieldKey="classGroup" endpoint="/enrollment-info" studentId={sid} />
                <EditableField label="Campus" value={enrollmentInfo?.campus} fieldKey="campus" endpoint="/enrollment-info" studentId={sid} />
              </div>
            </div>

            {/* Parents */}
            {parents.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 border-b border-neutral-200 pb-2">Responsáveis</h3>
                <div className="space-y-4">
                  {parents.map((p: any) => (
                    <div key={p.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-lg">
                      <EditableField label="Nome" value={p.fullName} fieldKey="fullName" endpoint={`/parents/${p.id}`} studentId={sid} />
                      <DataField label="Tipo" value={p.parentType === 'FATHER' ? 'Pai' : p.parentType === 'MOTHER' ? 'Mãe' : p.parentType === 'LEGAL_GUARDIAN' ? 'Responsável Legal' : p.parentType} />
                      <EditableField label="Telefone" value={p.phone} fieldKey="phone" endpoint={`/parents/${p.id}`} studentId={sid} />
                      <EditableField label="E-mail" value={p.email} fieldKey="email" endpoint={`/parents/${p.id}`} studentId={sid} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency contacts */}
            {emergencyContacts.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3 border-b border-neutral-200 pb-2">Contatos de Emergência</h3>
                <div className="space-y-4">
                  {emergencyContacts.map((c: any) => (
                    <div key={c.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 bg-neutral-50 rounded-lg">
                      <EditableField label="Nome" value={c.name} fieldKey="name" endpoint={`/emergency-contacts/${c.id}`} studentId={sid} />
                      <EditableField label="Parentesco" value={c.relationship} fieldKey="relationship" endpoint={`/emergency-contacts/${c.id}`} studentId={sid} />
                      <EditableField label="Telefone" value={c.phone} fieldKey="phone" endpoint={`/emergency-contacts/${c.id}`} studentId={sid} />
                      <EditableField label="E-mail" value={c.email} fieldKey="email" endpoint={`/emergency-contacts/${c.id}`} studentId={sid} />
                      {c.isPrimary && <span className="text-xs font-medium text-violet-600">Contato principal</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health data */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 border-b border-neutral-200 pb-2">Dados de Saúde</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <EditableField label="Peso" value={healthData?.weight} fieldKey="weight" endpoint="/health" studentId={sid} />
                <EditableField label="Altura" value={healthData?.height} fieldKey="height" endpoint="/health" studentId={sid} />
                <EditableField label="Tipo Sanguíneo" value={healthData?.bloodType} fieldKey="bloodType" endpoint="/health" studentId={sid} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <EditableField label="Detalhes de Alergias" value={healthData?.allergiesNotes} fieldKey="allergiesNotes" endpoint="/health" studentId={sid} />
                <EditableField label="Condições Médicas" value={healthData?.medicalConditionsNotes} fieldKey="medicalConditionsNotes" endpoint="/health" studentId={sid} />
                <EditableField label="Medicamentos de Uso Regular" value={healthData?.regularMedications} fieldKey="regularMedications" endpoint="/health" studentId={sid} />
                <EditableField label="Restrições a Medicamentos" value={healthData?.medicationRestrictions} fieldKey="medicationRestrictions" endpoint="/health" studentId={sid} />
                <EditableField label="Informações Adicionais de Saúde" value={healthData?.additionalHealthInfo} fieldKey="additionalHealthInfo" endpoint="/health" studentId={sid} />
              </div>
            </div>

            {/* Health plan */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 border-b border-neutral-200 pb-2">Plano de Saúde</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EditableField label="Operadora" value={healthPlan?.operator} fieldKey="operator" endpoint="/health-plan" studentId={sid} />
                <EditableField label="Código do Beneficiário" value={healthPlan?.beneficiaryCode} fieldKey="beneficiaryCode" endpoint="/health-plan" studentId={sid} />
                <EditableField label="Tipo do Plano" value={healthPlan?.planType} fieldKey="planType" endpoint="/health-plan" studentId={sid} />
                <EditableField label="Hospital de Preferência" value={healthPlan?.preferredHospital} fieldKey="preferredHospital" endpoint="/health-plan" studentId={sid} />
              </div>
            </div>

            {/* Transport */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3 border-b border-neutral-200 pb-2">Transporte</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EditableField label="Método de Transporte" value={transportData?.transportMethod} fieldKey="transportMethod" endpoint="/transport" studentId={sid} />
                <EditableField label="Outro Transporte" value={transportData?.transportMethodOther} fieldKey="transportMethodOther" endpoint="/transport" studentId={sid} />
                <EditableField label="Empresa de Ônibus Escolar" value={transportData?.schoolBusCompany} fieldKey="schoolBusCompany" endpoint="/transport" studentId={sid} />
                <EditableField label="Contato do Ônibus (Nome)" value={transportData?.schoolBusContactName} fieldKey="schoolBusContactName" endpoint="/transport" studentId={sid} />
                <EditableField label="Contato do Ônibus (Telefone)" value={transportData?.schoolBusContactPhone} fieldKey="schoolBusContactPhone" endpoint="/transport" studentId={sid} />
                <EditableField label="Contato do Ônibus (E-mail)" value={transportData?.schoolBusContactEmail} fieldKey="schoolBusContactEmail" endpoint="/transport" studentId={sid} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contracts' && (
          <StudentContractsTab leadId={student.leadId} />
        )}

        {activeTab === 'history' && (
          <StudentHistoryTab history={student.history ?? []} />
        )}

        {activeTab === 'documents' && (
          <StudentDocumentsTab
            studentId={student.id}
            documents={documents}
            enrollmentDocuments={enrollmentDocuments}
          />
        )}
      </div>
    </div>
  );
}
