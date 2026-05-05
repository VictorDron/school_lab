import { useCallback, useEffect, useState } from 'react';
import type {
  ReEnrollmentChildHealth,
  ReEnrollmentChildTransport,
  ReEnrollmentEmergencyContact,
  ReEnrollmentFinancialResponsible,
  ReEnrollmentFormData,
  ReEnrollmentHealthPlan,
} from '@/types/re-enrollment';
import type {
  AdditionalResponsible,
  AuthorizedPerson,
  FamilyVehicle,
  ParentEmailState,
} from './types';

interface UseReEnrollmentFormStateParams {
  formData: ReEnrollmentFormData | undefined;
}

type ChecklistField = 'medicalConditions' | 'allergies' | 'feverMedications' | 'painMedications';

export interface UseReEnrollmentFormStateReturn {
  health: Partial<ReEnrollmentChildHealth>;
  setHealth: React.Dispatch<React.SetStateAction<Partial<ReEnrollmentChildHealth>>>;
  transport: Partial<ReEnrollmentChildTransport>;
  setTransport: React.Dispatch<React.SetStateAction<Partial<ReEnrollmentChildTransport>>>;
  emergencyContacts: ReEnrollmentEmergencyContact[];
  financial: Partial<ReEnrollmentFinancialResponsible>;
  setFinancial: React.Dispatch<React.SetStateAction<Partial<ReEnrollmentFinancialResponsible>>>;
  healthPlan: Partial<ReEnrollmentHealthPlan>;
  setHealthPlan: React.Dispatch<React.SetStateAction<Partial<ReEnrollmentHealthPlan>>>;
  correctionNotes: string;
  setCorrectionNotes: (value: string) => void;
  parentEmails: ParentEmailState[];
  setParentEmails: React.Dispatch<React.SetStateAction<ParentEmailState[]>>;
  additionalResponsible: AdditionalResponsible;
  setAdditionalResponsible: React.Dispatch<React.SetStateAction<AdditionalResponsible>>;
  showAdditionalResp: boolean;
  setShowAdditionalResp: (value: boolean) => void;
  dropoffPickupPersons: string[];
  authorizedPersons: AuthorizedPerson[];
  familyVehicles: FamilyVehicle[];
  /** Toggle a "NONE"-aware checklist field, mutually exclusive with non-NONE values. */
  handleExclusiveCheckbox: (field: ChecklistField, value: string, checked: boolean) => void;
  /** Add/remove a string from the dropoff/pickup person checklist. */
  handleDropoffPersonChange: (personType: string, checked: boolean) => void;
  addEmergencyContact: () => void;
  removeEmergencyContact: (index: number) => void;
  updateEmergencyContact: (
    index: number,
    field: keyof ReEnrollmentEmergencyContact,
    value: string | boolean
  ) => void;
  addAuthorizedPerson: () => void;
  removeAuthorizedPerson: (index: number) => void;
  updateAuthorizedPerson: (index: number, field: string, value: string) => void;
  addFamilyVehicle: () => void;
  removeFamilyVehicle: (index: number) => void;
  updateFamilyVehicle: (index: number, field: keyof FamilyVehicle, value: string) => void;
}

/**
 * Owns the editable section state of the re-enrollment confirmation form
 * (health, transport with its expanded sub-collections, emergency
 * contacts, financial responsible, health plan, parent emails, and the
 * optional additional responsible). On mount + every formData change it
 * primes the state from `editableSections` and `personalData.parents`.
 * Capacity caps (3 emergency contacts, 5 authorized persons, 10 family
 * vehicles) match the previous inline behavior.
 */
export function useReEnrollmentFormState({
  formData,
}: UseReEnrollmentFormStateParams): UseReEnrollmentFormStateReturn {
  const [health, setHealth] = useState<Partial<ReEnrollmentChildHealth>>({});
  const [transport, setTransport] = useState<Partial<ReEnrollmentChildTransport>>({});
  const [emergencyContacts, setEmergencyContacts] = useState<ReEnrollmentEmergencyContact[]>([]);
  const [financial, setFinancial] = useState<Partial<ReEnrollmentFinancialResponsible>>({});
  const [healthPlan, setHealthPlan] = useState<Partial<ReEnrollmentHealthPlan>>({});
  const [correctionNotes, setCorrectionNotes] = useState('');
  const [parentEmails, setParentEmails] = useState<ParentEmailState[]>([]);
  const [additionalResponsible, setAdditionalResponsible] = useState<AdditionalResponsible>({
    fullName: '',
    email: '',
    phone: '',
    relationship: '',
  });
  const [showAdditionalResp, setShowAdditionalResp] = useState(false);
  const [dropoffPickupPersons, setDropoffPickupPersons] = useState<string[]>([]);
  const [authorizedPersons, setAuthorizedPersons] = useState<AuthorizedPerson[]>([]);
  const [familyVehicles, setFamilyVehicles] = useState<FamilyVehicle[]>([]);

  useEffect(() => {
    if (!formData) return;
    const s = formData.editableSections;
    if (s.health) setHealth(s.health);
    if (s.transport) {
      setTransport(s.transport);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray((s.transport as any).dropoffPickupPersons)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setDropoffPickupPersons((s.transport as any).dropoffPickupPersons);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray((s.transport as any).authorizedPersons)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAuthorizedPersons((s.transport as any).authorizedPersons);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (Array.isArray((s.transport as any).familyVehicles)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setFamilyVehicles((s.transport as any).familyVehicles);
      }
    }
    if (s.emergencyContacts?.length) {
      setEmergencyContacts(s.emergencyContacts);
    } else {
      setEmergencyContacts([{ name: '', phone: '', email: '', relationship: '' }]);
    }
    if (s.financialResponsible) setFinancial(s.financialResponsible);
    if (s.healthPlan) setHealthPlan(s.healthPlan);

    if (formData.personalData?.parents?.length) {
      setParentEmails(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formData.personalData.parents.map((p: any) => ({
          parentId: p.id || '',
          parentType: p.parentType || '',
          fullName: p.fullName || '',
          email: p.email || '',
          phone: p.phone || '',
        }))
      );
    }
  }, [formData]);

  const handleExclusiveCheckbox = useCallback((field: ChecklistField, value: string, checked: boolean) => {
    setHealth((h) => {
      const current = h[field] || [];
      let updated: string[];
      if (value === 'NONE' && checked) {
        updated = ['NONE'];
      } else if (value !== 'NONE' && checked) {
        updated = [...current.filter((v) => v !== 'NONE'), value];
      } else {
        updated = current.filter((v) => v !== value);
      }
      return { ...h, [field]: updated };
    });
  }, []);

  const handleDropoffPersonChange = useCallback((personType: string, checked: boolean) => {
    setDropoffPickupPersons((prev) =>
      checked ? [...prev, personType] : prev.filter((p) => p !== personType)
    );
  }, []);

  const addEmergencyContact = useCallback(() => {
    setEmergencyContacts((prev) => {
      if (prev.length >= 3) return prev;
      return [...prev, { name: '', phone: '', email: '', relationship: '' }];
    });
  }, []);

  const removeEmergencyContact = useCallback((index: number) => {
    setEmergencyContacts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateEmergencyContact = useCallback(
    (index: number, field: keyof ReEnrollmentEmergencyContact, value: string | boolean) => {
      setEmergencyContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
    },
    []
  );

  const addAuthorizedPerson = useCallback(() => {
    setAuthorizedPersons((prev) => {
      if (prev.length >= 5) return prev;
      return [
        ...prev,
        { name: '', bond: '', dateOfBirth: '', cpf: '', email: '', vehicle: { model: '', color: '', plate: '' } },
      ];
    });
  }, []);

  const removeAuthorizedPerson = useCallback((index: number) => {
    setAuthorizedPersons((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateAuthorizedPerson = useCallback((index: number, field: string, value: string) => {
    setAuthorizedPersons((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;
        if (field.startsWith('vehicle.')) {
          const vField = field.replace('vehicle.', '') as keyof FamilyVehicle;
          return { ...p, vehicle: { ...p.vehicle, [vField]: value } };
        }
        return { ...p, [field]: value };
      })
    );
  }, []);

  const addFamilyVehicle = useCallback(() => {
    setFamilyVehicles((prev) => {
      if (prev.length >= 10) return prev;
      return [...prev, { model: '', color: '', plate: '' }];
    });
  }, []);

  const removeFamilyVehicle = useCallback((index: number) => {
    setFamilyVehicles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateFamilyVehicle = useCallback(
    (index: number, field: keyof FamilyVehicle, value: string) => {
      setFamilyVehicles((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
    },
    []
  );

  return {
    health,
    setHealth,
    transport,
    setTransport,
    emergencyContacts,
    financial,
    setFinancial,
    healthPlan,
    setHealthPlan,
    correctionNotes,
    setCorrectionNotes,
    parentEmails,
    setParentEmails,
    additionalResponsible,
    setAdditionalResponsible,
    showAdditionalResp,
    setShowAdditionalResp,
    dropoffPickupPersons,
    authorizedPersons,
    familyVehicles,
    handleExclusiveCheckbox,
    handleDropoffPersonChange,
    addEmergencyContact,
    removeEmergencyContact,
    updateEmergencyContact,
    addAuthorizedPerson,
    removeAuthorizedPerson,
    updateAuthorizedPerson,
    addFamilyVehicle,
    removeFamilyVehicle,
    updateFamilyVehicle,
  };
}
